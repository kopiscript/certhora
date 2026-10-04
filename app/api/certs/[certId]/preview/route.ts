import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { loadRenderContext, renderCertificateImage } from "@/lib/render-certificate"

interface Props { params: Promise<{ certId: string }> }

export async function GET(_req: Request, { params }: Props) {
  const { certId } = await params

  const cert = await prisma.certificate.findUnique({
    where: { certId },
    include: {
      event: {
        include: {
          organizer: { select: { orgName: true } },
          template: true,
        },
      },
    },
  })
  if (!cert) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Serve pre-generated image from R2 if available
  if (cert.imageUrl) {
    return NextResponse.redirect(cert.imageUrl, { status: 302 })
  }

  // Not generated yet: draw it with the exact same code Generate uses, so the
  // preview matches the certificate that will be saved.
  const ctx = await loadRenderContext(cert.event, { fallbackToProcedural: true })
  const finalPng = await renderCertificateImage(ctx, cert)

  return new Response(finalPng.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=300",
    },
  })
}
