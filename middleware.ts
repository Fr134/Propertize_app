import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // Public routes
  if (pathname === "/login" || pathname.startsWith("/api/auth")) {
    if (isLoggedIn && pathname === "/login") {
      // Redirect logged-in users away from login
      const redirectTo = userRole === "MANAGER" ? "/manager" : "/operator";
      return NextResponse.redirect(new URL(redirectTo, req.url));
    }
    return NextResponse.next();
  }

  // API routes for uploadthing
  if (pathname.startsWith("/api/uploadthing")) {
    return NextResponse.next();
  }

  // Not logged in -> redirect to login
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Root redirect based on role
  if (pathname === "/") {
    const redirectTo = userRole === "MANAGER" ? "/manager" : "/operator";
    return NextResponse.redirect(new URL(redirectTo, req.url));
  }

  // Role-based route protection
  if (pathname.startsWith("/manager") && userRole !== "MANAGER") {
    return NextResponse.redirect(new URL("/operator", req.url));
  }

  if (pathname.startsWith("/operator") && userRole !== "OPERATOR") {
    return NextResponse.redirect(new URL("/manager", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
