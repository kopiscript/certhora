// Derived from the old PHP app's certs/cert_layout/layoutN.php files, which positioned
// name/QR/cert-ID overlays as mm-offsets or percentages against a 297x210mm (A4 landscape)
// canvas rendered client-side via html2canvas. The new app composites server-side onto a
// 1200x840px canvas, so every mm/percentage value here is converted with SCALE = 1200/297,
// applied uniformly to both axes (matching how the old code derived a single `scale` from
// container width alone). These are approximations, not pixel-perfect — the old system used
// top-left/right/bottom anchors and CSS centering that don't map 1:1 onto the new schema's
// center-anchored (nameCenterX/nameY) and top-left-anchored (qrX/qrY) fields. Organizers can
// nudge positions in the template editor after migration if anything looks off.

export interface LayoutPreset {
  nameCenterX: number
  nameY: number
  nameMaxWidth: number
  nameFontSize: number
  qrX: number
  qrY: number
  qrSize: number
}

const CANVAS_W = 1200
const CANVAS_H = 840
const SCALE = CANVAS_W / 297 // ≈ 4.0404

export const LAYOUT_PRESETS: Record<string, LayoutPreset> = {
  layout1: {
    // top-left anchored in the original; no width was set for the name box, so centerX
    // is approximated as the left offset itself rather than a true visual center.
    nameCenterX: Math.round(15.5 * SCALE),
    nameY: Math.round(80 * SCALE),
    nameMaxWidth: 840,
    nameFontSize: Math.round(8 * SCALE),
    qrX: Math.round(15.8 * SCALE),
    qrY: Math.round(CANVAS_H - 24.6 * SCALE - 41 * SCALE),
    qrSize: Math.round(41 * SCALE),
  },
  layout2: {
    nameCenterX: CANVAS_W / 2,
    nameY: CANVAS_H / 2,
    nameMaxWidth: 1100,
    nameFontSize: Math.round(8 * SCALE),
    qrX: Math.round(CANVAS_W / 2 - (41 * SCALE) / 2),
    qrY: Math.round(CANVAS_H - 0.099 * CANVAS_H - 41 * SCALE),
    qrSize: Math.round(41 * SCALE),
  },
  layout3: {
    nameCenterX: Math.round(21 * SCALE + (180 * SCALE) / 2),
    nameY: Math.round(86 * SCALE),
    nameMaxWidth: Math.round(180 * SCALE),
    nameFontSize: Math.round(8 * SCALE),
    qrX: Math.round(CANVAS_W - 27.5 * SCALE - 31 * SCALE),
    qrY: Math.round(CANVAS_H - 14.9 * SCALE - 31 * SCALE),
    qrSize: Math.round(31 * SCALE),
  },
  layout5: {
    nameCenterX: CANVAS_W / 2,
    nameY: Math.round(0.41 * CANVAS_H),
    nameMaxWidth: 1100,
    nameFontSize: Math.round(6 * SCALE),
    qrX: Math.round(CANVAS_W - 27.5 * SCALE - 31 * SCALE),
    qrY: Math.round(CANVAS_H - 14.9 * SCALE - 31 * SCALE),
    qrSize: Math.round(31 * SCALE),
  },
  layout6: {
    nameCenterX: CANVAS_W / 2,
    nameY: CANVAS_H / 2,
    nameMaxWidth: 1150,
    nameFontSize: Math.round(8 * SCALE),
    qrX: Math.round(CANVAS_W - 27.5 * SCALE - 31 * SCALE),
    qrY: Math.round(CANVAS_H - 14.9 * SCALE - 31 * SCALE),
    qrSize: Math.round(31 * SCALE),
  },
  layout7: {
    nameCenterX: CANVAS_W / 2,
    nameY: Math.round(0.45 * CANVAS_H),
    nameMaxWidth: 1150,
    nameFontSize: Math.round(8 * SCALE),
    qrX: Math.round(CANVAS_W - 27.5 * SCALE - 31 * SCALE),
    qrY: Math.round(CANVAS_H - 14.9 * SCALE - 31 * SCALE),
    qrSize: Math.round(31 * SCALE),
  },
}

// Sensible fallback for any layout_path value that doesn't match a known preset.
export const DEFAULT_LAYOUT: LayoutPreset = {
  nameCenterX: 600,
  nameY: 340,
  nameMaxWidth: 840,
  nameFontSize: 52,
  qrX: 1010,
  qrY: 628,
  qrSize: 140,
}

export function resolveLayout(layoutPath: string | null | undefined): LayoutPreset {
  if (!layoutPath) return DEFAULT_LAYOUT
  return LAYOUT_PRESETS[layoutPath.trim().toLowerCase()] ?? DEFAULT_LAYOUT
}
