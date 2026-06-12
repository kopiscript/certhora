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
- [ ] Admin panel (no `/admin` route found in structure)

## New Features
- [ ] Smart auto-center guides when dragging elements (like Canva) — snap-to-center/edge alignment lines appear while dragging on the certificate template editor

## Polish
- [ ] Landing page (`/`) — confirm sections render correctly
- [ ] `/pricing` page — match actual subscription tiers in DB
- [ ] Error pages (404, 500)
