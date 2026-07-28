// Legacy data migration: old phpMyAdmin/MySQL export (certhora_kybolwaz.csv) -> current
// Prisma/Postgres schema. See scripts/legacy-migration/README.md for the full list of
// decisions this script encodes (tier mapping, cert quota, event status, etc.) — those
// were agreed on with the project owner before this was written, not guessed here.
//
// Usage:
//   npx tsx scripts/legacy-migration/migrate.ts                  # dry run (default, no DB writes)
//   npx tsx scripts/legacy-migration/migrate.ts --commit         # actually write to DATABASE_URL
//
// Dry run always still writes the payment-history archive file (no DB access needed for that).

import "dotenv/config"
import fs from "fs"
import path from "path"
import Papa from "papaparse"
import { PrismaClient, Tier, EventStatus, EmailStatus, UserType } from "@prisma/client"
import { PrismaNeonHttp } from "@prisma/adapter-neon"
import { resolveLayout } from "./layout-presets"
import { mapFont, normalizeColor, cleanMojibake, toDateOrNull, toIntOrDefault, nullIfEmpty } from "./transforms"

const CSV_PATH = process.argv.includes("--file")
  ? process.argv[process.argv.indexOf("--file") + 1]
  : path.join(process.cwd(), "certhora_kybolwaz.csv")
const COMMIT = process.argv.includes("--commit")
const ARCHIVE_PATH = path.join(__dirname, "archive-payment-history.json")

// ─── Section splitting ────────────────────────────────────────────────────────

const HEADERS = {
  certificates: '"cert_id","participant_name","participant_email","event_code","created_at","share_cert","view_cert","Email_status","others","queued_at","send_attempts"',
  events: '"event_code","event_name","event_date","issued_date","expiry_date","description","skills","organizer_cd","created_at"',
  feedback: '"id","event_code","nps_score","comment","created_at"',
  organizers: '"organizer_cd","user_id","org_name","social_link","tier","cert_quota","expiry_date","subscribe_date"',
  payments: '"id","user_id","billcode","amount","external_ref","tier_requested","cert_quota_req","status","refno","created_at","updated_at"',
  subsSnapshot: '"organizer_cd","tier","cert_quota","created_at"',
  templates: '"event_code","primary_color","layout_path","name_font","name_color","certid_font","certid_color","watermark"',
  users: '"user_id","email","password_hash","user_type","created_at","updated_at","is_verified","verification_token","reset_token","reset_expires"',
}

function splitSections(raw: string) {
  const lines = raw.split(/\r?\n/)
  const order: (keyof typeof HEADERS)[] = ["certificates", "events", "feedback", "organizers", "payments", "subsSnapshot", "templates", "users"]
  const starts: Record<string, number> = {}
  for (const key of order) {
    const idx = lines.findIndex(l => l.trim() === HEADERS[key])
    if (idx === -1) throw new Error(`Could not find header for section "${key}" in ${CSV_PATH}`)
    starts[key] = idx
  }
  const sections: Record<string, any[]> = {}
  for (let i = 0; i < order.length; i++) {
    const key = order[i]
    const start = starts[key]
    const end = i + 1 < order.length ? starts[order[i + 1]] : lines.length
    const chunk = lines.slice(start, end).join("\n")
    const parsed = Papa.parse(chunk, { header: true, skipEmptyLines: true })
    sections[key] = parsed.data as any[]
  }
  return sections
}

// ─── Transform ────────────────────────────────────────────────────────────────

function tierFromOldCode(code: string | null | undefined): Tier {
  return (code ?? "0").trim() === "0" ? Tier.FREE : Tier.PRO
}

function certQuotaForTier(tier: Tier): number {
  return tier === Tier.PRO ? 500 : 100
}

function emailStatusFromOld(status: string | null | undefined): EmailStatus {
  const s = (status ?? "").trim().toLowerCase()
  if (s === "sent") return EmailStatus.SENT
  if (s === "failed") return EmailStatus.FAILED
  return EmailStatus.PENDING // '', 'pending', 'no email'
}

interface Warning { table: string; key: string; message: string }

// Finds the longest known organizer code that prefixes an orphaned event's code, so a
// placeholder Event can be attached to the right organizer (e.g. "AFS007" -> "AFS").
function deriveOrganizerCd(eventCode: string, knownOrgCodes: Set<string>): string | null {
  let best: string | null = null
  for (const cd of knownOrgCodes) {
    if (eventCode.startsWith(cd) && (!best || cd.length > best.length)) best = cd
  }
  return best
}

