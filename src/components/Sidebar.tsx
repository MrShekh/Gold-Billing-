"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, FileText, PlusCircle, LogOut, Menu, X, Settings } from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";
import { supabase } from "@/lib/supabase";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/bills", label: "Bills", icon: FileText },
  { href: "/bills/new", label: "New Bill", icon: PlusCircle },
  { href: "/profile", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on route change for mobile
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="mobile-header">
        <h1>⚜ GoldBill</h1>
        <button className="menu-toggle" onClick={() => setIsOpen(true)}>
          <Menu size={24} />
        </button>
      </div>

      {/* Overlay for mobile */}
      <div 
        className={`sidebar-overlay ${isOpen ? "open" : ""}`} 
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-logo flex-between" style={{ padding: "24px 20px" }}>
          <div>
            <h1>⚜ GoldBill</h1>
            <p>Jewellery Billing System</p>
          </div>
          {/* Close button for mobile inside sidebar */}
          <button 
            className="menu-toggle" 
            style={{ display: "none" /* Handled by CSS to show only on mobile if needed, but actually we can just show it when isOpen is true on mobile. We'll add a class for it */ }} 
            onClick={() => setIsOpen(false)}
          >
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={`nav-item ${active ? "active" : ""}`}>
                <Icon className="nav-icon" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)" }}>
          {user && (
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10, wordBreak: "break-all" }}>
              ☁️ {user.email}
            </p>
          )}
          <button onClick={logout} style={{
            display: "flex", alignItems: "center", gap: 8, background: "none",
            border: "1px solid var(--border)", borderRadius: 8, padding: "7px 12px",
            color: "var(--danger)", fontSize: 12, cursor: "pointer", width: "100%", fontFamily: "inherit"
          }}>
            <LogOut size={13} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}

