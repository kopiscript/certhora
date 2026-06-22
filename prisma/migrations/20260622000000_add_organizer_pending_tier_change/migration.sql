-- AlterTable
ALTER TABLE "Organizer" ADD COLUMN     "pendingTier" "Tier",
ADD COLUMN     "pendingCertQuota" INTEGER,
ADD COLUMN     "pendingEffectiveDate" TIMESTAMP(3);
