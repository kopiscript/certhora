import "server-only"
import sharp from "sharp"

const FORMAT_BY_MIME: Record<string, "png" | "jpeg" | "webp"> = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpeg",
  "image/webp": "webp",
}

// The declared Content-Type on an uploaded file is client-supplied and unverified —
// validates the actual image bytes (via sharp/libvips' format sniffing) match one of
// the allowed types, and re-encodes to strip any non-image payload smuggled inside
// (e.g. a polyglot file) before it's stored and served back to the public.
export async function validateAndNormalizeImage(
  buffer: Buffer,
  declaredMime: string
): Promise<Buffer | null> {
  const expectedFormat = FORMAT_BY_MIME[declaredMime]
  if (!expectedFormat) return null

  let image = sharp(buffer, { failOn: "error" })
  let metadata
  try {
    metadata = await image.metadata()
  } catch {
    return null
  }
  if (metadata.format !== expectedFormat) return null

  image = sharp(buffer)
  if (expectedFormat === "png") return image.png().toBuffer()
  if (expectedFormat === "webp") return image.webp().toBuffer()
  return image.jpeg().toBuffer()
}
