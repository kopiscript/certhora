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

**Stack**: Next.js 16.2.6 (App Router), React 19, TypeScript, Tailwind CSS v4, Prisma v7 + PostgreSQL, NextAuth v4.

**Auth flow**: `lib/auth.ts` configures NextAuth with a credentials provider (email + bcrypt password). Sessions use JWT strategy — `role` and `id` are injected into both the JWT token and session object via callbacks. The catch-all route at `app/api/auth/[...nextAuth]/route.ts` handles all auth endpoints. `components/providers/auth-provider.tsx` wraps the app in `SessionProvider` (client component). Root `app/page.tsx` immediately redirects to `/login`.

**Database**: Prisma client is a singleton on `globalThis` (see `lib/prisma.ts`) to avoid connection exhaustion in dev. Schema lives in `prisma/schema.prisma` — models are `User` (with `Role` enum: USER/ADMIN), plus NextAuth adapter models `Account`, `Session`, `VerificationToken`. Requires `DATABASE_URL` in `.env`.

**Path alias**: `@/*` maps to the project root (e.g. `@/lib/auth`, `@/components/...`).

**Required env vars**: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`.
