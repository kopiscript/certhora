import sharp from "sharp"
import QRCode from "qrcode"

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface NameLayout {
  centerX: number
  y: number
  maxWidth: number
  defaultFontSize: number
  nameColor: string
  nameFont: string
}

export interface QRLayout {
  x: number
  y: number
  size: number
}

export interface CertDesign {
  certIdFont: string
  certIdColor: string
  showWatermark: boolean
}

export interface URLConfig {
  baseUrl: string
  viewPageName: string
}

export interface ParticipantInput {
  certId: string
  name: string
}

export interface CertificateOutput {
  certId: string
  name: string
  qrUrl: string
  imageBuffer: Buffer
}

// ─── Font scaling ─────────────────────────────────────────────────────────────

// Average character width ratio for proportional sans-serif fonts (e.g. Arial).
// Empirical: ~0.55× the font size per character is a safe upper bound.
const CHAR_WIDTH_RATIO = 0.55
const MIN_FONT_SIZE = 14

export function calcScaledFontSize(
  name: string,
  defaultFontSize: number,
  maxWidth: number
): number {
  const estimated = name.length * defaultFontSize * CHAR_WIDTH_RATIO
  if (estimated <= maxWidth) return defaultFontSize
  const scaled = Math.floor(maxWidth / (name.length * CHAR_WIDTH_RATIO))
  return Math.max(scaled, MIN_FONT_SIZE)
}

// ─── XML escape ───────────────────────────────────────────────────────────────

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

// ─── SVG overlays ─────────────────────────────────────────────────────────────

function buildNameSVG(
  canvasW: number,
  canvasH: number,
  name: string,
  layout: NameLayout
): Buffer {
  const fontSize = calcScaledFontSize(name, layout.defaultFontSize, layout.maxWidth)

  const svg = `<svg width="${canvasW}" height="${canvasH}" xmlns="http://www.w3.org/2000/svg">
  <text
    x="${layout.centerX}"
    y="${layout.y}"
    text-anchor="middle"
    dominant-baseline="middle"
    font-family="${escapeXml(layout.nameFont)}"
    font-size="${fontSize}px"
    font-weight="bold"
    fill="${escapeXml(layout.nameColor)}"
  >${escapeXml(name)}</text>
</svg>`

  return Buffer.from(svg)
}

function buildCertIdSVG(
  canvasW: number,
  canvasH: number,
  certId: string,
  qrLayout: QRLayout,
  design: CertDesign
): Buffer {
  const x = qrLayout.x + qrLayout.size / 2
  const y = qrLayout.y + qrLayout.size + 18

  const svg = `<svg width="${canvasW}" height="${canvasH}" xmlns="http://www.w3.org/2000/svg">
  <text
    x="${x}"
    y="${y}"
    text-anchor="middle"
    dominant-baseline="auto"
    font-family="${escapeXml(design.certIdFont)}"
    font-size="11px"
    fill="${escapeXml(design.certIdColor)}"
    letter-spacing="1"
  >CERT ID: ${escapeXml(certId)}</text>
</svg>`

  return Buffer.from(svg)
}

// ─── QR generation ────────────────────────────────────────────────────────────

async function buildQRBuffer(
  url: string,
  size: number,
  logoBuffer?: Buffer,
  showWatermark = false
): Promise<Buffer> {
  // Use error correction H when overlaying a logo (covers up to 30% of QR)
  const ecLevel = showWatermark && logoBuffer ? "H" : "M"

  const raw = await QRCode.toBuffer(url, {
    type: "png",
    width: size,
    margin: 1,
    color: { dark: "#000000", light: "#FFFFFF" },
    errorCorrectionLevel: ecLevel,
  })

  if (!showWatermark || !logoBuffer) {
    return sharp(raw).resize(size, size).png().toBuffer()
  }

  // Overlay logo centered — ~22% of QR size
  const logoSize = Math.round(size * 0.22)
  const offset = Math.round((size - logoSize) / 2)

  const logoResized = await sharp(logoBuffer)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer()

  return sharp(raw)
    .resize(size, size)
    .composite([{ input: logoResized, top: offset, left: offset }])
    .png()
    .toBuffer()
}

// ─── Procedural template ─────────────────────────────────────────────────────

/**
 * Generates a certificate background SVG (1200×840) with event/organizer branding.
 * Used when no custom template image has been uploaded.
 */
