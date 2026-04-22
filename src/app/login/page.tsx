"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab]       = useState<"login" | "signup">("login");
  const [email, setEmail]   = useState("");
  const [pass, setPass]     = useState("");
  const [err, setErr]       = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setLoading(true);
    if (tab === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) setErr(error.message);
      else router.push("/");
    } else {
      const { error } = await supabase.auth.signUp({ email, password: pass });
      if (error) setErr(error.message);
      else { setErr(""); alert("Account created! Please login."); setTab("login"); }
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
      <div style={{ width: 380, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "40px 36px", boxShadow: "0 8px 40px rgba(0,0,0,0.3)" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 36 }}>🪙</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 8, color: "var(--text-primary)" }}>Gold Billing</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Professional Gold Ledger System</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", background: "var(--bg-secondary)", borderRadius: 8, padding: 3, marginBottom: 24 }}>
          {(["login", "signup"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: "8px 0", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit",
              background: tab === t ? "var(--accent)" : "transparent",
              color: tab === t ? "#000" : "var(--text-muted)",
              transition: "all 0.2s"
            }}>
              {t === "login" ? "Login" : "Sign Up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>EMAIL</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              placeholder="you@example.com" />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>PASSWORD</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} required
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              placeholder="••••••••" />
          </div>
          {err && <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 14, textAlign: "center" }}>⚠️ {err}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "11px 0", fontSize: 15 }}>
            {loading ? "Please wait…" : tab === "login" ? "Login" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
