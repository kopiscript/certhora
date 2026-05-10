import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

const protectedPrefixes = ["/dashboard"]
const authRoutes = ["/login"]

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = req.nextUrl

  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p))
  const isAuthRoute = authRoutes.includes(pathname)

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
