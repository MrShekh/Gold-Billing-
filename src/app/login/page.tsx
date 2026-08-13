"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";

type Mode = "login" | "setup" | "forgot" | "verify-otp";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--bg-secondary)",
  color: "var(--text-primary)",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, hasAccount, refresh } = useAuth();
  const [mode, setMode] = useState<Mode>("login");

  // Login / Setup
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [pass, setPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  // Forgot password
  const [fpEmail, setFpEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confNewPass, setConfNewPass] = useState("");

  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.push("/");
    if (!loading && !hasAccount) setMode("setup");
  }, [user, loading, hasAccount, router]);

  // ── Login ──────────────────────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrUsername: email, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Login failed"); return; }
      await refresh();
      router.push("/");
    } catch {
      setErr("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Setup ──────────────────────────────────────────────────────────────────
  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (pass !== confirmPass) { setErr("Passwords do not match"); return; }
    if (pass.length < 8) { setErr("Password must be at least 8 characters"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Setup failed"); return; }
      await refresh();
      router.push("/");
    } catch {
      setErr("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Forgot: send OTP ───────────────────────────────────────────────────────
  async function handleForgotSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setInfo(""); setSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Failed to send OTP"); return; }
      setInfo("OTP sent! Check your email inbox (and spam folder).");
      setMode("verify-otp");
    } catch {
      setErr("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Reset: verify OTP + set new password ──────────────────────────────────
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (newPass !== confNewPass) { setErr("Passwords do not match"); return; }
    if (newPass.length < 6) { setErr("Password must be at least 6 characters"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail, otp, newPassword: newPass }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Reset failed"); return; }
      setInfo("✅ Password reset successfully! You can now sign in.");
      setMode("login");
      setFpEmail(""); setOtp(""); setNewPass(""); setConfNewPass("");
    } catch {
      setErr("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 42, marginBottom: 12 }}>⚜</div>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading…</p>
        </div>
      </div>
    );
  }

  const cardStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: 400,
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    padding: "40px 36px",
    boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
    boxSizing: "border-box",
  };

  // ── Forgot Password screen ─────────────────────────────────────────────────
  if (mode === "forgot") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)", padding: 20 }}>
        <div style={cardStyle}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 36 }}>🔑</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginTop: 8, color: "var(--text-primary)" }}>Forgot Password</h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Enter your registered email to receive an OTP</p>
          </div>
          <form onSubmit={handleForgotSendOtp}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>REGISTERED EMAIL</label>
              <input type="email" value={fpEmail} onChange={e => setFpEmail(e.target.value)} required style={inputStyle} placeholder="you@example.com" />
            </div>
            {err && <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12, textAlign: "center" }}>⚠️ {err}</p>}
            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "11px 0", fontSize: 15 }}>
              {submitting ? "Sending OTP…" : "Send OTP"}
            </button>
          </form>
          <button onClick={() => { setMode("login"); setErr(""); setInfo(""); }} style={{ marginTop: 16, width: "100%", background: "transparent", border: "none", color: "var(--text-muted)", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  // ── Verify OTP + new password screen ──────────────────────────────────────
  if (mode === "verify-otp") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)", padding: 20 }}>
        <div style={cardStyle}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 36 }}>📧</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginTop: 8, color: "var(--text-primary)" }}>Enter OTP</h1>
            {info && <div style={{ background: "rgba(74,207,125,0.1)", border: "1px solid #4acf7d", borderRadius: 8, padding: "8px 12px", marginTop: 10 }}><p style={{ color: "#4acf7d", fontSize: 12, margin: 0 }}>{info}</p></div>}
          </div>
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>6-DIGIT OTP (from email)</label>
              <input type="text" value={otp} onChange={e => setOtp(e.target.value)} required maxLength={6} style={{ ...inputStyle, letterSpacing: 8, textAlign: "center", fontSize: 20, fontWeight: "bold" }} placeholder="• • • • • •" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>NEW PASSWORD</label>
              <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} required style={inputStyle} placeholder="Min 6 characters" />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>CONFIRM NEW PASSWORD</label>
              <input type="password" value={confNewPass} onChange={e => setConfNewPass(e.target.value)} required style={inputStyle} placeholder="••••••••" />
            </div>
            {err && <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12, textAlign: "center" }}>⚠️ {err}</p>}
            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "11px 0", fontSize: 15 }}>
              {submitting ? "Resetting…" : "Reset Password"}
            </button>
          </form>
          <div style={{ textAlign: "center", marginTop: 14 }}>
            <button onClick={() => setMode("forgot")} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
              Resend OTP
            </button>
            <span style={{ color: "var(--text-muted)", margin: "0 8px" }}>·</span>
            <button onClick={() => { setMode("login"); setErr(""); setInfo(""); }} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Login / Setup screen ───────────────────────────────────────────────────
  const isSetup = mode === "setup";

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)", padding: 20 }}>
      <div style={cardStyle}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 40 }}>⚜</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 8, color: "var(--text-primary)" }}>Gold Billing</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            {isSetup ? "Create your account to get started" : "Professional Gold Ledger System"}
          </p>
        </div>

        {isSetup && (
          <div style={{ background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: "var(--accent)", margin: 0 }}>
              🎉 <strong>First time setup!</strong> Create your account below.
            </p>
          </div>
        )}

        {/* Success message (after reset) */}
        {info && mode === "login" && (
          <div style={{ background: "rgba(74,207,125,0.1)", border: "1px solid #4acf7d", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: "#4acf7d", margin: 0 }}>{info}</p>
          </div>
        )}

        <form onSubmit={isSetup ? handleSetup : handleLogin}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
              {isSetup ? "EMAIL" : "EMAIL or USERNAME"}
            </label>
            <input type={isSetup ? "email" : "text"} value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} placeholder={isSetup ? "you@example.com" : "email or username"} />
          </div>

          {isSetup && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>USERNAME</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required style={inputStyle} placeholder="e.g. admin" />
            </div>
          )}

          <div style={{ marginBottom: isSetup ? 14 : 8 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>PASSWORD</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} required style={inputStyle} placeholder={isSetup ? "Minimum 8 characters" : "••••••••"} />
          </div>

          {/* Forgot password link */}
          {!isSetup && (
            <div style={{ textAlign: "right", marginBottom: 18 }}>
              <button type="button" onClick={() => { setMode("forgot"); setErr(""); setInfo(""); }} style={{ background: "transparent", border: "none", color: "var(--accent)", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
                Forgot Password?
              </button>
            </div>
          )}

          {isSetup && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>CONFIRM PASSWORD</label>
              <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} required style={inputStyle} placeholder="••••••••" />
            </div>
          )}

          {err && <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 14, textAlign: "center" }}>⚠️ {err}</p>}

          <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "11px 0", fontSize: 15 }}>
            {submitting ? "Please wait…" : isSetup ? "Create Account" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
