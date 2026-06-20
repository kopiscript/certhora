import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { orgName, organizerCd, email, password, socialLink } = await req.json();

  if (!orgName?.trim()) {
    return NextResponse.json({ error: "Organization name is required", field: "orgName" }, { status: 400 });
  }

  if (!organizerCd || organizerCd.length < 2 || organizerCd.length > 4) {
    return NextResponse.json({ error: "Organizer code must be 2–4 characters", field: "organizerCd" }, { status: 400 });
  }

  if (!/^[A-Z0-9]+$/.test(organizerCd)) {
    return NextResponse.json({ error: "Organizer code must be alphanumeric", field: "organizerCd" }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ error: "Email is required", field: "email" }, { status: 400 });
  }

  if (!password || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters", field: "password" }, { status: 400 });
  }

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return NextResponse.json({ error: "Email already in use", field: "email" }, { status: 409 });
  }

  const existingCd = await prisma.organizer.findUnique({ where: { organizerCd } });
  if (existingCd) {
    return NextResponse.json({ error: "Organizer code already taken — try a different one", field: "organizerCd" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const userId = randomUUID();

  // Neon's HTTP driver supports neither interactive nor array/batch
  // `$transaction` calls (both reject with "Transactions are not supported
  // in HTTP mode") — so these writes run as sequential statements instead,
  // with best-effort cleanup if a later step fails.
  try {
    await prisma.user.create({
      data: { id: userId, email, passwordHash, userType: "ORGANIZER" },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "Email already in use", field: "email" }, { status: 409 });
    }
    console.error("[register] failed to create user:", err);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }

  try {
    await prisma.organizer.create({
      data: {
        organizerCd,
        userId,
        orgName: orgName.trim(),
        socialLink: socialLink ?? null,
        tier: "FREE",
        certQuota: 30,
      },
    });
    await prisma.subscription.create({
      data: { organizerCd, tier: "FREE", certQuota: 30 },
    });
  } catch (err) {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "Organizer code already taken — try a different one", field: "organizerCd" },
        { status: 409 }
      );
    }
    console.error("[register] failed to create organizer:", err);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
