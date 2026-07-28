// Old system stored bare font names; the new template editor's dropdown uses full CSS
// font stacks. Functionally this is cosmetic only (the app's resvg-based renderer falls
// back to an embedded font for anything it can't resolve either way), but mapping to the
// matching stack keeps migrated templates consistent with what the editor UI shows.
const FONT_MAP: Record<string, string> = {
  "arial": "Arial, Helvetica, sans-serif",
  "helvetica": "Arial, Helvetica, sans-serif",
  "times new roman": "Georgia, 'Times New Roman', serif",
  "georgia": "Georgia, 'Times New Roman', serif",
  "trebuchet ms": "'Trebuchet MS', sans-serif",
  "verdana": "Verdana, Geneva, sans-serif",
  "monospace": "monospace",
}

export function mapFont(oldFont: string | null | undefined): string {
  if (!oldFont) return "Arial, Helvetica, sans-serif"
  return FONT_MAP[oldFont.trim().toLowerCase()] ?? oldFont.trim()
}

// SVG/CSS accept rgb(...) fine, but Template.primaryColor is capped at VarChar(16) and
// "rgb(86, 25, 101)"-style strings from the old export can exceed that. Convert to hex.
export function normalizeColor(color: string | null | undefined, fallback: string): string {
  if (!color) return fallback
  const trimmed = color.trim()
  const rgbMatch = trimmed.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i)
  if (!rgbMatch) return trimmed
  const [, r, g, b] = rgbMatch
  const toHex = (n: string) => Number(n).toString(16).padStart(2, "0")
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

// Best-effort cleanup for the mojibake scattered through the old export (mixed-up UTF-8/
// Latin-1 re-encoding, stray BOM bytes). Conservative on purpose — only fixes the specific
// patterns observed in this dataset rather than attempting a general encoding-repair pass,
// since guessing wrong on a name is worse than leaving the odd stray character in place.
export function cleanMojibake(text: string | null | undefined): string | null {
  if (!text) return null
  return text
    .replace(/^﻿/, "") // leading BOM (ï»¿)
    .replace(/�/g, "")
    .replace(/â€™/g, "'")
    .replace(/â€“/g, "-")
    .replace(/â€œ|â€\x9d/g, '"')
    .trim()
}

export function toDateOrNull(value: string | null | undefined): Date | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.toUpperCase() === "NULL") return null
  const d = new Date(trimmed)
  return Number.isNaN(d.getTime()) ? null : d
}

export function toIntOrDefault(value: string | null | undefined, fallback: number): number {
  if (!value) return fallback
  const n = parseInt(value, 10)
  return Number.isFinite(n) ? n : fallback
}

export function nullIfEmpty(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.toUpperCase() === "NULL") return null
  return trimmed
}
