/*
  Warnings:

  - The values [BASIC,ELITE] on the enum `Tier` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Tier_new" AS ENUM ('FREE', 'STARTER', 'PRO', 'ENTERPRISE');
ALTER TABLE "public"."Organizer" ALTER COLUMN "tier" DROP DEFAULT;
ALTER TABLE "Organizer" ALTER COLUMN "tier" TYPE "Tier_new" USING ("tier"::text::"Tier_new");
ALTER TABLE "Subscription" ALTER COLUMN "tier" TYPE "Tier_new" USING ("tier"::text::"Tier_new");
ALTER TABLE "PaymentTransaction" ALTER COLUMN "tierRequested" TYPE "Tier_new" USING ("tierRequested"::text::"Tier_new");
ALTER TYPE "Tier" RENAME TO "Tier_old";
ALTER TYPE "Tier_new" RENAME TO "Tier";
DROP TYPE "public"."Tier_old";
ALTER TABLE "Organizer" ALTER COLUMN "tier" SET DEFAULT 'FREE';
COMMIT;
