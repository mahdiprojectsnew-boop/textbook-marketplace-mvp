"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  BookOpen, Plus, MessageCircle, LayoutDashboard,
  LogOut, ChevronDown, Menu, X, Search, User
} from "lucide-react";

interface NavUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  is_academic_verified: boolean;
}

export function TopNav() {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();

  const [user,        setUser]        = useState<NavUser | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [unread,      setUnread]      = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load auth state
  useEffect(() => {
    async function load() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from("users")
        .select("id, first_name, last_name, is_academic_verified")
        .eq("id", authUser.id)
        .single();

      setUser(profile ? {
        id: authUser.id,
        email: authUser.email ?? "",
        first_name: profile.first_name,
        last_name: profile.last_name,
        is_academic_verified: profile.is_academic_verified,
      } : null);
      setLoading(false);
    }
    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") { setUser(null); }
      if (event === "SIGNED_IN")  { load(); }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Unread message count
  useEffect(() => {
    if (!user) return;
    async function loadUnread() {
      const { data: convos } = await supabase
        .from("conversations")
        .select("id")
        .or(`buyer_id.eq.${user!.id},seller_id.eq.${user!.id}`);

      if (!convos?.length) return;
      const ids = convos.map(c => c.id);
      const { count } = await supabase
        .from("conversation_messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", ids)
        .neq("sender_id", user!.id)
        .is("read_at", null);
      setUnread(count ?? 0);
    }
    loadUnread();
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = user?.first_name
    ? `${user.first_name[0]}${user.last_name?.[0] ?? ""}`.toUpperCase()
    : (user?.email?.[0] ?? "U").toUpperCase();

  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name ?? ""}`.trim()
    : user?.email ?? "";

  function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    const active = pathname === href || (href !== "/" && pathname.startsWith(href));
    return (
      <Link href={href} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
        active
          ? "bg-[#eff6ff] text-[#1d4ed8]"
          : "text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9]"
      }`}>
        {children}
      </Link>
    );
  }

  return (
    <header className="bg-white border-b border-[#e5e7eb] sticky top-0 z-50"
      style={{ fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-5 h-14 flex items-center gap-3">

        {/* Logo */}
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 shrink-0 mr-2">
          <div className="w-7 h-7 rounded-lg bg-[#1d4ed8] flex items-center justify-center">
            <BookOpen size={14} className="text-white" />
          </div>
          <span className="font-bold text-[#0f172a] text-sm hidden sm:block tracking-tight">
            Textbook Marketplace
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1">
          <NavLink href="/browse">Browse</NavLink>
          <NavLink href="/listings/new">Sell & Rent</NavLink>
          {user && <NavLink href="/dashboard">Dashboard</NavLink>}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-1.5 ml-auto">

          {/* Messages with badge */}
          {user && (
            <Link href="/messages"
              className="relative p-2 rounded-lg text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] transition">
              <MessageCircle size={18} />
              {unread > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          )}

          {/* Auth state */}
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-[#e5e7eb] animate-pulse" />
          ) : user ? (
            /* User dropdown */
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-lg hover:bg-[#f1f5f9] transition"
              >
                <div className="w-7 h-7 rounded-full bg-[#1d4ed8] flex items-center justify-center text-white text-xs font-bold">
                  {initials}
                </div>
                <ChevronDown size={13} className={`text-[#64748b] transition-transform ${menuOpen ? "rotate-180" : ""}`} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl border border-[#e5e7eb] shadow-lg overflow-hidden z-50">
                  <div className="px-3.5 py-3 border-b border-[#f1f5f9]">
                    <p className="text-xs font-bold text-[#0f172a] truncate">{displayName}</p>
                    <p className="text-[10px] text-[#94a3b8] truncate mt-0.5">{user.email}</p>
                    {user.is_academic_verified && (
                      <span className="inline-block mt-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-50 text-green-700">
                        ✓ Academic Verified
                      </span>
                    )}
                  </div>
                  <div className="p-1">
                    <Link href="/dashboard" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#374151] hover:bg-[#f8fafc] transition">
                      <LayoutDashboard size={14} className="text-[#94a3b8]" />
                      Dashboard
                    </Link>
<Link href="/profile" onClick={() => setMenuOpen(false)}
  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#374151] hover:bg-[#f8fafc] transition">
  <User size={14} className="text-[#94a3b8]" />
  Profile
</Link>
                    <Link href="/listings/new" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#374151] hover:bg-[#f8fafc] transition">
                      <Plus size={14} className="text-[#94a3b8]" />
                      List & Book
                    </Link>
                    <Link href="/messages" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#374151] hover:bg-[#f8fafc] transition">
                      <MessageCircle size={14} className="text-[#94a3b8]" />
                      Messages
                      {unread > 0 && (
                        <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                          {unread}
                        </span>
                      )}
                    </Link>
                  </div>
                  <div className="p-1 border-t border-[#f1f5f9]">
                    <button onClick={signOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition">
                      <LogOut size={14} />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Guest links */
            <div className="hidden md:flex items-center gap-1.5">
              <Link href="/login"
                className="px-3 py-1.5 text-sm font-medium text-[#374151] hover:bg-[#f1f5f9] rounded-lg transition">
                Sign in
              </Link>
              <Link href="/signup"
                className="px-3 py-1.5 text-sm font-semibold text-white bg-[#1d4ed8] hover:bg-[#1e40af] rounded-lg transition">
                Sign up
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button onClick={() => setMobileOpen(v => !v)}
            className="md:hidden p-2 rounded-lg text-[#64748b] hover:bg-[#f1f5f9] transition">
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#f1f5f9] bg-white">
          <div className="px-4 py-3 space-y-1">
            <Link href="/browse" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-[#374151] hover:bg-[#f8fafc]">
              <Search size={15} className="text-[#94a3b8]" /> Browse
            </Link>
            <Link href="/listings/new" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-[#374151] hover:bg-[#f8fafc]">
              <Plus size={15} className="text-[#94a3b8]" /> Sell & Book
            </Link>
            {user ? (
              <>
                <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-[#374151] hover:bg-[#f8fafc]">
                  <LayoutDashboard size={15} className="text-[#94a3b8]" /> Dashboard
                </Link>
                <Link href="/messages" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-[#374151] hover:bg-[#f8fafc]">
                  <MessageCircle size={15} className="text-[#94a3b8]" />
                  Messages {unread > 0 && <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">{unread}</span>}
                </Link>
                <button onClick={signOut} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">
                  <LogOut size={15} /> Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-[#374151] hover:bg-[#f8fafc]">
                  <User size={15} className="text-[#94a3b8]" /> Sign in
                </Link>
                <Link href="/signup" className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#1d4ed8] hover:bg-[#1e40af]">
                  Sign up free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
