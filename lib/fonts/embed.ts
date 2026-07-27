import { Resvg } from "@resvg/resvg-js"
import { GEIST_REGULAR_TTF_BASE64, GEIST_BOLD_TTF_BASE64 } from "./geist-base64"

// Certificates are built as raw SVG <text> elements and rasterized server-side. `sharp`'s
// built-in SVG path (librsvg) resolves font-family names against whatever fonts happen to
// be installed on the host OS — fine on this Windows dev box (has Arial), but a bare Linux
// serverless host has *no* fonts installed at all, so every font-family silently fails to
// resolve and renders as empty tofu-box glyphs (verified: every certificate ever generated
// on the deployed server has been affected, not just new ones).
//
// @resvg/resvg-js (the same renderer @vercel/og uses) sidesteps this: with
// `loadSystemFonts: false` it never touches the host's fonts at all, and any font-family
// that doesn't match one of our embedded buffers falls through to `defaultFontFamily` /
// `sansSerifFamily` etc. — verified empirically that resvg's own bundled fallback fonts
// already render serif/monospace keywords reasonably, and Geist (SIL OFL licensed, via the
// `geist` npm package) catches everything else (Arial, Georgia, Trebuchet, Verdana, or any
// organizer-entered name). Rendering is now byte-identical regardless of host.
const GEIST_REGULAR = Buffer.from(GEIST_REGULAR_TTF_BASE64, "base64")
const GEIST_BOLD = Buffer.from(GEIST_BOLD_TTF_BASE64, "base64")

const FONT_OPTIONS = {
  loadSystemFonts: false,
  fontBuffers: [GEIST_REGULAR, GEIST_BOLD],
  defaultFontFamily: "Geist",
  sansSerifFamily: "Geist",
  cursiveFamily: "Geist",
  fantasyFamily: "Geist",
} as const

export function rasterizeSvg(svg: string): Buffer {
  const resvg = new Resvg(svg, { font: FONT_OPTIONS })
  return Buffer.from(resvg.render().asPng())
}
