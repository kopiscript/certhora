import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")

  if (id) {
    return NextResponse.redirect(new URL(`/certs/view/${id}`, request.url), 301)
  }

  return NextResponse.redirect(new URL("/", request.url), 301)
}
