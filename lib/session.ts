import "server-only";
import { cache } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// React's cache() deduplicates calls with the same arguments within a single
// request — without it, every layout + page in the tree would each re-run
// their own session check and organizer lookup against Neon, multiplying
// round-trip latency on every navigation.
export const getCurrentSession = cache(() => getServerSession(authOptions));

export const getCurrentOrganizer = cache((userId: string) =>
  prisma.organizer.findUnique({
    where: { userId },
    include: { _count: { select: { events: true } } },
  })
);
