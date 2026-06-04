import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = req.nextUrl

  // Already on auth pages — let through (prevents login→login loop)
  if (pathname === "/login" || pathname === "/signup") {
    if (token) return NextResponse.redirect(new URL("/dashboard", req.url))
    return NextResponse.next()
  }

  if (pathname.startsWith("/admin") && token?.userType !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/profile/:path*",
    "/config/:path*",
    "/login",
    "/signup",
  ],
}
