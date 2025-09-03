import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // Read cookie (set by backend login)
  const token = req.cookies.get("token")?.value;
  console.log("Frontend Middleware Token: ", token);
  // If no token, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // Otherwise, allow request
  return NextResponse.next();
}

// Apply middleware only to protected routes
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"], 
};
