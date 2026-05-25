import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, passwordHash, userType: "ORGANIZER" },
    });

    await tx.organizer.create({
      data: {
        organizerCd,
        userId: user.id,
        orgName: orgName.trim(),
        socialLink: socialLink ?? null,
        tier: "FREE",
        certQuota: 30,
      },
    });

    await tx.subscription.create({
      data: {
        organizerCd,
        tier: "FREE",
        certQuota: 30,
      },
    });
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
