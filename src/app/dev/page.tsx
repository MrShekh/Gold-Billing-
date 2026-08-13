"use client";
import { useState } from "react";
import { Shield, Key, Trash2, RefreshCw, User, Mail, Calendar, LogOut, Lock, CheckCircle, AlertTriangle } from "lucide-react";

interface UserRecord {
    id: string;
    email: string;
    username: string;
    phone: string | null;
    createdAt: string;
    hasResetPending: boolean;
}

export default function DevAdminPage() {
    const [secret, setSecret] = useState("");
    const [authed, setAuthed] = useState(false);
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Reset form
    const [resetEmail, setResetEmail] = useState("");
    const [resetPwd, setResetPwd] = useState("");
    const [resetting, setResetting] = useState(false);

    // Delete form
    const [deleteEmail, setDeleteEmail] = useState("");
    const [deleting, setDeleting] = useState(false);

    async function fetchUsers(sec: string) {
        setLoading(true);
        setError("");
        setSuccess("");
        try {
            const res = await fetch("/api/dev/users", {
                headers: { "x-dev-secret": sec },
            });
            if (!res.ok) {
                setError("Invalid secret key or server error.");
                setAuthed(false);
                return;
            }
            const data = await res.json();
            setUsers(data);
            setAuthed(true);
        } catch {
            setError("Connection failed.");
        } finally {
            setLoading(false);
        }
    }

    async function handleResetPassword() {
        if (!resetEmail || !resetPwd) return;
        setResetting(true);
        setError("");
        setSuccess("");
        try {
            const res = await fetch("/api/dev/users", {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-dev-secret": secret },
                body: JSON.stringify({ email: resetEmail, newPassword: resetPwd }),
            });
            const data = await res.json();
            if (data.success) {
                setSuccess(`Password for ${resetEmail} has been reset successfully.`);
                setResetEmail("");
                setResetPwd("");
                await fetchUsers(secret);
            } else {
                setError(data.error || "Reset failed");
            }
        } catch {
            setError("Reset request failed.");
        } finally {
            setResetting(false);
        }
    }

    async function handleDeleteUser() {
        if (!deleteEmail) return;
        if (!confirm(`Are you sure you want to DELETE user: ${deleteEmail} ? This cannot be undone.`)) return;
        setDeleting(true);
        setError("");
        setSuccess("");
        try {
            const res = await fetch("/api/dev/users", {
                method: "DELETE",
                headers: { "Content-Type": "application/json", "x-dev-secret": secret },
                body: JSON.stringify({ email: deleteEmail }),
            });
            const data = await res.json();
            if (data.success) {
                setSuccess(`User ${deleteEmail} has been permanently deleted.`);
                setDeleteEmail("");
                await fetchUsers(secret);
            } else {
                setError(data.error || "Delete failed");
            }
        } catch {
            setError("Delete request failed.");
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div style={{ minHeight: "100vh", background: "#09090e", color: "#f3f4f6", padding: "60px 20px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
            <div style={{ maxWidth: 1000, margin: "0 auto" }}>

                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: 48 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: "50%", background: "rgba(212, 168, 67, 0.1)", border: "1px solid rgba(212, 168, 67, 0.3)", marginBottom: 16 }}>
                        <Shield size={32} style={{ color: "#d4a843" }} />
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.5px" }}>Developer Admin Control</h1>
                    <p style={{ color: "#9ca3af", fontSize: 14, marginTop: 8, fontWeight: 500 }}>Gold Billing System — Internal Management Console</p>
                </div>

                {/* Auth Screen */}
                {!authed ? (
                    <div style={{ maxWidth: 450, margin: "0 auto", background: "#11111a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "32px 36px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                            <Lock size={18} style={{ color: "#d4a843" }} />
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#fff" }}>Security Verification</h3>
                        </div>
                        <p style={{ color: "#9ca3af", fontSize: 13, lineHeight: 1.5, margin: "0 0 20px" }}>
                            Please enter the developer secret key configured in your environment variables to access this console.
                        </p>
                        <div style={{ marginBottom: 20 }}>
                            <input
                                type="password"
                                placeholder="Enter DEV_SECRET key..."
                                value={secret}
                                onChange={e => setSecret(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && fetchUsers(secret)}
                                style={{ width: "100%", background: "#181824", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "12px 16px", color: "#fff", fontSize: 14, outline: "none", transition: "border-color 0.2s" }}
                            />
                        </div>
                        <button
                            onClick={() => fetchUsers(secret)}
                            disabled={loading || !secret}
                            style={{ width: "100%", background: "#d4a843", color: "#000", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 700, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "opacity 0.2s" }}
                        >
                            {loading ? "Verifying..." : "Access Console"}
                        </button>
                        {error && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#f87171", marginTop: 16, fontSize: 13, background: "rgba(248,113,113,0.1)", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(248,113,113,0.2)" }}>
                                <AlertTriangle size={16} />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Notifications */}
                        {error && (
                            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 10, padding: "14px 18px", marginBottom: 24, color: "#f87171", fontSize: 14 }}>
                                <AlertTriangle size={18} />
                                <span>{error}</span>
                            </div>
                        )}
                        {success && (
                            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(74,207,125,0.1)", border: "1px solid rgba(74,207,125,0.2)", borderRadius: 10, padding: "14px 18px", marginBottom: 24, color: "#4acf7d", fontSize: 14 }}>
                                <CheckCircle size={18} />
                                <span>{success}</span>
                            </div>
                        )}

                        {/* Dashboard Grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>

                            {/* Left Column: Registered Users */}
                            <div style={{ background: "#11111a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 28, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <User size={20} style={{ color: "#d4a843" }} />
                                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#fff" }}>Registered Accounts</h3>
                                    </div>
                                    <button
                                        onClick={() => fetchUsers(secret)}
                                        style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 6, padding: "6px 12px", color: "#d1d5db", cursor: "pointer", fontSize: 12, fontWeight: 500, transition: "background 0.2s" }}
                                    >
                                        <RefreshCw size={12} />
                                        <span>Refresh</span>
                                    </button>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    {users.length === 0 ? (
                                        <p style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No users registered yet.</p>
                                    ) : (
                                        users.map(u => (
                                            <div key={u.id} style={{ background: "#181824", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "16px 20px" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>{u.username}</div>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#9ca3af", fontSize: 13, marginTop: 6 }}>
                                                            <Mail size={13} />
                                                            <span>{u.email}</span>
                                                        </div>
                                                        {u.phone && (
                                                            <div style={{ color: "#9ca3af", fontSize: 13, marginTop: 4 }}>
                                                                📱 {u.phone}
                                                            </div>
                                                        )}
                                                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#6b7280", fontSize: 11, marginTop: 8 }}>
                                                            <Calendar size={12} />
                                                            <span>Created: {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                                                        </div>
                                                    </div>
                                                    {u.hasResetPending ? (
                                                        <span style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>
                                                            OTP Pending
                                                        </span>
                                                    ) : (
                                                        <span style={{ background: "rgba(74,207,125,0.12)", border: "1px solid rgba(74,207,125,0.2)", color: "#4acf7d", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>
                                                            Active
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Actions */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

                                {/* Action 1: Force Reset Password */}
                                <div style={{ background: "#11111a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 28 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                                        <Key size={20} style={{ color: "#d4a843" }} />
                                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#fff" }}>Force Reset Password</h3>
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                        <div>
                                            <label style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", display: "block", marginBottom: 6 }}>USER EMAIL</label>
                                            <input
                                                type="email"
                                                placeholder="user@example.com"
                                                value={resetEmail}
                                                onChange={e => setResetEmail(e.target.value)}
                                                style={{ width: "100%", background: "#181824", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none" }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", display: "block", marginBottom: 6 }}>NEW PASSWORD</label>
                                            <input
                                                type="password"
                                                placeholder="Minimum 6 characters"
                                                value={resetPwd}
                                                onChange={e => setResetPwd(e.target.value)}
                                                style={{ width: "100%", background: "#181824", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none" }}
                                            />
                                        </div>
                                        <button
                                            onClick={handleResetPassword}
                                            disabled={resetting || !resetEmail || !resetPwd}
                                            style={{ background: "#d4a843", color: "#000", border: "none", borderRadius: 8, padding: "12px 20px", fontWeight: 700, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "opacity 0.2s" }}
                                        >
                                            {resetting ? "Resetting..." : "Reset Password"}
                                        </button>
                                    </div>
                                </div>

                                {/* Action 2: Delete User Account */}
                                <div style={{ background: "#11111a", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 16, padding: 28 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                                        <Trash2 size={20} style={{ color: "#f87171" }} />
                                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#f87171" }}>Delete User Account</h3>
                                    </div>
                                    <p style={{ color: "#9ca3af", fontSize: 13, lineHeight: 1.5, margin: "0 0 20px" }}>
                                        ⚠️ This permanently deletes the user account. The user will not be able to log in and must register again.
                                    </p>

                                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                        <div>
                                            <label style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", display: "block", marginBottom: 6 }}>USER EMAIL</label>
                                            <input
                                                type="email"
                                                placeholder="user@example.com"
                                                value={deleteEmail}
                                                onChange={e => setDeleteEmail(e.target.value)}
                                                style={{ width: "100%", background: "#181824", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none" }}
                                            />
                                        </div>
                                        <button
                                            onClick={handleDeleteUser}
                                            disabled={deleting || !deleteEmail}
                                            style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid #f87171", borderRadius: 8, padding: "12px 20px", fontWeight: 700, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.2s" }}
                                        >
                                            {deleting ? "Deleting..." : "Delete Account"}
                                        </button>
                                    </div>
                                </div>

                            </div>

                        </div>

                        {/* Footer / Sign Out */}
                        <div style={{ textAlign: "center", marginTop: 48 }}>
                            <button
                                onClick={() => { setAuthed(false); setSecret(""); setUsers([]); }}
                                style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "10px 24px", color: "#9ca3af", cursor: "pointer", fontSize: 13, fontWeight: 500, transition: "all 0.2s" }}
                            >
                                <LogOut size={14} />
                                <span>Exit Developer Console</span>
                            </button>
                        </div>
                    </>
                )}

            </div>
        </div>
    );
}
