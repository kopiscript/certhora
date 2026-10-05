import "server-only"
import sharp from "sharp"
import type { Template } from "@prisma/client"
import {
  generateCertificateImage,
  buildProceduralTemplate,
  CERT_W,
  CERT_H,
  type NameLayout,
  type QRLayout,
  type CertDesign,
  type URLConfig,
  type AdditionalPlaceholder,
} from "@/lib/certificate-generator"

// Maps a participant's CSV-supplied extra columns (Certificate.metadata, keyed by
// raw column header) onto the template's text placeholders by matching column
// header to placeholder label case-insensitively — e.g. a "Track" column fills
// a placeholder labeled "Track". Falls back to the placeholder's static value
// when no matching column was supplied.
export function buildDynamicValues(
  metadata: unknown,
  placeholders: AdditionalPlaceholder[]
): Record<string, string> | undefined {
  if (!metadata || typeof metadata !== "object" || placeholders.length === 0) return undefined

  const entries = Object.entries(metadata as Record<string, unknown>)
  const dynamicValues: Record<string, string> = {}
  for (const ph of placeholders) {
    const match = entries.find(([key]) => key.trim().toLowerCase() === ph.label.trim().toLowerCase())
    if (match && match[1]) dynamicValues[ph.id] = String(match[1])
  }
  return Object.keys(dynamicValues).length > 0 ? dynamicValues : undefined
}

export interface RenderEvent {
  eventName: string
  organizer: { orgName: string }
  template: Template | null
}

export interface RenderContext {
  templateBuffer: Buffer
  nameLayout: NameLayout
  qrLayout: QRLayout
  design: CertDesign
  urlConfig: URLConfig
  additional: AdditionalPlaceholder[]
}

function proceduralTemplateBuffer(event: RenderEvent): Promise<Buffer> {
  const svg = buildProceduralTemplate({
    eventName: event.eventName,
    organizerName: event.organizer.orgName,
    primaryColor: event.template?.primaryColor ?? "#1D4ED8",
  })
  return sharp(svg).png().toBuffer()
}

// The single source of truth for how a certificate looks. Both "Generate
// Certificates" and the live preview build their drawing inputs here so a
// certificate looks identical before and after it is generated.
// With `fallbackToProcedural`, a missing/unreachable template image falls back
// to the built-in design instead of throwing.
export async function loadRenderContext(
  event: RenderEvent,
  opts: { fallbackToProcedural?: boolean } = {}
): Promise<RenderContext> {
  const tpl = event.template
  let templateBuffer: Buffer

  if (tpl?.imageUrl) {
    try {
      const res = await fetch(
        tpl.imageUrl.startsWith("/")
          ? `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}${tpl.imageUrl}`
          : tpl.imageUrl
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const svgOrImage = Buffer.from(await res.arrayBuffer())
      // Normalize to the canonical canvas so overlay coordinates (stored in
      // 1200×840 space by the template editor) land in the right spot
      // regardless of the uploaded image's native resolution.
      templateBuffer = await sharp(svgOrImage)
        .resize(CERT_W, CERT_H, { fit: "cover" })
        .png()
        .toBuffer()
    } catch (err) {
      if (!opts.fallbackToProcedural) {
        throw new Error(`Failed to load template image: ${(err as Error).message}`)
      }
      templateBuffer = await proceduralTemplateBuffer(event)
    }
  } else {
    templateBuffer = await proceduralTemplateBuffer(event)
  }

  return {
    templateBuffer,
    nameLayout: {
      centerX: tpl?.nameCenterX ?? 600,
      y: tpl?.nameY ?? 340,
      maxWidth: tpl?.nameMaxWidth ?? 840,
      maxHeight: tpl?.nameHeight ?? null,
      defaultFontSize: tpl?.nameFontSize ?? 52,
      nameFont: tpl?.nameFont ?? "Arial, Helvetica, sans-serif",
      nameColor: tpl?.nameColor ?? "#1E293B",
    },
    qrLayout: {
      x: tpl?.qrX ?? 1010,
      y: tpl?.qrY ?? 628,
      size: tpl?.qrSize ?? 140,
    },
    design: {
      certIdFont: tpl?.certIdFont ?? "monospace",
      certIdColor: tpl?.certIdColor ?? "#64748B",
      showWatermark: tpl?.showWatermark ?? false,
    },
    urlConfig: {
      baseUrl: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
      viewPageName: "view",
    },
    additional: (tpl?.additional ?? []) as unknown as AdditionalPlaceholder[],
  }
}

export async function renderCertificateImage(
  ctx: RenderContext,
  cert: { certId: string; participantName: string; metadata: unknown }
): Promise<Buffer> {
  const out = await generateCertificateImage(
    ctx.templateBuffer,
    {
      certId: cert.certId,
      name: cert.participantName,
      dynamicValues: buildDynamicValues(cert.metadata, ctx.additional),
    },
    ctx.nameLayout,
    ctx.qrLayout,
    ctx.design,
    ctx.urlConfig,
    undefined,
    ctx.additional
  )
  return out.imageBuffer
}
