# Certhora TODO

## Current State for Next Session
- [x] Pricing changed to two plans only: Free and Pro. Source of truth is `lib/tiers.ts`.
  - Free: RM 0, 100 certificates/month, can generate and manually share/download certs, cannot email participants.
  - Pro: RM 10/month, 500 certificates/month, can email participants.
- [x] Removed Starter from the self-serve product and cleaned up the database enum. `prisma/schema.prisma` now has `Tier { FREE, PRO }` only.
- [x] Added migration `prisma/migrations/20260717000000_remove_legacy_tiers/migration.sql` to convert legacy `STARTER` and `ENTERPRISE` rows to `PRO`, then rebuild the Postgres enum with only `FREE` and `PRO`.
- [x] Participant email delivery is Pro-only in both UI and API:
  - `POST /api/events/[eventCode]/send-emails`
  - `POST /api/participants/send-emails`
  - Event detail and participants dashboard send buttons are disabled on Free.
- [x] Prisma client was regenerated after the enum cleanup with `npx prisma generate`.
- [x] `npx prisma validate` passed after the cleanup.
- [ ] Apply the new migration against the real database from an environment with direct Postgres connectivity: `npx prisma migrate deploy`.
- [ ] `npm run lint` still fails on existing React lint issues unrelated to pricing cleanup. Known examples: synchronous `setState` in effects, `events/new/page.tsx` accessing `setError` before declaration, and `TemplateEditor.tsx` defining a component during render.

## Known Issues to Check
- [ ] Treat Neon HTTP mode as an ongoing architectural constraint on new mutating code paths - this repo uses Prisma with `PrismaNeonHttp`, so `prisma.$transaction(...)` must not be used. For multi-step writes, use sequential `await`s for dependent operations, `Promise.all` for independent ones, and best-effort cleanup when partial failure matters.
- [x] Confirm `/signup` flow creates user + organizer record correctly - was broken by `prisma.$transaction(...)` in `app/api/auth/register/route.ts`; fixed by sequential creates + best-effort cleanup. Same constraint was fixed in event creation and certificate generation updates.
- [x] Verify certificate generation works end-to-end (R2 upload -> public URL). Image generation/upload/array-ordering are correct; DB update issue was the transaction bug above.
- [x] Test public cert view page (`/certs/[viewPage]/[certId]`) works without auth. It is public, force-dynamic, 404s correctly on missing certId, and increments `viewCount`.

## Features to Complete
- [ ] `app/(protected)/dashboard/config/page.tsx` appears empty/stub.
- [x] Billing page (`BillingClient.tsx`) wired to Billplz/mock checkout flow. Upgrades create a `PaymentTransaction` through `/api/billing/checkout`; callbacks apply tier/quota/subscription; downgrades schedule pending changes through `/api/billing/downgrade`; `/api/billing/sync` applies pending/expired subscription changes.
- [x] Subscription tier enforcement: certificate generation enforces monthly quota and applies pending/expired subscription changes before quota checks.
- [x] Certificate email sending exists and is manual, capped at 20 certs per invocation. Free cannot email participants; Pro can.
- [x] Participant email features: event-level resendable batch send and selected-participant send are implemented.
- [ ] Admin panel (no `/admin` route found in structure) - `proxy.ts` already gates `/admin/*` to `UserType.ADMIN`, but no pages exist yet. Suggested next plan: feature flags with per-organizer overrides.

## New Features
- [x] Smart auto-center guides when dragging elements (like Canva) - implemented in `TemplateEditor.tsx`.
- [x] Duplicate event - clone event settings/template only, not participants/certificates. Badge image is not carried over automatically.

## Polish
- [x] Landing page (`/`) renders Header/Hero/Features/Pricing/Testimonials/Footer.
- [x] `/pricing` page uses shared `lib/tiers.ts` and now reflects Free/Pro only.
- [x] Error pages added: `app/not-found.tsx`, `app/error.tsx`, `app/global-error.tsx`.
- [x] Payment gateway integration is Billplz with mock fallback.
- [ ] Check UI/UX across the app after the pricing change, especially the two-card pricing grid and Pro-only email messaging.
- [x] Certificate generation cache-busting: R2 `CacheControl` plus `?v=timestamp` on cert image URLs.
- [x] Hide X/Y position fields from the template editor for name and QR elements.
- [x] Replace placeholder logos with `certhoralogo.svg`, including favicon metadata.