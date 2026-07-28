// Derived from the old PHP app's certs/cert_layout/layoutN.php files, which positioned
// name/QR/cert-ID overlays against a 297x210mm (A4 landscape) canvas rendered client-side
// via html2canvas. Two kinds of units were used, and they must be handled differently:
//
//   - mm-offsets (e.g. "top=80mm", "width=41mm") — the old JS derived a single scale
//     factor `containerWidth / 297` and multiplied every mm value by it, for BOTH axes.
//   - CSS percentages (e.g. "top: 50%", "left: 50%") — these are plain percentages of the
//     container's own height/width respectively, already resolution-independent.
//
// Real uploaded certificate backgrounds vary wildly in actual pixel dimensions (seen in
// this migration: 757x567 up to 3250x2298) — none of them are 1200x840. A position
// hardcoded against a fixed 1200x840 assumption lands in the wrong *relative* spot on any
// image that isn't exactly that size (e.g. nameCenterX=600 sits at 50% of a 1200px-wide
// canvas, but only ~18% from the left of a 3250px-wide one). So every function here takes
// the *actual* template image's width/height and computes positions relative to that,
// instead of baking in a fixed canvas size.

export interface LayoutPreset {
  nameCenterX: number
  nameY: number
  nameMaxWidth: number
  nameFontSize: number
  qrX: number
  qrY: number
  qrSize: number
  // Only layout5 had a second styled overlay (the "others" field — a per-certificate
  // paper title/committee role, sourced from certificates.others), positioned below the
  // name. Undefined for every other layout.
  others?: { centerX: number; y: number; maxWidth: number; fontSize: number }
}

// mm-offsets are always scaled off the *width* (matching the old app's single-scale-factor
// behavior), since containers maintained a ~297:210 aspect ratio and the old code derived
// its one `scale` from width alone, applying it to both axes.
function mmScale(canvasW: number): number {
  return canvasW / 297
}

type LayoutFn = (canvasW: number, canvasH: number) => LayoutPreset

const LAYOUT_FNS: Record<string, LayoutFn> = {
  layout1: (canvasW, canvasH) => {
    const s = mmScale(canvasW)
    const qrSize = Math.round(41 * s)
    return {
      // top-left anchored in the original with no width set for the name box, so centerX
      // is approximated as the left offset itself rather than a true visual center.
      nameCenterX: Math.round(15.5 * s),
      nameY: Math.round(80 * s),
      nameMaxWidth: Math.round(canvasW * 0.7),
      nameFontSize: Math.round(8 * s),
      qrX: Math.round(15.8 * s),
      qrY: Math.round(canvasH - 24.6 * s - qrSize),
      qrSize,
    }
  },
  layout2: (canvasW, canvasH) => {
    const s = mmScale(canvasW)
    const qrSize = Math.round(41 * s)
    return {
      nameCenterX: Math.round(canvasW * 0.5),
      nameY: Math.round(canvasH * 0.5),
      nameMaxWidth: Math.round(canvasW * 0.92),
      nameFontSize: Math.round(8 * s),
      qrX: Math.round(canvasW * 0.5 - qrSize / 2),
      qrY: Math.round(canvasH - canvasH * 0.099 - qrSize),
      qrSize,
    }
  },
  layout3: (canvasW, canvasH) => {
    const s = mmScale(canvasW)
    const qrSize = Math.round(31 * s)
    const nameMaxWidth = Math.round(180 * s)
    return {
      nameCenterX: Math.round(21 * s + nameMaxWidth / 2),
      nameY: Math.round(86 * s),
      nameMaxWidth,
      nameFontSize: Math.round(8 * s),
      qrX: Math.round(canvasW - 27.5 * s - qrSize),
      qrY: Math.round(canvasH - 14.9 * s - qrSize),
      qrSize,
    }
  },
  layout5: (canvasW, canvasH) => {
    const s = mmScale(canvasW)
    const qrSize = Math.round(31 * s)
    return {
      nameCenterX: Math.round(canvasW * 0.5),
      nameY: Math.round(canvasH * 0.41),
      nameMaxWidth: Math.round(canvasW * 0.92),
      nameFontSize: Math.round(6 * s),
      qrX: Math.round(canvasW - 27.5 * s - qrSize),
      qrY: Math.round(canvasH - 14.9 * s - qrSize),
      qrSize,
      // .others-overlay: top=56.5%, left=50% centered, width=280mm, fontSize=5mm —
      // shares the name's font/color/bold/uppercase styling (see cert-layout-analysis.md).
      others: {
        centerX: Math.round(canvasW * 0.5),
        y: Math.round(canvasH * 0.565),
        maxWidth: Math.round(280 * s),
        fontSize: Math.round(5 * s),
      },
    }
  },
  layout6: (canvasW, canvasH) => {
    const s = mmScale(canvasW)
    const qrSize = Math.round(31 * s)
    return {
      nameCenterX: Math.round(canvasW * 0.5),
      nameY: Math.round(canvasH * 0.5),
      nameMaxWidth: Math.round(canvasW * 0.96),
      nameFontSize: Math.round(8 * s),
      qrX: Math.round(canvasW - 27.5 * s - qrSize),
      qrY: Math.round(canvasH - 14.9 * s - qrSize),
      qrSize,
    }
  },
  layout7: (canvasW, canvasH) => {
    const s = mmScale(canvasW)
    const qrSize = Math.round(31 * s)
    return {
      nameCenterX: Math.round(canvasW * 0.5),
      nameY: Math.round(canvasH * 0.45),
      nameMaxWidth: Math.round(canvasW * 0.96),
      nameFontSize: Math.round(8 * s),
      qrX: Math.round(canvasW - 27.5 * s - qrSize),
      qrY: Math.round(canvasH - 14.9 * s - qrSize),
      qrSize,
    }
  },
}

// Fallback for when we don't yet know the real image dimensions (e.g. no custom background
// was ever uploaded — the event uses the app's own 1200x840 procedural template, for which
// these numbers are exactly right) or the layout_path doesn't match a known preset.
const DEFAULT_CANVAS_W = 1200
const DEFAULT_CANVAS_H = 840
export const DEFAULT_LAYOUT: LayoutPreset = {
  nameCenterX: 600,
  nameY: 340,
  nameMaxWidth: 840,
  nameFontSize: 52,
  qrX: 1010,
  qrY: 628,
  qrSize: 140,
}

// canvasW/canvasH should be the *actual* template image's pixel dimensions when a real
// background is being wired up (read via sharp metadata at upload time). Omit them when
// there's no custom image — the event uses the app's own 1200x840 procedural template,
// for which DEFAULT_LAYOUT's fixed numbers are exactly right.
export function resolveLayout(
  layoutPath: string | null | undefined,
  canvasW?: number,
  canvasH?: number
): LayoutPreset {
  if (canvasW === undefined || canvasH === undefined) return DEFAULT_LAYOUT
  const fn = (layoutPath && LAYOUT_FNS[layoutPath.trim().toLowerCase()]) || LAYOUT_FNS.layout2
  return fn(canvasW, canvasH)
}
