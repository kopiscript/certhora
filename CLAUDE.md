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

**Pricing/tiers**: `lib/tiers.ts` is the single source of truth for tier pricing/quota/feature data (`TIERS`, `TierKey`). Used by the `/pricing` page, the landing page's `PricingSection`, and the dashboard `BillingClient`. Update tier data there, not in the components.

**File storage**: `lib/r2.ts` uploads to Cloudflare R2 via `uploadToR2(key, body, contentType, cacheControl?)`. Certificate images reuse a stable key per `certId` (`certificates/{certId}.png`), so the generate-certificates route appends a `?v={timestamp}` cache-busting query param to the stored `imageUrl` on every regeneration — without it, CDN/browser caches keep serving the pre-update image after a template layout change.

**Path alias**: `@/*` maps to the project root (e.g. `@/lib/auth`, `@/components/...`).

**Required env vars**: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`.