function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`CSV not found at ${CSV_PATH}`)
    process.exit(1)
  }
  const raw = fs.readFileSync(CSV_PATH, "utf-8")
  const sections = splitSections(raw)
  const warnings: Warning[] = []
  const skipped: { table: string; key: string; reason: string }[] = []

  const validUserIds = new Set(sections.users.filter(r => r.user_id).map(r => String(r.user_id).trim()))

  // Organizers (built first — users/subscriptions/name-backfill depend on tier/orgName).
  // Skipped entirely if their user_id has no matching User row (agreed decision).
  const organizers = sections.organizers
    .filter(r => r.organizer_cd)
    .filter(r => {
      const userId = String(r.user_id).trim()
      if (!validUserIds.has(userId)) {
        skipped.push({ table: "organizers", key: r.organizer_cd, reason: `references missing user_id "${userId}"` })
        return false
      }
      return true
    })
    .map(r => {
      const tier = tierFromOldCode(r.tier)
      const organizerCd = String(r.organizer_cd).trim().toUpperCase()
      if (organizerCd.length > 4) warnings.push({ table: "organizers", key: organizerCd, message: `organizerCd exceeds VarChar(4): "${organizerCd}"` })
      return {
        organizerCd,
        userId: String(r.user_id).trim(),
        orgName: cleanMojibake(r.org_name) ?? organizerCd,
        socialLink: nullIfEmpty(r.social_link),
        tier,
        certQuota: certQuotaForTier(tier),
        expiryDate: toDateOrNull(r.expiry_date),
        subscribeDate: toDateOrNull(r.subscribe_date),
      }
    })
  const validOrgCodes = new Set(organizers.map(o => o.organizerCd))
  const orgNameByUserId = new Map(organizers.map(o => [o.userId, o.orgName]))

  // Users — only those actually referenced by a surviving organizer get a name backfill,
  // but every user row still migrates (a user without an organizer is harmless).
  const users = sections.users.filter(r => r.user_id).map(r => {
    const id = String(r.user_id).trim()
    return {
      id,
      email: nullIfEmpty(r.email)?.toLowerCase() ?? `unknown-${id}@migrated.invalid`,
      passwordHash: nullIfEmpty(r.password_hash),
      userType: (r.user_type ?? "organizer").trim().toUpperCase() === "ADMIN" ? UserType.ADMIN : UserType.ORGANIZER,
      isVerified: (r.is_verified ?? "0").trim() === "1",
      name: orgNameByUserId.get(id) ?? null, // backfill from Organizer.orgName (agreed decision)
      createdAt: toDateOrNull(r.created_at) ?? new Date(),
      updatedAt: toDateOrNull(r.updated_at) ?? new Date(),
    }
  })

  // Subscriptions — one per organizer, derived fresh from final mapped tier (not the
  // sparse/incomplete old subs-snapshot table, which only covered 3 of 24 organizers).
  const subscriptions = organizers.map(o => ({
    organizerCd: o.organizerCd,
    tier: o.tier,
    certQuota: o.certQuota,
  }))

  // Events — skipped if their organizer_cd has no surviving Organizer row (agreed decision).
  const events = sections.events
    .filter(r => r.event_code)
    .filter(r => {
      const organizerCd = String(r.organizer_cd ?? "").trim().toUpperCase()
      if (!validOrgCodes.has(organizerCd)) {
        skipped.push({ table: "events", key: r.event_code, reason: `references missing organizer_cd "${organizerCd}"` })
        return false
      }
      return true
    })
    .map(r => {
      const eventCode = String(r.event_code).trim().toUpperCase()
      if (eventCode.length > 10) warnings.push({ table: "events", key: eventCode, message: `eventCode exceeds VarChar(10): "${eventCode}"` })
      const description = cleanMojibake(r.description)
      if (description && description.length > 1500) {
        warnings.push({ table: "events", key: eventCode, message: `description is ${description.length} chars, exceeds VarChar(1500) — will be truncated` })
      }
      return {
        eventCode,
        status: EventStatus.ACTIVE, // agreed decision — these already have issued certs
        hasBadge: false,
        badgeUrl: null,
        eventName: cleanMojibake(r.event_name) ?? eventCode,
        eventDate: toDateOrNull(r.event_date),
        issuedDate: toDateOrNull(r.issued_date),
        expiryDate: toDateOrNull(r.expiry_date),
        description: description ? description.slice(0, 1500) : null,
        skills: (r.skills ?? "").split("|").map((s: string) => s.trim()).filter(Boolean),
        organizerCd: String(r.organizer_cd ?? "").trim().toUpperCase(),
        createdAt: toDateOrNull(r.created_at) ?? new Date(),
      }
    })
  const validEventCodes = new Set(events.map(e => e.eventCode))

  // Orphaned certificates reference event codes with no row in the events export at all
  // (a pre-existing gap in the old data, not something this export missed). Agreed
  // decision: create a minimal placeholder Event for each so those certs aren't lost.
  const certEventCodes = new Set(
    sections.certificates.filter(r => r.cert_id).map(r => String(r.event_code ?? "").trim().toUpperCase())
  )
  for (const eventCode of certEventCodes) {
    if (validEventCodes.has(eventCode)) continue
    const organizerCd = deriveOrganizerCd(eventCode, validOrgCodes)
    if (!organizerCd) {
      skipped.push({ table: "certificates", key: eventCode, reason: `orphaned event code has no derivable organizer — certs under it will be skipped` })
      continue
    }
    events.push({
      eventCode,
      status: EventStatus.ACTIVE,
      hasBadge: false,
      badgeUrl: null,
      eventName: eventCode,
      eventDate: null,
      issuedDate: null,
      expiryDate: null,
      description: null,
      skills: [],
      organizerCd,
      createdAt: new Date(),
    })
    validEventCodes.add(eventCode)
    warnings.push({ table: "events", key: eventCode, message: `placeholder event created (organizer=${organizerCd}) — no row existed in the old events export` })
  }

  // Templates — skipped if their event has no surviving Event row.
  const templates = sections.templates
    .filter(r => r.event_code)
    .filter(r => {
      const eventCode = String(r.event_code).trim().toUpperCase()
      if (!validEventCodes.has(eventCode)) {
        skipped.push({ table: "templates", key: eventCode, reason: "event was skipped" })
        return false
      }
      return true
    })
    .map(r => {
    const layout = resolveLayout(r.layout_path)
    return {
      eventCode: String(r.event_code).trim().toUpperCase(),
      imageUrl: null, // agreed decision — new app's default procedural background
      primaryColor: normalizeColor(r.primary_color, "#1D4ED8"),
      nameCenterX: layout.nameCenterX,
      nameY: layout.nameY,
      nameMaxWidth: layout.nameMaxWidth,
      nameFontSize: layout.nameFontSize,
      nameFont: mapFont(r.name_font),
      nameColor: normalizeColor(r.name_color, "#1E293B"),
      qrX: layout.qrX,
      qrY: layout.qrY,
      qrSize: layout.qrSize,
      certIdFont: mapFont(r.certid_font),
      certIdColor: normalizeColor(r.certid_color, "#64748B"),
      showWatermark: (r.watermark ?? "0").trim() === "1",
    }
  })

  // Certificates — skipped if their event has no surviving Event row (shouldn't happen
  // now that orphaned events get a placeholder, but stays as a defensive check).
  const certificates = sections.certificates
    .filter(r => r.cert_id)
    .filter(r => {
      const eventCode = String(r.event_code ?? "").trim().toUpperCase()
      if (!validEventCodes.has(eventCode)) {
        skipped.push({ table: "certificates", key: r.cert_id, reason: `event_code "${eventCode}" not found` })
        return false
      }
      return true
    })
    .map(r => {
    const certId = String(r.cert_id).trim().toUpperCase()
    if (certId.length > 12) warnings.push({ table: "certificates", key: certId, message: `certId exceeds VarChar(12): "${certId}"` })
    const email = nullIfEmpty(r.participant_email)
    if (email && email.length > 100) warnings.push({ table: "certificates", key: certId, message: `participantEmail exceeds VarChar(100)` })
    const others = nullIfEmpty(r.others)
    return {
      certId,
      participantName: cleanMojibake(r.participant_name) ?? "Unknown",
      participantEmail: email ?? "",
      eventCode: String(r.event_code ?? "").trim().toUpperCase(),
      createdAt: toDateOrNull(r.created_at) ?? new Date(),
      shareCount: toIntOrDefault(r.share_cert, 0),
      viewCount: toIntOrDefault(r.view_cert, 0),
      emailStatus: emailStatusFromOld(r.Email_status),
      queuedAt: toDateOrNull(r.queued_at),
      sendAttempts: toIntOrDefault(r.send_attempts, 0),
      metadata: others ? { others } : null, // agreed decision — preserve in unused metadata field
    }
  })

  // EventFeedback — skipped if their event has no surviving Event row.
  const feedback = sections.feedback
    .filter(r => r.event_code)
    .filter(r => {
      const eventCode = String(r.event_code).trim().toUpperCase()
      if (!validEventCodes.has(eventCode)) {
        skipped.push({ table: "feedback", key: eventCode, reason: "event was skipped" })
        return false
      }
      return true
    })
    .map(r => ({
      eventCode: String(r.event_code).trim().toUpperCase(),
      npsScore: toIntOrDefault(r.nps_score, 0),
      comment: nullIfEmpty(r.comment),
      createdAt: toDateOrNull(r.created_at) ?? new Date(),
    }))

  // Archive payment history (not migrated into the live table — agreed decision)
  fs.writeFileSync(ARCHIVE_PATH, JSON.stringify({
    payments: sections.payments.filter(r => r.id),
    subsSnapshot: sections.subsSnapshot.filter(r => r.organizer_cd),
  }, null, 2))

  // ─── Report ───────────────────────────────────────────────────────────────

  console.log("=== Legacy migration — parse summary ===")
  console.log(`Users:          ${users.length}`)
  console.log(`Organizers:     ${organizers.length}`)
  console.log(`Subscriptions:  ${subscriptions.length}`)
  console.log(`Events:         ${events.length}`)
  console.log(`Templates:      ${templates.length}`)
  console.log(`Certificates:   ${certificates.length}`)
  console.log(`Feedback:       ${feedback.length}`)
  console.log(`Payment history archived to ${ARCHIVE_PATH} (${sections.payments.length} rows, NOT written to DB)`)
  console.log()

  if (warnings.length > 0) {
    console.log(`=== ${warnings.length} warning(s) ===`)
    for (const w of warnings) console.log(`[${w.table}] ${w.key}: ${w.message}`)
    console.log()
  } else {
    console.log("No length/validation warnings.\n")
  }

  if (skipped.length > 0) {
    console.log(`=== ${skipped.length} row(s) skipped ===`)
    for (const s of skipped) console.log(`[${s.table}] ${s.key}: ${s.reason}`)
    console.log()
  } else {
    console.log("Nothing skipped.\n")
  }

  if (!COMMIT) {
    console.log("Dry run only — no database writes. Re-run with --commit to actually migrate.")
    console.log("\nSample organizer:", JSON.stringify(organizers[0], null, 2))
    console.log("\nSample event:", JSON.stringify(events[0], null, 2))
    console.log("\nSample template:", JSON.stringify(templates[0], null, 2))
    console.log("\nSample certificate:", JSON.stringify(certificates.find(c => c.participantEmail), null, 2))
    return
  }

  void commit({ users, organizers, subscriptions, events, templates, certificates, feedback })
}

