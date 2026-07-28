// Uploads real cert-background and badge images (pulled from the old cPanel hosting) to
// R2, then wires up Template.imageUrl/layout + Event.badgeUrl+hasBadge for whichever events
// have them. Organizer-level profile pictures (storage/{ORG}/{ORG}.*, storage/{ORG}/profile/*)
// are intentionally skipped — confirmed with the project owner these are profile photos,
// not certificate assets, and there's no field for them in the current schema anyway.
//
// Layout positions are recomputed from scratch every run using each image's *actual* pixel
// dimensions (read via sharp) and the event's original layout_path — never by rescaling a
// previously-stored value, so re-running this script is idempotent and never drifts.
//
// Usage:
//   npx tsx scripts/legacy-migration/migrate-assets.ts              # dry run (default)
//   npx tsx scripts/legacy-migration/migrate-assets.ts --commit     # upload to R2 + write DB
//
// R2 uploads happen even in dry-run-adjacent testing against a Neon branch, since there's
// only one real R2 bucket (no branching for object storage) — but uploads are idempotent
// (stable keys, safe to re-run) and harmless on their own; only --commit touches the DB.

import "dotenv/config"
import fs from "fs"
import path from "path"
import sharp from "sharp"
import Papa from "papaparse"
import { PrismaClient } from "@prisma/client"
import { PrismaNeonHttp } from "@prisma/adapter-neon"
import { uploadToR2 } from "../../lib/r2"
import { resolveLayout } from "./layout-presets"

const ASSETS_ROOT = path.join(__dirname, "assets", "extracted", "storage")
const CSV_PATH = path.join(process.cwd(), "certhora_kybolwaz.csv")
const COMMIT = process.argv.includes("--commit")
const EXT_PREFERENCE = ["png", "jpg", "jpeg"]
const CONTENT_TYPE: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg" }
const SKIP_DIRS = new Set(["profile", "badge", "certbg", "__MACOSX"])
const TEMPLATES_HEADER = '"event_code","primary_color","layout_path","name_font","name_color","certid_font","certid_color","watermark"'

interface AssetEntry {
  eventCode: string
  certFile: { path: string; ext: string } | null
  badgeFile: { path: string; ext: string } | null
}

function pickBestFile(dir: string, baseName: "cert" | "badge"): { path: string; ext: string } | null {
  for (const ext of EXT_PREFERENCE) {
    const p = path.join(dir, `${baseName}.${ext}`)
    if (fs.existsSync(p)) return { path: p, ext }
  }
  return null
}

function scanAssets(): AssetEntry[] {
  if (!fs.existsSync(ASSETS_ROOT)) {
    console.error(`Assets root not found at ${ASSETS_ROOT} — did you extract storage.zip there?`)
    process.exit(1)
  }
  const entries: AssetEntry[] = []
  for (const orgDir of fs.readdirSync(ASSETS_ROOT, { withFileTypes: true })) {
    if (!orgDir.isDirectory()) continue
    const orgPath = path.join(ASSETS_ROOT, orgDir.name)
    for (const eventDir of fs.readdirSync(orgPath, { withFileTypes: true })) {
      if (!eventDir.isDirectory()) continue
      if (SKIP_DIRS.has(eventDir.name)) continue
      const eventPath = path.join(orgPath, eventDir.name)
      const certFile = pickBestFile(eventPath, "cert")
      const badgeFile = pickBestFile(eventPath, "badge")
      if (!certFile && !badgeFile) continue // empty event folder, nothing to migrate
      entries.push({ eventCode: eventDir.name.trim().toUpperCase(), certFile, badgeFile })
    }
  }
  return entries
}

// eventCode -> layout_path, read straight from the same CSV the main migration uses —
// needed here to recompute layout positions correctly against each image's real dimensions.
function loadLayoutPaths(): Map<string, string> {
  const raw = fs.readFileSync(CSV_PATH, "utf-8")
  const lines = raw.split(/\r?\n/)
  const start = lines.findIndex(l => l.trim() === TEMPLATES_HEADER)
  if (start === -1) throw new Error("Could not find templates section header in CSV")
  // Templates section is the last one in the file except for users, so just parse to EOF
  // minus the users header, which is simplest found by scanning for the next `"user_id"` header.
  const nextHeaderIdx = lines.findIndex((l, i) => i > start && l.trim().startsWith('"user_id","email"'))
  const chunk = lines.slice(start, nextHeaderIdx === -1 ? undefined : nextHeaderIdx).join("\n")
  const rows = Papa.parse(chunk, { header: true, skipEmptyLines: true }).data as any[]
  const map = new Map<string, string>()
  for (const r of rows) {
    if (!r.event_code) continue
    map.set(String(r.event_code).trim().toUpperCase(), String(r.layout_path ?? "").trim())
  }
  return map
}

