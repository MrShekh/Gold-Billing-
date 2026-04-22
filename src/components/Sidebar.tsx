"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, FileText, PlusCircle, LogOut } from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";
import { supabase } from "@/lib/supabase";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/bills", label: "Bills", icon: FileText },
  { href: "/bills/new", label: "New Bill", icon: PlusCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user } = useAuth();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>⚜ GoldBill</h1>
        <p>Jewellery Billing System</p>
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
  );
}

