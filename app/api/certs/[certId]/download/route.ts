import { NextResponse } from "next/server"
import JSZip from "jszip"
import { prisma } from "@/lib/prisma"

interface Props { params: Promise<{ certId: string }> }

export async function GET(req: Request, { params }: Props) {
  const { certId } = await params

  const cert = await prisma.certificate.findUnique({
    where: { certId },
    select: { event: { select: { hasBadge: true, badgeUrl: true } } },
  })
  if (!cert) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const baseUrl = new URL(req.url).origin
  const certRes = await fetch(`${baseUrl}/api/certs/${certId}/preview`)
  if (!certRes.ok) return NextResponse.json({ error: "Failed to load certificate" }, { status: 502 })
  const certBuffer = Buffer.from(await certRes.arrayBuffer())

  // No badge — just serve the certificate directly, same as before.
  if (!cert.event.hasBadge || !cert.event.badgeUrl) {
    return new Response(certBuffer.buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="certificate-${certId}.png"`,
      },
    })
  }

  const badgeRes = await fetch(cert.event.badgeUrl)
  if (!badgeRes.ok) return NextResponse.json({ error: "Failed to load badge" }, { status: 502 })
  const badgeBuffer = Buffer.from(await badgeRes.arrayBuffer())

  const zip = new JSZip()
  zip.file(`certificate-${certId}.png`, certBuffer)
  zip.file(`badge-${certId}.png`, badgeBuffer)
  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })

  return new Response(zipBuffer.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="certhora-${certId}.zip"`,
    },
  })
}
