/*
  Warnings:

  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[verificationToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[resetToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('ORGANIZER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('FREE', 'BASIC', 'PRO', 'ELITE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'QUEUED', 'SENT', 'FAILED', 'BOUNCED');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "password",
DROP COLUMN "role",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "resetExpires" TIMESTAMP(3),
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userType" "UserType" NOT NULL DEFAULT 'ORGANIZER',
ADD COLUMN     "verificationToken" TEXT;

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "Organizer" (
    "organizerCd" VARCHAR(4) NOT NULL,
    "userId" TEXT NOT NULL,
    "orgName" TEXT NOT NULL,
    "socialLink" TEXT,
    "tier" "Tier" NOT NULL DEFAULT 'FREE',
    "certQuota" INTEGER NOT NULL DEFAULT 0,
    "expiryDate" TIMESTAMP(3),
    "subscribeDate" TIMESTAMP(3),

    CONSTRAINT "Organizer_pkey" PRIMARY KEY ("organizerCd")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "organizerCd" VARCHAR(4) NOT NULL,
    "tier" "Tier" NOT NULL,
    "certQuota" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "suspendDate" TIMESTAMP(3),

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("organizerCd")
);

-- CreateTable
CREATE TABLE "Event" (
    "eventCode" VARCHAR(7) NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3),
    "issuedDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "description" VARCHAR(1500),
    "skills" TEXT[],
    "organizerCd" VARCHAR(4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("eventCode")
);

-- CreateTable
CREATE TABLE "Template" (
    "eventCode" VARCHAR(7) NOT NULL,
    "primaryColor" VARCHAR(16) NOT NULL,
    "layoutPath" VARCHAR(7) NOT NULL,
    "nameFont" VARCHAR(16) NOT NULL,
    "nameColor" VARCHAR(18) NOT NULL,
    "certIdFont" VARCHAR(5) NOT NULL,
    "certIdColor" VARCHAR(18) NOT NULL,
    "watermark" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("eventCode")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "certId" VARCHAR(12) NOT NULL,
    "participantName" TEXT NOT NULL,
    "participantEmail" VARCHAR(100) NOT NULL,
    "eventCode" VARCHAR(7) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "emailStatus" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "queuedAt" TIMESTAMP(3),
    "sendAttempts" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("certId")
);

-- CreateTable
CREATE TABLE "EventFeedback" (
    "id" SERIAL NOT NULL,
    "eventCode" VARCHAR(7) NOT NULL,
    "npsScore" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "billcode" VARCHAR(100) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "externalRef" VARCHAR(60),
    "tierRequested" "Tier" NOT NULL,
    "certQuotaReq" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "refno" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organizer_userId_key" ON "Organizer"("userId");

-- CreateIndex
CREATE INDEX "Organizer_tier_idx" ON "Organizer"("tier");

-- CreateIndex
CREATE INDEX "Subscription_tier_idx" ON "Subscription"("tier");

-- CreateIndex
CREATE INDEX "Subscription_suspendDate_idx" ON "Subscription"("suspendDate");

-- CreateIndex
CREATE INDEX "Event_organizerCd_idx" ON "Event"("organizerCd");

-- CreateIndex
CREATE INDEX "Event_eventDate_idx" ON "Event"("eventDate");

-- CreateIndex
CREATE INDEX "Event_expiryDate_idx" ON "Event"("expiryDate");

-- CreateIndex
CREATE INDEX "Certificate_eventCode_idx" ON "Certificate"("eventCode");

-- CreateIndex
CREATE INDEX "Certificate_participantEmail_idx" ON "Certificate"("participantEmail");

-- CreateIndex
CREATE INDEX "Certificate_emailStatus_idx" ON "Certificate"("emailStatus");

-- CreateIndex
CREATE INDEX "Certificate_eventCode_emailStatus_idx" ON "Certificate"("eventCode", "emailStatus");

-- CreateIndex
CREATE INDEX "EventFeedback_eventCode_idx" ON "EventFeedback"("eventCode");

-- CreateIndex
CREATE INDEX "PaymentTransaction_userId_idx" ON "PaymentTransaction"("userId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_status_idx" ON "PaymentTransaction"("status");

-- CreateIndex
CREATE INDEX "PaymentTransaction_billcode_idx" ON "PaymentTransaction"("billcode");

-- CreateIndex
CREATE INDEX "PaymentTransaction_status_createdAt_idx" ON "PaymentTransaction"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_verificationToken_key" ON "User"("verificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_resetToken_key" ON "User"("resetToken");

-- CreateIndex
CREATE INDEX "User_verificationToken_idx" ON "User"("verificationToken");

-- CreateIndex
CREATE INDEX "User_resetToken_idx" ON "User"("resetToken");

-- AddForeignKey
ALTER TABLE "Organizer" ADD CONSTRAINT "Organizer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organizerCd_fkey" FOREIGN KEY ("organizerCd") REFERENCES "Organizer"("organizerCd") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_organizerCd_fkey" FOREIGN KEY ("organizerCd") REFERENCES "Organizer"("organizerCd") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_eventCode_fkey" FOREIGN KEY ("eventCode") REFERENCES "Event"("eventCode") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_eventCode_fkey" FOREIGN KEY ("eventCode") REFERENCES "Event"("eventCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventFeedback" ADD CONSTRAINT "EventFeedback_eventCode_fkey" FOREIGN KEY ("eventCode") REFERENCES "Event"("eventCode") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
