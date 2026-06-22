# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev       # start dev server at localhost:3000
npm run build     # production build
npm run lint      # run ESLint
npx prisma migrate dev   # apply schema changes and regenerate client
npx prisma generate      # regenerate Prisma client after schema edits
npx prisma studio        # open Prisma GUI at localhost:5555
```

## Architecture

**Stack**: Next.js 16.2.6 (App Router), React 19, TypeScript, Tailwind CSS v4, Prisma v7 + Neon PostgreSQL (HTTP driver), NextAuth v4, Cloudflare R2 (S3-compatible storage).

**Auth flow**: `lib/auth.ts` configures NextAuth with a credentials provider (email + bcrypt password). Sessions use JWT strategy — `userType` and `id` are injected into both the JWT token and session object via callbacks. The catch-all route at `app/api/auth/[...nextAuth]/route.ts` handles all auth endpoints. `components/providers/auth-provider.tsx` wraps the app in `SessionProvider` (client component). Root `app/page.tsx` renders the marketing landing page (Header/Hero/Features/Pricing/Testimonials/Footer); `/login` and `/signup` are separate routes.

**Session/organizer dedup**: `lib/session.ts` exports `getCurrentSession()` and `getCurrentOrganizer(userId)`, both wrapped in React's `cache()`. Always use these instead of calling `getServerSession(authOptions)` or `prisma.organizer.findUnique` directly in layouts/pages — `cache()` dedupes identical calls within one request, so the protected layout and the page it wraps share a single session check and a single organizer query instead of each re-querying Neon. `getCurrentOrganizer` always includes `_count.events`.

**Database**: Prisma client is a singleton on `globalThis` (see `lib/prisma.ts`), using `PrismaNeonHttp` — every query is an HTTPS round-trip (no persistent connection), so avoid sequential/redundant queries; batch independent queries with `Promise.all`. Schema lives in `prisma/schema.prisma`. Core domain models: `User` (`UserType` enum), `Organizer` (`Tier` enum: FREE/STARTER/PRO/ENTERPRISE), `Subscription`, `Template`, `Event` (`EventStatus`), `Certificate` (`EmailStatus`), `EventFeedback`, `PaymentTransaction` (`PaymentStatus`) — plus NextAuth adapter models `Account`, `Session`, `VerificationToken`. Requires `DATABASE_URL` in `.env`.

**Never use `prisma.$transaction(...)`** — neither the interactive callback form nor the array/batch form. `PrismaNeonHttp` rejects both with `"Transactions are not supported in HTTP mode"` (verified by testing directly against the DB). This previously broke signup (`api/auth/register`) and event creation (`api/events`) silently with 500s. Instead, run writes as sequential `await` statements (with manual best-effort cleanup on failure, since there's no real rollback) or, for independent rows, `Promise.all`.

**Pricing/tiers**: `lib/tiers.ts` is the single source of truth for tier pricing/quota/feature data (`TIERS`, `TierKey`). Used by the `/pricing` page, the landing page's `PricingSection`, and the dashboard `BillingClient`. Update tier data there, not in the components.

**Billing/subscriptions**: `lib/toyyibpay.ts` exports `createBill()` — calls the real toyyibpay API when `TOYYIBPAY_SECRET_KEY`/`TOYYIBPAY_CATEGORY_CODE` are set, otherwise falls back to a mock mode that returns a `/billing/mock-pay/[billcode]` URL (a dev-only unauthenticated page with "Simulate Success/Failure" buttons) — there are no real toyyibpay credentials yet, planning to test against their sandbox env later. Upgrades go through `POST /api/billing/checkout` (creates a `PaymentTransaction`, redirects to the bill URL) and apply **immediately** via `POST /api/billing/callback` (the webhook toyyibpay/mock-pay posts back to — idempotent on already-resolved transactions, updates `Organizer.tier/certQuota/expiryDate` and upserts `Subscription`). Downgrades go through `POST /api/billing/downgrade` and apply **at the end of the current paid period** instead, since no payment is involved: they write `Organizer.pendingTier`/`pendingCertQuota`/`pendingEffectiveDate` rather than changing the tier right away. `lib/billing.ts#applyPendingTierChange(organizerCd)` is what actually flips a lapsed pending downgrade — there's no cron in this project, so it's called from two mutating contexts instead: `generate-certificates/route.ts` (before the quota check) and `POST /api/billing/sync` (called once from `BillingClient` on mount so the UI reflects it promptly). Quota enforcement itself (`organizer.certQuota` vs. monthly usage) lives in `generate-certificates/route.ts` and predates this billing work.

**File storage**: `lib/r2.ts` uploads to Cloudflare R2 via `uploadToR2(key, body, contentType, cacheControl?)`. Certificate images reuse a stable key per `certId` (`certificates/{certId}.png`), so the generate-certificates route appends a `?v={timestamp}` cache-busting query param to the stored `imageUrl` on every regeneration — without it, CDN/browser caches keep serving the pre-update image after a template layout change.

**Template editor**: `components/template-editor/TemplateEditor.tsx` lets organizers drag the name/QR/custom-text elements over a 1200×840 canvas (rendered at `DISPLAY_W=720` via `SCALE`). Raw X/Y inputs are intentionally hidden from the UI — position is drag-only. Dragging snaps to canvas-center and to other elements' centers (`SNAP` px threshold) and renders red guide lines while active.

**Duplicate event**: "Duplicate" buttons on the events list and event detail page link to `/dashboard/events/new?duplicateFrom=<eventCode>`. That page fetches `GET /api/events/[eventCode]` and prefills name/dates/description/skills/template into editable state — no participants/certificates are ever copied (the new-event flow doesn't create them by default). The badge image file itself can't be carried over client-side, so only its preview/flag copy and the organizer must re-upload.

**Public cert view page**: `app/(public)/certs/[viewPage]/[certId]/page.tsx` is intentionally unauthenticated and marked `force-dynamic` (no static caching, since it increments `Certificate.viewCount` on every visit). `viewPage` is a cosmetic slug only — `certId` is the real lookup key.

**Path alias**: `@/*` maps to the project root (e.g. `@/lib/auth`, `@/components/...`).

**Required env vars**: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`. Optional: `TOYYIBPAY_SECRET_KEY`, `TOYYIBPAY_CATEGORY_CODE` (billing falls back to mock mode when unset — see above).

**Migrations need a direct DB connection, the app doesn't**: `npx prisma migrate dev`/`deploy` connects over raw TCP (port 5432), but the app's runtime queries go through `PrismaNeonHttp` over HTTPS (`lib/prisma.ts`). In sandboxed/agent environments that only permit HTTPS egress, port 5432 is unreachable — `prisma generate` (schema-only, no DB connection) still works, but migrations must be run from an environment with real Postgres connectivity (e.g. the user's own machine).
