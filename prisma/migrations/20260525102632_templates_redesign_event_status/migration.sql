/*
  Warnings:

  - The primary key for the `Event` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Template` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `eventCode` on the `Template` table. All the data in the column will be lost.
  - You are about to drop the column `layoutPath` on the `Template` table. All the data in the column will be lost.
  - You are about to drop the column `watermark` on the `Template` table. All the data in the column will be lost.
  - The required column `id` was added to the `Template` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `name` to the `Template` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizerCd` to the `Template` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Template` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- DropForeignKey
ALTER TABLE "Certificate" DROP CONSTRAINT "Certificate_eventCode_fkey";

-- DropForeignKey
ALTER TABLE "EventFeedback" DROP CONSTRAINT "EventFeedback_eventCode_fkey";

-- DropForeignKey
ALTER TABLE "Template" DROP CONSTRAINT "Template_eventCode_fkey";

-- AlterTable
ALTER TABLE "Certificate" ALTER COLUMN "eventCode" SET DATA TYPE VARCHAR(10);

-- AlterTable
ALTER TABLE "Event" DROP CONSTRAINT "Event_pkey",
ADD COLUMN     "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "templateId" TEXT,
ALTER COLUMN "eventCode" SET DATA TYPE VARCHAR(10),
ADD CONSTRAINT "Event_pkey" PRIMARY KEY ("eventCode");

-- AlterTable
ALTER TABLE "EventFeedback" ALTER COLUMN "eventCode" SET DATA TYPE VARCHAR(10);

-- AlterTable
ALTER TABLE "Template" DROP CONSTRAINT "Template_pkey",
DROP COLUMN "eventCode",
DROP COLUMN "layoutPath",
DROP COLUMN "watermark",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "nameCenterX" DOUBLE PRECISION NOT NULL DEFAULT 600,
ADD COLUMN     "nameFontSize" DOUBLE PRECISION NOT NULL DEFAULT 52,
ADD COLUMN     "nameMaxWidth" DOUBLE PRECISION NOT NULL DEFAULT 840,
ADD COLUMN     "nameY" DOUBLE PRECISION NOT NULL DEFAULT 340,
ADD COLUMN     "organizerCd" VARCHAR(4) NOT NULL,
ADD COLUMN     "qrSize" DOUBLE PRECISION NOT NULL DEFAULT 140,
ADD COLUMN     "qrX" DOUBLE PRECISION NOT NULL DEFAULT 1010,
ADD COLUMN     "qrY" DOUBLE PRECISION NOT NULL DEFAULT 628,
ADD COLUMN     "showWatermark" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "primaryColor" SET DEFAULT '#1D4ED8',
ALTER COLUMN "nameFont" SET DEFAULT 'Arial, Helvetica, sans-serif',
ALTER COLUMN "nameFont" SET DATA TYPE VARCHAR(64),
ALTER COLUMN "nameColor" SET DEFAULT '#1E293B',
ALTER COLUMN "certIdFont" SET DEFAULT 'monospace',
ALTER COLUMN "certIdFont" SET DATA TYPE VARCHAR(64),
ALTER COLUMN "certIdColor" SET DEFAULT '#64748B',
ADD CONSTRAINT "Template_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "Event_status_idx" ON "Event"("status");

-- CreateIndex
CREATE INDEX "Template_organizerCd_idx" ON "Template"("organizerCd");

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_organizerCd_fkey" FOREIGN KEY ("organizerCd") REFERENCES "Organizer"("organizerCd") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_eventCode_fkey" FOREIGN KEY ("eventCode") REFERENCES "Event"("eventCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventFeedback" ADD CONSTRAINT "EventFeedback_eventCode_fkey" FOREIGN KEY ("eventCode") REFERENCES "Event"("eventCode") ON DELETE CASCADE ON UPDATE CASCADE;
