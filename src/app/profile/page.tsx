"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/lib/AuthProvider";
import { getProfile, updateProfile, Profile } from "@/lib/db";
import { Save, LogOut, Download, HardDrive } from "lucide-react";
import InstallApp from "@/components/InstallApp";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  const [profile, setProfile] = useState<Partial<Profile>>({
    business_name: "", owner_name: "", phone: "", email: "", address: "", city: "", gst_no: ""
  });

  const [theme, setTheme] = useState("light");

  // Resize the chosen logo to a small PNG data URL so it stays light to store/load
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { setProfileMsg("Please choose an image file"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX = 300;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setProfile((p) => ({ ...p, logo: canvas.toDataURL("image/png") }));
        setProfileMsg("Logo selected - click Save to apply it on bills");
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const t = localStorage.getItem("theme") || "light";
    setTheme(t);
  }, []);

  const toggleTheme = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const p = await getProfile();
        if (mounted && p) setProfile(p);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg("");
    try {
      await updateProfile(profile);
      setProfileMsg("Profile saved successfully");
      setTimeout(() => setProfileMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setProfileMsg("Error saving profile");
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Local Backup Download ─────────────────────────────────────────────────
  const handleLocalBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) throw new Error("Backup failed");
      const data = await res.json();

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `goldbill-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Backup failed", err);
      alert("Backup failed. Please try again.");
    } finally {
      setBackupLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div className="main-layout" style={{ flex: 1, opacity: loading ? 0.5 : 1, transition: "opacity 0.2s" }}>
        <div className="page-header">
          <h2>Settings</h2>
        </div>

        <div className="page-content" style={{ maxWidth: "100%" }}>

          {/* Install as app (Android prompt / iPhone instructions) */}
          <InstallApp />

          {/* Business Profile */}
          <div className="form-card settings-card mb-4" style={{ padding: 24, background: "var(--bg-secondary)", borderRadius: 12, border: "1px solid var(--border)" }}>
            <h3 style={{ marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>Business Information</h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>This information will be printed on your bills.</p>

            <form onSubmit={handleProfileSave}>
              <div className="profile-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">Business Logo</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                    <div style={{ width: 72, height: 72, border: "1px dashed var(--border-light)", borderRadius: 10, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                      {profile.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profile.logo} alt="Business logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                      ) : (
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>No logo</span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <label className="btn btn-secondary" style={{ cursor: "pointer" }}>
                        {profile.logo ? "Change Logo" : "Upload Logo"}
                        <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: "none" }} />
                      </label>
                      {profile.logo && (
                        <button type="button" className="btn btn-secondary" style={{ color: "var(--danger)" }} onClick={() => setProfile({ ...profile, logo: "" })}>
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>Shown at the top of your bills. Click Save after changing.</p>
                </div>
                <div>
                  <label className="form-label">Business Name</label>
                  <input type="text" className="form-input" value={profile.business_name || ""} onChange={e => setProfile({ ...profile, business_name: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Owner Name</label>
                  <input type="text" className="form-input" value={profile.owner_name || ""} onChange={e => setProfile({ ...profile, owner_name: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input type="text" className="form-input" value={profile.phone || ""} onChange={e => setProfile({ ...profile, phone: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={profile.email || ""} onChange={e => setProfile({ ...profile, email: e.target.value })} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">Address</label>
                  <input type="text" className="form-input" value={profile.address || ""} onChange={e => setProfile({ ...profile, address: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">City</label>
                  <input type="text" className="form-input" value={profile.city || ""} onChange={e => setProfile({ ...profile, city: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">GST No.</label>
                  <input type="text" className="form-input" value={profile.gst_no || ""} onChange={e => setProfile({ ...profile, gst_no: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                  <Save size={16} /> {savingProfile ? "Saving..." : "Save Profile"}
                </button>
                {profileMsg && <span style={{ color: "var(--success)", fontSize: 13 }}>{profileMsg}</span>}
              </div>
            </form>
          </div>

          {/* Theme Settings */}
          <div className="form-card settings-card mb-4" style={{ padding: 24, background: "var(--bg-secondary)", borderRadius: 12, border: "1px solid var(--border)" }}>
            <h3 style={{ marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>Theme Settings</h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>Choose your preferred interface theme.</p>
            <div className="settings-theme-row" style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                className={`btn ${theme === "light" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => toggleTheme("light")}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                ☀️ Light Mode
              </button>
              <button
                type="button"
                className={`btn ${theme === "dark" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => toggleTheme("dark")}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                🌙 Dark Mode
              </button>
            </div>
          </div>

          {/* Local Backup */}
          <div className="form-card settings-card mb-4" style={{ padding: 24, background: "var(--bg-secondary)", borderRadius: 12, border: "1px solid rgba(212,168,67,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
              <HardDrive size={18} color="var(--accent)" />
              <h3 style={{ margin: 0, color: "var(--accent)" }}>Save Data Locally</h3>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>
              Download a complete backup of all your data to your computer.
            </p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
              Includes: <strong>Customers</strong>, <strong>Bills</strong>, <strong>Bill Items</strong>, and <strong>Jama Balances</strong>.
            </p>

            <div style={{ background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.2)", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>
                📁 File will be saved to your <strong>Downloads</strong> folder as a <code>.json</code> file.<br />
                You can use this file as a backup or to restore data later.
              </p>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleLocalBackup}
              disabled={backupLoading}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <Download size={16} />
              {backupLoading ? "Preparing Backup…" : "⬇ Download Local Backup"}
            </button>
          </div>

          {/* Account */}
          <div className="form-card settings-card" style={{ padding: 24, background: "rgba(224, 90, 90, 0.05)", borderRadius: 12, border: "1px solid rgba(224, 90, 90, 0.2)" }}>
            <h3 style={{ color: "var(--danger)", marginBottom: 16, borderBottom: "1px solid rgba(224, 90, 90, 0.2)", paddingBottom: 8 }}>Account</h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>
              👤 <strong>{user?.username}</strong>
            </p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
              📧 {user?.email}
            </p>
            <button
              className="btn flex items-center gap-2"
              style={{ background: "var(--danger)", color: "#fff", padding: "8px 16px", borderRadius: 8 }}
              onClick={handleLogout}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
