import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import * as dotenv from "dotenv"

dotenv.config()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seeding database…")

  // ── Clean ─────────────────────────────────────────────────────────────────
  await prisma.certificate.deleteMany({ where: { eventCode: "GDG2025" } })
  await prisma.eventFeedback.deleteMany({ where: { eventCode: "GDG2025" } })
  await prisma.event.deleteMany({ where: { eventCode: "GDG2025" } })
  await prisma.template.deleteMany({ where: { organizerCd: "GDG" } })
  await prisma.subscription.deleteMany({ where: { organizerCd: "GDG" } })
  await prisma.organizer.deleteMany({ where: { organizerCd: "GDG" } })
  await prisma.user.deleteMany({ where: { email: "organizer@certhora.com" } })

  // ── User ──────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("password123", 12)
  const user = await prisma.user.create({
    data: {
      email: "organizer@certhora.com",
      passwordHash,
      userType: "ORGANIZER",
      isVerified: true,
      name: "GDG Admin",
    },
  })
  console.log("  ✓ User:", user.email)

  // ── Organizer ─────────────────────────────────────────────────────────────
  const organizer = await prisma.organizer.create({
    data: {
      organizerCd: "GDG",
      userId: user.id,
      orgName: "Google Developer Group KL",
      socialLink: "https://gdg.community/KualaLumpur",
      tier: "PRO",
      certQuota: 1000,
      subscribeDate: new Date("2025-01-01"),
      expiryDate: new Date("2026-01-01"),
    },
  })
  console.log("  ✓ Organizer:", organizer.orgName)

  // ── Subscription ─────────────────────────────────────────────────────────
  await prisma.subscription.create({
    data: { organizerCd: "GDG", tier: "PRO", certQuota: 1000, createdAt: new Date("2025-01-01") },
  })
  console.log("  ✓ Subscription: PRO")

  // ── Template ─────────────────────────────────────────────────────────────
  const template = await prisma.template.create({
    data: {
      organizerCd: "GDG",
      name: "GDG Workshop Template",
      primaryColor: "#1D4ED8",
      nameCenterX: 600,
      nameY: 340,
      nameMaxWidth: 840,
      nameFontSize: 52,
      nameFont: "Arial, Helvetica, sans-serif",
      nameColor: "#1E293B",
      qrX: 1010,
      qrY: 628,
      qrSize: 140,
      certIdFont: "monospace",
      certIdColor: "#64748B",
      showWatermark: false,
    },
  })
  console.log("  ✓ Template:", template.name)

  // ── Event ─────────────────────────────────────────────────────────────────
  const event = await prisma.event.create({
    data: {
      eventCode: "GDG2025",
      templateId: template.id,
      status: "ACTIVE",
      eventName: "Web Development Workshop 2025",
      eventDate: new Date("2025-05-10"),
      issuedDate: new Date("2025-05-11"),
      expiryDate: new Date("2027-05-11"),
      description:
        "A full-day hands-on workshop covering modern web development practices including React, Next.js, TypeScript, and cloud deployment. Participants built and deployed a production-ready application from scratch.",
      skills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "PostgreSQL", "Cloud Deployment"],
      organizerCd: "GDG",
    },
  })
  console.log("  ✓ Event:", event.eventName)

  // ── Certificates ─────────────────────────────────────────────────────────
  const participants = [
    { certId: "GDG1847", name: "Ahmad Fadzil bin Razak",     email: "ahmad.fadzil@example.com" },
    { certId: "GDG2953", name: "Nur Aisha binti Kamaruddin", email: "nuraisha@example.com" },
    { certId: "GDG3761", name: "Raj Kumar Subramaniam",      email: "rajkumar@example.com" },
    { certId: "GDG4082", name: "Siti Fatimah binti Yusof",   email: "sitifatimah@example.com" },
    { certId: "GDG5294", name: "Wong Kar Wei",               email: "wongkarwei@example.com" },
    { certId: "GDG6138", name: "Muhammad Haziq bin Azman",   email: "haziq.azman@example.com" },
    { certId: "GDG7415", name: "Priya Nair",                 email: "priya.nair@example.com" },
  ]

  for (const p of participants) {
    await prisma.certificate.create({
      data: {
        certId: p.certId,
        participantName: p.name,
        participantEmail: p.email,
        eventCode: "GDG2025",
        emailStatus: "SENT",
        shareCount: Math.floor(Math.random() * 12),
        viewCount: Math.floor(Math.random() * 80) + 5,
        sendAttempts: 1,
        queuedAt: new Date("2025-05-11"),
        createdAt: new Date("2025-05-11"),
      },
    })
  }
  console.log(`  ✓ Certificates: ${participants.length} issued`)

  // ── Feedback ──────────────────────────────────────────────────────────────
  await prisma.eventFeedback.createMany({
    data: [
      { eventCode: "GDG2025", npsScore: 10, comment: "Best workshop I've attended. The hands-on sessions were incredibly valuable." },
      { eventCode: "GDG2025", npsScore: 9,  comment: "Great content and well-paced. Would love a follow-up session on advanced topics." },
      { eventCode: "GDG2025", npsScore: 10, comment: "Excellent speakers and practical examples. Already applying what I learned." },
    ],
  })
  console.log("  ✓ Feedback: 3 responses")

  console.log("\n✅ Seed complete!")
  console.log("\n── Login credentials ────────────────────────────────")
  console.log("   Email    : organizer@certhora.com")
  console.log("   Password : password123")
  console.log("\n── Sample cert URLs ─────────────────────────────────")
  participants.slice(0, 3).forEach(p => console.log(`   /certs/view/${p.certId}  →  ${p.name}`))
  console.log("─────────────────────────────────────────────────────\n")
}

main()
  .catch(e => { console.error("❌ Seed failed:", e); process.exit(1) })
  .finally(() => prisma.$disconnect())
