import { Resvg } from "@resvg/resvg-js"
import { writeFileSync, existsSync, mkdirSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { GEIST_REGULAR_TTF_BASE64, GEIST_BOLD_TTF_BASE64 } from "./geist-base64"

// Certificates are built as raw SVG <text> elements and rasterized server-side. `sharp`'s
// built-in SVG path (librsvg) resolves font-family names against whatever fonts happen to
// be installed on the host OS — fine on this Windows dev box (has Arial), but a bare Linux
// serverless host has *no* fonts installed at all, so every font-family silently fails to
// resolve and renders as empty tofu-box glyphs (verified: every certificate ever generated
// on the deployed server has been affected, not just new ones).
//
// @resvg/resvg-js (the same renderer @vercel/og uses) sidesteps this: with
// `loadSystemFonts: false` it never touches the host's fonts at all. Geist (SIL OFL
// licensed, via the `geist` npm package) is embedded as the guaranteed fallback for
// anything unresolved (Arial, Georgia, Trebuchet, Verdana, or any organizer-entered name).
//
// Fonts are handed to resvg via `fontFiles` (real file paths on disk), not `fontBuffers` —
// resvg-js's JS wrapper serializes the whole options object through `JSON.stringify()`
// before it crosses into the native Rust binding, which turns a Buffer into a plain
// `{type:"Buffer", data:[...]}` object. That round-trip worked in local testing (both
// Windows dev and a local production build), but produced blank glyphs with no thrown
// error on the deployed Linux function — `fontFiles` is a far more common/tested code path
// than `fontBuffers` across resvg-js's platform binaries, so materializing the fonts to
// disk once (memoized across warm invocations) and pointing resvg at the paths sidesteps
// that serialization step entirely.
let fontFilePaths: [string, string] | null = null

function getFontFiles(): [string, string] {
  if (fontFilePaths) return fontFilePaths

  const dir = join(tmpdir(), "certhora-fonts")
  const regularPath = join(dir, "Geist-Regular.ttf")
  const boldPath = join(dir, "Geist-Bold.ttf")

  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  if (!existsSync(regularPath)) writeFileSync(regularPath, Buffer.from(GEIST_REGULAR_TTF_BASE64, "base64"))
  if (!existsSync(boldPath)) writeFileSync(boldPath, Buffer.from(GEIST_BOLD_TTF_BASE64, "base64"))

  fontFilePaths = [regularPath, boldPath]
  return fontFilePaths
}

export function rasterizeSvg(svg: string): Buffer {
  const [regularPath, boldPath] = getFontFiles()

  const resvg = new Resvg(svg, {
    font: {
      loadSystemFonts: false,
      fontFiles: [regularPath, boldPath],
      defaultFontFamily: "Geist",
      sansSerifFamily: "Geist",
      cursiveFamily: "Geist",
      fantasyFamily: "Geist",
    },
  })
  return Buffer.from(resvg.render().asPng())
}
