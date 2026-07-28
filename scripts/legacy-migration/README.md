# Legacy data migration

Migrates the old PHP/MySQL Certhora export (`certhora_kybolwaz.csv`, gitignored — contains
real password hashes and emails, never commit it) into the current Prisma/Postgres schema.

## Usage

```bash
# Dry run (default) — parses, transforms, validates, archives payment history. No DB writes.
npx tsx scripts/legacy-migration/migrate.ts

# Actually write to DATABASE_URL
npx tsx scripts/legacy-migration/migrate.ts --commit

# Point at a different CSV path
npx tsx scripts/legacy-migration/migrate.ts --file /path/to/export.csv
```

Re-running with `--commit` is safe — every insert is an upsert keyed on the natural primary
key (certId, eventCode, organizerCd, user id), so a partial failure can just be re-run.

## Decisions this script encodes (agreed with the project owner)

- **Tier mapping**: old `tier` column is `0=Free, 1=Starter, 2=Flexible, 3=Pro, 4=Enterprise`
  (confirmed from the old repo's `database_schema_complete.sql`). Maps to `0→FREE`,
  everything else `→PRO`, matching how `STARTER`/`ENTERPRISE` were already collapsed into
  `PRO` in this schema's own migration history.
- **Cert quota**: migrated organizers get the *current* tier default (Free=100, Pro=500),
  not whatever the old `cert_quota` column said (it was `0` almost everywhere and doesn't
  mean the same thing under the new quota-enforcement system).
- **Payment history**: archived to `archive-payment-history.json` (gitignored), **not**
  written to the live `PaymentTransaction` table. The old pricing model (flat fees / per-cert
  charges / enterprise flat rate) has no equivalent in the current Free/Pro schema, and the
  new table requires payor fields (name/email/phone/country/method) the old data never had.
- **`others` field** (old per-cert freeform text — job titles, committee roles, paper
  abstract titles): preserved in `Certificate.metadata` (currently unused by the app, but
  available if a future feature wants to surface it).
- **Event status**: all migrated events get `ACTIVE` (they already have issued certs).
- **User.name**: backfilled from `Organizer.orgName` as a placeholder display name.
- **Template images**: `imageUrl` is left `null` for every migrated event — they render with
  the new app's own procedural background rather than trying to recreate the old PHP
  layouts' shared default images. No R2 upload needed.
- **Template layout positions**: the old system used named presets (`layout1`..`layout7`)
  positioning name/QR/cert-ID as mm-offsets or percentages against a 297x210mm canvas,
  rendered client-side. `layout-presets.ts` converts those into the new schema's pixel
  coordinates (1200x840 canvas) — approximate, not pixel-perfect, since the anchor models
  differ (top-left/right/bottom vs. center-anchored). Organizers can nudge positions in the
  template editor afterward.
- **Missing-parent rows**: organizer `ZDAY` referenced a `user_id` that doesn't exist in the
  export, and event `CIT001` referenced an organizer_cd (`CIT`) that doesn't exist either —
  both are skipped entirely (and anything hanging off them cascades: `ZDAY001` event/template/
  certs, `CIT001` template/certs).
- **Orphaned certificates**: 16 certificates (15 under `AFS007`, 1 under `CTRA005`) reference
  event codes with no row in the old events export at all — a pre-existing gap in the old
  data, not something this export missed. A minimal placeholder `Event` is created for each
  (name = the event code, no description/dates, organizer derived by longest-prefix match
  against known organizer codes) so these real certificates aren't lost.

## Files

- `migrate.ts` — the script itself
- `layout-presets.ts` — old layout name → new pixel-coordinate mapping
- `transforms.ts` — small parsing/cleanup helpers (font mapping, color normalization,
  mojibake cleanup, date/int parsing)
- `_integrity-check.ts` — standalone diagnostic that reports referential-integrity gaps in
  the CSV before running the real migration (missing FKs, duplicate cert IDs)
- `archive-payment-history.json` — generated on every run (dry or committed), gitignored
