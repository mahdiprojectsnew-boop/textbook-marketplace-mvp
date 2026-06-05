import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const { supabaseResponse, user } = await updateSession(request);

  if (pathname.startsWith("/admin")) {
    const isAdminLoginPage = pathname === "/admin/login";
    const adminSession = request.cookies.get("admin_session")?.value;

    if (isAdminLoginPage) {
      return supabaseResponse;
    }

    if (!adminSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  }

  const protectedRoutes = [
    "/dashboard",
    "/profile",
    "/listings/new",
    "/messages",
    "/transactions",
    "/notifications",
  ];

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
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