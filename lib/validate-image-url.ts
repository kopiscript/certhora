import "server-only"

// Template.imageUrl is fetched server-side (generate-certificates, cert preview) to
// composite the certificate background. It must only ever point at our own R2 bucket
// (via uploadToR2) — otherwise an organizer could point it at an internal/cloud-metadata
// host and trigger SSRF every time a certificate is generated or previewed.
export function isAllowedTemplateImageUrl(url: string): boolean {
  // Relative paths are resolved against our own NEXTAUTH_URL by string concatenation
  // (not URL parsing), so they can never target a different host.
  if (url.startsWith("/")) return true
  const publicBase = process.env.R2_PUBLIC_URL
  if (publicBase && url.startsWith(publicBase)) return true
  return false
}
