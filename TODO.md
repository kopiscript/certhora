# Certhora TODO

## Known Issues to Check
- [ ] Confirm `/signup` flow creates user + organizer record correctly
- [ ] Verify certificate generation works end-to-end (R2 upload → public URL)
- [ ] Test public cert view page (`/certs/[viewPage]/[certId]`) works without auth

## Features to Complete
- [ ] `app/(protected)/dashboard/config/page.tsx` — appears empty/stub
- [ ] Billing page (`BillingClient.tsx`) — wire up real payment/subscription logic
- [ ] Subscription tier enforcement (FREE quota limits on certificate generation)
- [ ] Email sending for certificates (not visible in codebase yet)
- [ ] Participant email features — not yet discussed/decided (e.g. notify participant when cert is issued, resend, reminders). Needs a requirements discussion before scoping.
- [ ] Admin panel (no `/admin` route found in structure)

## New Features
- [ ] Smart auto-center guides when dragging elements (like Canva) — snap-to-center/edge alignment lines appear while dragging on the certificate template editor
- [ ] Duplicate event — clone an event's settings/template only, not its participants/certificates. User must be able to edit the event details (name, date, etc.) each time before/while duplicating, not just get an identical copy.

## Polish
- [x] Landing page (`/`) — confirm sections render correctly (Header/Hero/Features/Pricing/Testimonials/Footer all render, not a stub)
- [x] `/pricing` page — match actual subscription tiers in DB (extracted shared `lib/tiers.ts`, built real pricing page + fixed landing `PricingSection` to use same data)
- [x] Error pages (404, 500) — added `app/not-found.tsx`, `app/error.tsx`, `app/global-error.tsx`
- [ ] Add payment gateway integration — deferred; will use toyyibpay (not yet integrated)
- [ ] Check UI/UX across the app
- [x] Certificate generation — added `CacheControl` header in `lib/r2.ts`, plus `?v=timestamp` cache-busting param on cert image URLs so CDN/browser caches can't serve stale layouts
- [x] Hide X/Y position fields from the template editor for name and QR elements (removed inputs + readout text, drag-to-position kept)
- [x] Replace all placeholder logos with `certhoralogo.svg`, including the favicon — fixed login, signup, sidebar; wired `icons` metadata in `layout.tsx`, removed stale `app/favicon1.ico`
