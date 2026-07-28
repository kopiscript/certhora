import fs from "fs"
import path from "path"
import Papa from "papaparse"

const raw = fs.readFileSync(path.join(process.cwd(), "certhora_kybolwaz.csv"), "utf-8")
const lines = raw.split(/\r?\n/)

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
const order = Object.keys(HEADERS) as (keyof typeof HEADERS)[]
const starts: Record<string, number> = {}
for (const key of order) starts[key] = lines.findIndex(l => l.trim() === HEADERS[key])
const sections: Record<string, any[]> = {}
for (let i = 0; i < order.length; i++) {
  const key = order[i]
  const end = i + 1 < order.length ? starts[order[i + 1]] : lines.length
  sections[key] = (Papa.parse(lines.slice(starts[key], end).join("\n"), { header: true, skipEmptyLines: true }).data as any[])
}

const userIds = new Set(sections.users.filter(r => r.user_id).map(r => String(r.user_id).trim()))
const orgCodes = new Set(sections.organizers.filter(r => r.organizer_cd).map(r => String(r.organizer_cd).trim().toUpperCase()))
const eventCodes = new Set(sections.events.filter(r => r.event_code).map(r => String(r.event_code).trim().toUpperCase()))

console.log("=== Organizers referencing missing users ===")
for (const r of sections.organizers) {
  if (!r.organizer_cd) continue
  const uid = String(r.user_id).trim()
  if (!userIds.has(uid)) console.log(`organizer ${r.organizer_cd} -> user_id ${uid} NOT FOUND`)
}

console.log("\n=== Events referencing missing organizers ===")
for (const r of sections.events) {
  if (!r.event_code) continue
  const cd = String(r.organizer_cd ?? "").trim().toUpperCase()
  if (!orgCodes.has(cd)) console.log(`event ${r.event_code} -> organizer_cd "${cd}" NOT FOUND`)
}

console.log("\n=== Templates referencing missing events ===")
for (const r of sections.templates) {
  if (!r.event_code) continue
  const ec = String(r.event_code).trim().toUpperCase()
  if (!eventCodes.has(ec)) console.log(`template -> event_code "${ec}" NOT FOUND`)
}

console.log("\n=== Certificates referencing missing events ===")
const missingEventRefs = new Map<string, number>()
for (const r of sections.certificates) {
  if (!r.cert_id) continue
  const ec = String(r.event_code ?? "").trim().toUpperCase()
  if (!eventCodes.has(ec)) missingEventRefs.set(ec, (missingEventRefs.get(ec) ?? 0) + 1)
}
for (const [ec, count] of missingEventRefs) console.log(`event_code "${ec}" NOT FOUND (${count} certs)`)

console.log("\n=== Feedback referencing missing events ===")
for (const r of sections.feedback) {
  if (!r.event_code) continue
  const ec = String(r.event_code).trim().toUpperCase()
  if (!eventCodes.has(ec)) console.log(`feedback -> event_code "${ec}" NOT FOUND`)
}

// duplicate cert IDs (would collide on upsert-by-certId, silently overwriting)
console.log("\n=== Duplicate cert IDs ===")
const certIdCounts = new Map<string, number>()
for (const r of sections.certificates) {
  if (!r.cert_id) continue
  const id = String(r.cert_id).trim().toUpperCase()
  certIdCounts.set(id, (certIdCounts.get(id) ?? 0) + 1)
}
for (const [id, count] of certIdCounts) if (count > 1) console.log(`certId "${id}" appears ${count} times`)

console.log("\nusers:", sections.users.filter(r => r.user_id).length, "organizers:", sections.organizers.filter(r => r.organizer_cd).length)
