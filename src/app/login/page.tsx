"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, hasAccount, refresh } = useAuth();
  const [mode, setMode] = useState<"login" | "setup">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [pass, setPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.push("/");
    if (!loading && !hasAccount) setMode("setup");
  }, [user, loading, hasAccount, router]);

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

  const isSetup = mode === "setup";

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "40px 36px", boxShadow: "0 8px 40px rgba(0,0,0,0.3)", boxSizing: "border-box" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 40 }}>⚜</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 8, color: "var(--text-primary)" }}>Gold Billing</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            {isSetup ? "Create your account to get started" : "Professional Gold Ledger System"}
          </p>
        </div>

        {/* Tab strip — only shown when account exists */}
        {!isSetup && (
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Sign in to your account</span>
          </div>
        )}

        {isSetup && (
          <div style={{ background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: "var(--accent)", margin: 0 }}>
              🎉 <strong>First time setup!</strong> Create your account below.
            </p>
          </div>
        )}

        <form onSubmit={isSetup ? handleSetup : handleLogin}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
              {isSetup ? "EMAIL" : "EMAIL or USERNAME"}
            </label>
            <input
              type={isSetup ? "email" : "text"}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              placeholder={isSetup ? "you@example.com" : "email or username"}
            />
          </div>

          {isSetup && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>USERNAME</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                placeholder="e.g. admin"
              />
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>PASSWORD</label>
            <input
              type="password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              required
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              placeholder={isSetup ? "Minimum 8 characters" : "••••••••"}
            />
          </div>

          {isSetup && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>CONFIRM PASSWORD</label>
              <input
                type="password"
                value={confirmPass}
                onChange={e => setConfirmPass(e.target.value)}
                required
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                placeholder="••••••••"
              />
            </div>
          )}

          {err && (
            <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 14, textAlign: "center" }}>⚠️ {err}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "11px 0", fontSize: 15 }}
          >
            {submitting ? "Please wait…" : isSetup ? "Create Account" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