export function buildProceduralTemplate(opts: {
  eventName: string
  organizerName: string
  primaryColor?: string
  width?: number
  height?: number
}): Buffer {
  const {
    eventName,
    organizerName,
    primaryColor = "#1D4ED8",
    width = 1200,
    height = 840,
  } = opts

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#FAFBFF"/>
  <rect width="${width}" height="108" fill="${escapeXml(primaryColor)}"/>
  <rect y="${height - 58}" width="${width}" height="58" fill="${escapeXml(primaryColor)}"/>
  <rect width="6" height="${height}" fill="${escapeXml(primaryColor)}"/>
  <rect x="${width - 6}" width="6" height="${height}" fill="${escapeXml(primaryColor)}"/>
  <rect x="28" y="28" width="${width - 56}" height="${height - 56}" rx="2"
        fill="none" stroke="rgba(37,99,235,0.12)" stroke-width="1"/>

  <!-- Corner marks -->
  <rect x="44" y="120" width="48" height="2" fill="rgba(37,99,235,0.25)"/>
  <rect x="44" y="120" width="2" height="48" fill="rgba(37,99,235,0.25)"/>
  <rect x="${width - 92}" y="120" width="48" height="2" fill="rgba(37,99,235,0.25)"/>
  <rect x="${width - 50}" y="120" width="2" height="48" fill="rgba(37,99,235,0.25)"/>
  <rect x="44" y="${height - 170}" width="48" height="2" fill="rgba(37,99,235,0.25)"/>
  <rect x="44" y="${height - 168}" width="2" height="48" fill="rgba(37,99,235,0.25)"/>
  <rect x="${width - 92}" y="${height - 170}" width="48" height="2" fill="rgba(37,99,235,0.25)"/>
  <rect x="${width - 50}" y="${height - 168}" width="2" height="48" fill="rgba(37,99,235,0.25)"/>

  <!-- Header -->
  <text x="${width / 2}" y="52" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="11" fill="rgba(255,255,255,0.7)" letter-spacing="5">
    CERTIFICATE OF COMPLETION
  </text>
  <text x="${width / 2}" y="83" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="20" font-weight="bold" fill="white">
    ${escapeXml(eventName)}
  </text>

  <!-- Organiser -->
  <text x="${width / 2}" y="152" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="11" fill="#94A3B8" letter-spacing="4">
    ISSUED BY  ${escapeXml(organizerName.toUpperCase())}
  </text>

  <!-- Lead-in -->
  <text x="${width / 2}" y="232" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="16" fill="#94A3B8" font-style="italic">
    This is to certify that
  </text>

  <!-- Rules around name area -->
  <line x1="160" y1="252" x2="${width - 160}" y2="252" stroke="#E2E8F0" stroke-width="1"/>
  <line x1="160" y1="400" x2="${width - 160}" y2="400" stroke="#E2E8F0" stroke-width="1"/>
  <line x1="${width / 2 - 120}" y1="400" x2="${width / 2 + 120}" y2="400"
        stroke="${escapeXml(primaryColor)}" stroke-width="2"/>

  <!-- "has successfully completed" -->
  <text x="${width / 2}" y="445" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="16" fill="#94A3B8" font-style="italic">
    has successfully completed the programme
  </text>

  <!-- Bottom divider -->
  <line x1="160" y1="648" x2="${width - 260}" y2="648" stroke="#F1F5F9" stroke-width="1"/>

  <!-- Footer bar text -->
  <text x="${width / 2}" y="${height - 18}" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="10" fill="rgba(255,255,255,0.55)" letter-spacing="3">
    CERTHORA.COM  ·  VERIFIED DIGITAL CERTIFICATE
  </text>
</svg>`

  return Buffer.from(svg)
}

// ─── Core generator ───────────────────────────────────────────────────────────

export async function generateCertificateImage(
  templateBuffer: Buffer,
  participant: ParticipantInput,
  nameLayout: NameLayout,
  qrLayout: QRLayout,
  design: CertDesign,
  urlConfig: URLConfig,
  logoBuffer?: Buffer
): Promise<CertificateOutput> {
  const qrUrl = buildCertUrl(urlConfig, participant.certId)

  const meta = await sharp(templateBuffer).metadata()
  const width = meta.width ?? 1200
  const height = meta.height ?? 840

  const [nameSvg, qrBuffer, certIdSvg] = await Promise.all([
    Promise.resolve(buildNameSVG(width, height, participant.name, nameLayout)),
    buildQRBuffer(qrUrl, qrLayout.size, logoBuffer, design.showWatermark),
    Promise.resolve(buildCertIdSVG(width, height, participant.certId, qrLayout, design)),
  ])

  const imageBuffer = await sharp(templateBuffer)
    .composite([
      { input: nameSvg, top: 0, left: 0 },
      { input: qrBuffer, top: Math.round(qrLayout.y), left: Math.round(qrLayout.x) },
      { input: certIdSvg, top: 0, left: 0 },
    ])
    .png()
    .toBuffer()

  return { certId: participant.certId, name: participant.name, qrUrl, imageBuffer }
}

export async function generateCertificateBatch(
  templateBuffer: Buffer,
  participants: ParticipantInput[],
  nameLayout: NameLayout,
  qrLayout: QRLayout,
  design: CertDesign,
  urlConfig: URLConfig,
  logoBuffer?: Buffer,
  concurrency = 5
): Promise<CertificateOutput[]> {
  const results: CertificateOutput[] = []

  for (let i = 0; i < participants.length; i += concurrency) {
    const chunk = participants.slice(i, i + concurrency)
    const batch = await Promise.all(
      chunk.map(p =>
        generateCertificateImage(templateBuffer, p, nameLayout, qrLayout, design, urlConfig, logoBuffer)
      )
    )
    results.push(...batch)
  }

  return results
}

// ─── URL builder ─────────────────────────────────────────────────────────────

export function buildCertUrl(urlConfig: URLConfig, certId: string): string {
  const base = urlConfig.baseUrl.replace(/\/$/, "")
  const page = urlConfig.viewPageName.replace(/^\//, "").replace(/\/$/, "")
  return `${base}/certs/${page}/${certId}`
}
