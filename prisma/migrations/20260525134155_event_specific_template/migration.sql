/*
  Warnings:

  - You are about to drop the column `templateId` on the `Event` table. All the data in the column will be lost.
  - The primary key for the `Template` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Template` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Template` table. All the data in the column will be lost.
  - You are about to drop the column `organizerCd` on the `Template` table. All the data in the column will be lost.
  - Added the required column `eventCode` to the `Template` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_templateId_fkey";

-- DropForeignKey
ALTER TABLE "Template" DROP CONSTRAINT "Template_organizerCd_fkey";

-- DropIndex
DROP INDEX "Template_organizerCd_idx";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "templateId";

-- AlterTable
ALTER TABLE "Template" DROP CONSTRAINT "Template_pkey",
DROP COLUMN "id",
DROP COLUMN "name",
DROP COLUMN "organizerCd",
ADD COLUMN     "additional" JSONB,
ADD COLUMN     "eventCode" VARCHAR(10) NOT NULL,
ADD CONSTRAINT "Template_pkey" PRIMARY KEY ("eventCode");

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_eventCode_fkey" FOREIGN KEY ("eventCode") REFERENCES "Event"("eventCode") ON DELETE CASCADE ON UPDATE CASCADE;
