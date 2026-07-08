# Certhora TODO

## Known Issues to Check
- [ ] Treat Neon HTTP mode as an ongoing architectural constraint on new mutating code paths � this repo uses Prisma with `PrismaNeonHttp`, so `prisma.$transaction(...)` must not be used. For multi-step writes, use sequential `await`s for dependent operations, `Promise.all` for independent ones, and best-effort cleanup when partial failure matters.
- [x] Confirm `/signup` flow creates user + organizer record correctly — was **completely broken**: `app/api/auth/register/route.ts` used `prisma.$transaction(async tx => ...)`, but Neon's HTTP driver rejects `$transaction` in any form ("Transactions are not supported in HTTP mode"), confirmed by testing directly against the DB. Every signup attempt 500'd. Fixed by replacing with sequential creates + best-effort cleanup on failure. Same bug also found and fixed in `app/api/events/route.ts` (event creation) and the cert-generation DB update (`generate-certificates/route.ts`, switched to `Promise.all`) — **event creation was broken too**.
- [x] Verify certificate generation works end-to-end (R2 upload → public URL) — image generation/upload/array-ordering all correct; the only bug was the `$transaction` DB-update issue above, now fixed.
- [x] Test public cert view page (`/certs/[viewPage]/[certId]`) works without auth — confirmed public (no session check), 404s correctly on missing certId. Fixed two gaps: `viewCount` was never incremented anywhere (now increments on view), and the page had no `dynamic = "force-dynamic"` so Next could have statically cached/staled the rendered cert page.

## Features to Complete
- [ ] `app/(protected)/dashboard/config/page.tsx` — appears empty/stub
- [x] Billing page (`BillingClient.tsx`) — wire up real payment/subscription logic — added `lib/toyyibpay.ts` (mock checkout when `TOYYIBPAY_SECRET_KEY` unset, real API call when set), `/api/billing/checkout` (upgrade, creates `PaymentTransaction`), `/api/billing/downgrade` (schedules a pending tier change for period end, no payment), `/api/billing/callback` (webhook, applies tier/quota/`Subscription` on success), `/api/billing/sync` (applies a lapsed pending downgrade, called from `BillingClient` on mount), and `/billing/mock-pay/[billcode]` (dev-only simulated checkout page since no real toyyibpay creds exist yet). Downgrades apply at end of the current paid period via new `Organizer.pendingTier/pendingCertQuota/pendingEffectiveDate` fields + `lib/billing.ts#applyPendingTierChange`.
- [x] Subscription tier enforcement (FREE quota limits on certificate generation) — was already implemented in `generate-certificates/route.ts`; additionally now applies any lapsed pending downgrade before checking quota.
- [ ] Email sending for certificates (not visible in codebase yet)
- [ ] Participant email features — not yet discussed/decided (e.g. notify participant when cert is issued, resend, reminders). Needs a requirements discussion before scoping.
- [ ] Admin panel (no `/admin` route found in structure) — `proxy.ts` already gates `/admin/*` to `UserType.ADMIN`, but no pages exist yet. **Next plan after billing**: feature flags with per-organizer overrides (global toggle + per-org override row), not just global on/off.

## New Features
- [x] Smart auto-center guides when dragging elements (like Canva) — already implemented in `TemplateEditor.tsx` (snap points for canvas center + sibling elements, rendered guide lines)
- [x] Duplicate event — clone an event's settings/template only, not its participants/certificates. Added "Duplicate" buttons on the events list and event detail page, linking to `New Event` with `?duplicateFrom=<eventCode>`; that page now prefetches and prefills the source event/template (fully editable before saving). Badge image isn't carried over automatically (needs re-upload) since the original file isn't accessible client-side — only its preview/flag are copied.

## Polish
- [x] Landing page (`/`) — confirm sections render correctly (Header/Hero/Features/Pricing/Testimonials/Footer all render, not a stub)
- [x] `/pricing` page — match actual subscription tiers in DB (extracted shared `lib/tiers.ts`, built real pricing page + fixed landing `PricingSection` to use same data)
- [x] Error pages (404, 500) — added `app/not-found.tsx`, `app/error.tsx`, `app/global-error.tsx`
- [ ] Add payment gateway integration — deferred; will use toyyibpay (not yet integrated)
- [ ] Check UI/UX across the app
- [x] Certificate generation — added `CacheControl` header in `lib/r2.ts`, plus `?v=timestamp` cache-busting param on cert image URLs so CDN/browser caches can't serve stale layouts
- [x] Hide X/Y position fields from the template editor for name and QR elements (removed inputs + readout text, drag-to-position kept)
- [x] Replace all placeholder logos with `certhoralogo.svg`, including the favicon — fixed login, signup, sidebar; wired `icons` metadata in `layout.tsx`, removed stale `app/favicon1.ico`


