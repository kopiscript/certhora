import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface Props { params: Promise<{ certId: string }> }

export async function GET(_req: Request, { params }: Props) {
  const { certId } = await params

  const cert = await prisma.certificate.findUnique({
    where: { certId },
    select: { event: { select: { hasBadge: true, badgeUrl: true } } },
  })

  if (!cert) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!cert.event.hasBadge || !cert.event.badgeUrl) {
    return NextResponse.json({ error: "Badge not available" }, { status: 404 })
  }

  // Redirect to the stored image URL (works for both local /uploads and future R2)
  return NextResponse.redirect(
    new URL(cert.event.badgeUrl, process.env.NEXTAUTH_URL ?? "http://localhost:3000")
  )
}
