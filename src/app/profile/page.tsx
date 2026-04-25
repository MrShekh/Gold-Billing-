"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/lib/AuthProvider";
import { getProfile, updateProfile, getWhatsAppSettings, updateWhatsAppSettings, Profile, WhatsAppSettings } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { Save, LogOut, Download, Upload, MessageCircle, AlertCircle, RefreshCw } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingWhatsApp, setSavingWhatsApp] = useState(false);
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  
  const [profileMsg, setProfileMsg] = useState("");
  const [whatsappMsg, setWhatsappMsg] = useState("");
  
  const [profile, setProfile] = useState<Partial<Profile>>({
    business_name: "", owner_name: "", phone: "", email: "", address: "", city: "", gst_no: ""
  });
  
  const [whatsapp, setWhatsapp] = useState<Partial<WhatsAppSettings>>({
    phone_number_id: "", access_token: "", enabled: false
  });

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const p = await getProfile();
        if (mounted && p) setProfile(p);
        const w = await getWhatsAppSettings();
        if (mounted && w) setWhatsapp(w);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (user) {
      load();
    } else {
      // If user is null (not logged in or auth is still initializing), 
      // we might want to wait for AuthProvider to resolve, but for now 
      // we can set loading to false after a short timeout to prevent infinite loading
      const t = setTimeout(() => { if(mounted) setLoading(false); }, 1000);
      return () => clearTimeout(t);
    }
    return () => { mounted = false; };
  }, [user]);

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

  const handleWhatsAppSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWhatsApp(true);
    setWhatsappMsg("");
    try {
      await updateWhatsAppSettings(whatsapp);
      setWhatsappMsg("WhatsApp settings saved");
      setTimeout(() => setWhatsappMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setWhatsappMsg("Error saving WhatsApp settings");
    } finally {
      setSavingWhatsApp(false);
    }
  };

  const testWhatsApp = async () => {
    if (!whatsapp.phone_number_id || !whatsapp.access_token) {
      alert("Please save Phone Number ID and Access Token first.");
      return;
    }
    const testPhone = prompt("Enter a phone number to send a test message to (with country code, e.g., 919876543210):");
    if (!testPhone) return;

    setTestingWhatsApp(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      
      const res = await fetch("/api/whatsapp/test", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ phone: testPhone }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Test message sent successfully!");
      } else {
        alert("Error sending test message: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error sending test message");
    } finally {
      setTestingWhatsApp(false);
    }
  };

  const handleFullBackup = async () => {
    // Basic implementation: fetch all bills, items, payments, customers, balances
    setBackupLoading(true);
    try {
      const [{ data: bills }, { data: items }, { data: payments }, { data: customers }, { data: balances }] = await Promise.all([
        supabase.from("bills").select("*"),
        supabase.from("bill_items").select("*"),
        supabase.from("payment_entries").select("*"),
        supabase.from("customers").select("*"),
        supabase.from("customer_balance").select("*")
      ]);
      
      const backupData = {
        timestamp: new Date().toISOString(),
        bills, items, payments, customers, balances
      };
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
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
      alert("Backup failed");
    } finally {
      setBackupLoading(false);
    }
  };
  
  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!confirm("WARNING: This will delete ALL your current data and replace it with the backup. Are you sure you want to proceed?")) {
      e.target.value = '';
      return;
    }
    
    setBackupLoading(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.bills || !data.customers) {
        throw new Error("Invalid backup format");
      }
      
      // Note: A robust restore would require careful deletion and insertion in correct order
      // handling foreign key constraints. For now we will just show a message.
      alert("Restore functionality is currently complex due to foreign keys. In a real scenario, we would call an edge function or process the data in order (Customers -> Bills -> Items/Payments).");
      
    } catch (err) {
      console.error("Restore failed", err);
      alert("Restore failed: " + (err as Error).message);
    } finally {
      setBackupLoading(false);
      e.target.value = '';
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div className="main-layout" style={{ flex: 1, opacity: loading ? 0.5 : 1, transition: "opacity 0.2s" }}>
        <div className="page-header">
          <h2>Settings</h2>
        </div>
        
        <div className="page-content" style={{ maxWidth: "100%" }}>
          
          {/* Profile Section */}
          <div className="form-card mb-4" style={{ padding: 24, background: "var(--bg-secondary)", borderRadius: 12, border: "1px solid var(--border)" }}>
            <h3 style={{ marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>Business Information</h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>This information will be printed on your bills.</p>
            
            <form onSubmit={handleProfileSave}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label className="form-label">Business Name</label>
                  <input type="text" className="form-input" value={profile.business_name || ""} onChange={e => setProfile({...profile, business_name: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Owner Name</label>
                  <input type="text" className="form-input" value={profile.owner_name || ""} onChange={e => setProfile({...profile, owner_name: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input type="text" className="form-input" value={profile.phone || ""} onChange={e => setProfile({...profile, phone: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={profile.email || ""} onChange={e => setProfile({...profile, email: e.target.value})} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">Address</label>
                  <input type="text" className="form-input" value={profile.address || ""} onChange={e => setProfile({...profile, address: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">City</label>
                  <input type="text" className="form-input" value={profile.city || ""} onChange={e => setProfile({...profile, city: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">GST No.</label>
                  <input type="text" className="form-input" value={profile.gst_no || ""} onChange={e => setProfile({...profile, gst_no: e.target.value})} />
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

          {/* WhatsApp Section */}
          <div className="form-card mb-4" style={{ padding: 24, background: "var(--bg-secondary)", borderRadius: 12, border: "1px solid var(--border)" }}>
            <div className="flex-between" style={{ borderBottom: "1px solid var(--border)", paddingBottom: 8, marginBottom: 16 }}>
              <h3 className="flex items-center gap-2"><MessageCircle size={18} color="#25D366" /> WhatsApp Integration</h3>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
              Scan the QR code below using your WhatsApp app (Settings → Linked Devices) to connect your account.
            </p>
            
            <div style={{ 
              width: "100%", 
              height: 500, 
              background: "#f8fafc", 
              borderRadius: 12, 
              overflow: "hidden",
              border: "1px solid var(--border)",
              marginBottom: 16
            }}>
              <iframe 
                src="http://localhost:5001/qr" 
                style={{ width: "100%", height: "100%", border: "none" }}
                title="WhatsApp QR Login"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                className="btn btn-secondary" 
                style={{ color: "var(--danger)", border: "1px solid var(--danger)" }}
                onClick={async () => {
                  if (confirm("Disconnect WhatsApp session?")) {
                    try {
                      await fetch("http://localhost:5001/disconnect", { method: "POST" });
                      alert("Disconnected successfully");
                      // The iframe will auto-refresh to show QR code again
                    } catch (e) {
                      console.error(e);
                      alert("Failed to disconnect");
                    }
                  }
                }}
              >
                Disconnect Session
              </button>
            </div>
          </div>

          {/* Backup & Restore */}
          <div className="form-card mb-4" style={{ padding: 24, background: "var(--bg-secondary)", borderRadius: 12, border: "1px solid var(--border)" }}>
            <h3 style={{ marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>Backup & Restore</h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>Download your data as a JSON file or restore from a previous backup.</p>
            
            <div className="flex gap-4">
              <button className="btn btn-secondary flex items-center gap-2" onClick={handleFullBackup} disabled={backupLoading}>
                <Download size={16} /> Download Full Backup
              </button>
              
              <label className="btn btn-secondary flex items-center gap-2 cursor-pointer" style={backupLoading ? { opacity: 0.5, pointerEvents: 'none' } : {}}>
                <Upload size={16} /> Restore from JSON
                <input type="file" accept=".json" style={{ display: "none" }} onChange={handleRestore} disabled={backupLoading} />
              </label>
            </div>
          </div>

          {/* Account */}
          <div className="form-card" style={{ padding: 24, background: "rgba(224, 90, 90, 0.05)", borderRadius: 12, border: "1px solid rgba(224, 90, 90, 0.2)" }}>
            <h3 style={{ color: "var(--danger)", marginBottom: 16, borderBottom: "1px solid rgba(224, 90, 90, 0.2)", paddingBottom: 8 }}>Account</h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>Logged in as: {user?.email}</p>
            
            <button className="btn flex items-center gap-2" style={{ background: "var(--danger)", color: "#fff", padding: "8px 16px", borderRadius: 8 }} onClick={handleLogout}>
              <LogOut size={16} /> Sign Out
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
