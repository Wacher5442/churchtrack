import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session;
  const path = nextUrl.pathname;

  const isAuthPage = path === "/login";
  const isChangePasswordPage = path === "/changer-mot-de-passe";
  const isAdminRoute = path.startsWith("/admin");
  const isPastorRoute = path.startsWith("/pastor");
  const isProtected = isAdminRoute || isPastorRoute || isChangePasswordPage;

  if (!isLoggedIn && isProtected) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isLoggedIn) {
    const { role, mustChangePassword } = session.user;

    if (mustChangePassword && !isChangePasswordPage) {
      return NextResponse.redirect(
        new URL("/changer-mot-de-passe", nextUrl)
      );
    }

    if (isAuthPage) {
      const dest = role === "ADMIN" ? "/admin/dashboard" : "/pastor/dashboard";
      return NextResponse.redirect(new URL(dest, nextUrl));
    }

    if (isAdminRoute && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/pastor/dashboard", nextUrl));
    }

    if (isPastorRoute && role !== "PASTOR") {
      return NextResponse.redirect(new URL("/admin/dashboard", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons).*)",
  ],
};
