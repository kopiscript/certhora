import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import type { NextRequest } from "next/server";

const handler = NextAuth(authOptions);

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ nextauth: string[] }> }
) {
  return handler(req, ctx as never);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ nextauth: string[] }> }
) {
  return handler(req, ctx as never);
}
