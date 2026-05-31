import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { jwtVerify } from "jose";

const PROTECTED_USER_ROUTES = [
  "/dashboard",
  "/listings/new",
  "/transactions",
  "/messages",
  "/notifications",
  "/profile",
  "/onboarding",
];

const ADMIN_ROUTES = ["/admin"];
const AUTH_ONLY_ROUTES = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── ADMIN ROUTES ──────────────────────────────────────────
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const adminSession = request.cookies.get("admin_session");
    if (!adminSession) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    try {
      const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
      await jwtVerify(adminSession.value, secret);
    } catch {
      const res = NextResponse.redirect(new URL("/admin/login", request.url));
      res.cookies.delete("admin_session");
      return res;
    }
    return NextResponse.next();
  }

  // ── SUPABASE SESSION REFRESH (all other routes) ───────────
  const { supabaseResponse, user } = await updateSession(request);

  // ── REDIRECT LOGGED-IN USERS AWAY FROM AUTH PAGES ─────────
  const isAuthRoute = AUTH_ONLY_ROUTES.some((r) => pathname.startsWith(r));
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ── PROTECT USER ROUTES ────────────────────────────────────
  const isProtected = PROTECTED_USER_ROUTES.some((r) => pathname.startsWith(r));
  if (isProtected && !user) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
