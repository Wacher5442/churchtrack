import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login"];
const PASTOR_PATHS = ["/pastor"];

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session;
  const path = nextUrl.pathname;

  const isPublicPath = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"));
  const isChangePasswordPage = path === "/changer-mot-de-passe";
  const isPastorRoute = PASTOR_PATHS.some((p) => path === p || path.startsWith(p + "/"));

  if (!isLoggedIn && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isLoggedIn) {
    const { role, mustChangePassword } = session.user;

    if (mustChangePassword && !isChangePasswordPage) {
      return NextResponse.redirect(new URL("/changer-mot-de-passe", nextUrl));
    }

    if (isPublicPath) {
      const dest = role === "ADMIN" ? "/dashboard" : "/pastor/dashboard";
      return NextResponse.redirect(new URL(dest, nextUrl));
    }

    if (isPastorRoute && role !== "PASTOR") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)",
  ],
};