async function main() {
  const entries = scanAssets()
  const layoutPaths = loadLayoutPaths()
  console.log(`Found ${entries.length} event(s) with cert/badge assets:`)
  for (const e of entries) {
    console.log(`  ${e.eventCode}: cert=${e.certFile?.ext ?? "-"} badge=${e.badgeFile?.ext ?? "-"} layout=${layoutPaths.get(e.eventCode) ?? "(unknown)"}`)
  }
  console.log()

  if (!COMMIT) {
    console.log("Dry run only — no uploads, no DB writes. Re-run with --commit to actually migrate.")
    return
  }

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error("DATABASE_URL is not set")
  const adapter = new PrismaNeonHttp(connectionString, {} as any)
  const prisma = new PrismaClient({ adapter })

  let uploaded = 0
  const errors: { eventCode: string; error: string }[] = []

  for (const entry of entries) {
    try {
      const event = await prisma.event.findUnique({ where: { eventCode: entry.eventCode } })
      if (!event) {
        console.log(`[skip] ${entry.eventCode}: no Event row in target DB (was it skipped during the main migration?)`)
        continue
      }

      if (entry.certFile) {
        const buffer = fs.readFileSync(entry.certFile.path)
        const meta = await sharp(buffer).metadata()
        const canvasW = meta.width ?? 1200
        const canvasH = meta.height ?? 840
        const { others, ...layout } = resolveLayout(layoutPaths.get(entry.eventCode), canvasW, canvasH)

        // Get the name font/color already staged for this event so the "others" overlay
        // (layout5 only — see cert-layout-analysis.md) matches it exactly, same as the
        // old system's shared .name-overlay/.others-overlay CSS class.
        const existingTemplate = await prisma.template.findUnique({ where: { eventCode: entry.eventCode } })
        const additional = others
          ? [{
              id: "others",
              label: "others",
              value: "", // per-certificate — substituted from Certificate.metadata.others at render time
              x: others.centerX,
              y: others.y,
              fontSize: others.fontSize,
              maxWidth: others.maxWidth,
              color: existingTemplate?.nameColor ?? "#1E293B",
              font: existingTemplate?.nameFont ?? "Arial, Helvetica, sans-serif",
              align: "middle" as const,
              bold: true,
            }]
          : undefined

        const key = `legacy/certbg/${entry.eventCode}.${entry.certFile.ext}`
        const url = await uploadToR2(key, buffer, CONTENT_TYPE[entry.certFile.ext])
        await prisma.template.upsert({
          where: { eventCode: entry.eventCode },
          update: { imageUrl: url, ...layout, ...(additional ? { additional } : {}) },
          create: { eventCode: entry.eventCode, imageUrl: url, ...layout, ...(additional ? { additional } : {}) },
        })
        console.log(`[ok] ${entry.eventCode}: cert background (${canvasW}x${canvasH}) -> ${url}${others ? " [+others overlay]" : ""}`)
        uploaded++
      }

      if (entry.badgeFile) {
        const buffer = fs.readFileSync(entry.badgeFile.path)
        const key = `legacy/badge/${entry.eventCode}.${entry.badgeFile.ext}`
        const url = await uploadToR2(key, buffer, CONTENT_TYPE[entry.badgeFile.ext])
        await prisma.event.update({ where: { eventCode: entry.eventCode }, data: { badgeUrl: url, hasBadge: true } })
        console.log(`[ok] ${entry.eventCode}: badge -> ${url}`)
        uploaded++
      }
    } catch (e) {
      errors.push({ eventCode: entry.eventCode, error: String(e) })
    }
  }

  console.log(`\n=== Done: ${uploaded} assets uploaded/wired up, ${errors.length} errors ===`)
  for (const e of errors) console.log(`[${e.eventCode}] ${e.error}`)
}

main()