// ─── Commit ─────────────────────────────────────────────────────────────────

async function commit(data: {
  users: any[]; organizers: any[]; subscriptions: any[]; events: any[]
  templates: any[]; certificates: any[]; feedback: any[]
}) {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error("DATABASE_URL is not set")
  const adapter = new PrismaNeonHttp(connectionString, {} as any)
  const prisma = new PrismaClient({ adapter })

  const errors: { table: string; key: string; error: string }[] = []
  let ok = 0

  // Dependency order: User -> Organizer -> Subscription -> Event -> Template -> Certificate -> EventFeedback
  for (const u of data.users) {
    try {
      await prisma.user.upsert({ where: { id: u.id }, create: u, update: u })
      ok++
    } catch (e) { errors.push({ table: "users", key: u.id, error: String(e) }) }
  }
  for (const o of data.organizers) {
    try {
      await prisma.organizer.upsert({ where: { organizerCd: o.organizerCd }, create: o, update: o })
      ok++
    } catch (e) { errors.push({ table: "organizers", key: o.organizerCd, error: String(e) }) }
  }
  for (const s of data.subscriptions) {
    try {
      await prisma.subscription.upsert({ where: { organizerCd: s.organizerCd }, create: s, update: s })
      ok++
    } catch (e) { errors.push({ table: "subscriptions", key: s.organizerCd, error: String(e) }) }
  }
  for (const e of data.events) {
    try {
      await prisma.event.upsert({ where: { eventCode: e.eventCode }, create: e, update: e })
      ok++
    } catch (err) { errors.push({ table: "events", key: e.eventCode, error: String(err) }) }
  }
  for (const t of data.templates) {
    try {
      await prisma.template.upsert({ where: { eventCode: t.eventCode }, create: t, update: t })
      ok++
    } catch (e) { errors.push({ table: "templates", key: t.eventCode, error: String(e) }) }
  }
  for (const c of data.certificates) {
    try {
      await prisma.certificate.upsert({ where: { certId: c.certId }, create: c, update: c })
      ok++
    } catch (e) { errors.push({ table: "certificates", key: c.certId, error: String(e) }) }
  }
  for (const f of data.feedback) {
    try {
      await prisma.eventFeedback.create({ data: f })
      ok++
    } catch (e) { errors.push({ table: "feedback", key: f.eventCode, error: String(e) }) }
  }

  console.log(`\n=== Commit complete: ${ok} rows written, ${errors.length} errors ===`)
  for (const e of errors) console.log(`[${e.table}] ${e.key}: ${e.error}`)
}

main()
