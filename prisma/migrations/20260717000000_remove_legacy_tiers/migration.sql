-- Normalize legacy paid tiers before shrinking the enum.
UPDATE "Organizer"
SET "tier" = 'PRO'
WHERE "tier" IN ('STARTER', 'ENTERPRISE');

UPDATE "Organizer"
SET "pendingTier" = 'PRO'
WHERE "pendingTier" IN ('STARTER', 'ENTERPRISE');

UPDATE "Subscription"
SET "tier" = 'PRO'
WHERE "tier" IN ('STARTER', 'ENTERPRISE');

UPDATE "PaymentTransaction"
SET "tierRequested" = 'PRO'
WHERE "tierRequested" IN ('STARTER', 'ENTERPRISE');

-- AlterEnum
BEGIN;
CREATE TYPE "Tier_new" AS ENUM ('FREE', 'PRO');
ALTER TABLE "public"."Organizer" ALTER COLUMN "tier" DROP DEFAULT;
ALTER TABLE "Organizer" ALTER COLUMN "tier" TYPE "Tier_new" USING ("tier"::text::"Tier_new");
ALTER TABLE "Organizer" ALTER COLUMN "pendingTier" TYPE "Tier_new" USING ("pendingTier"::text::"Tier_new");
ALTER TABLE "Subscription" ALTER COLUMN "tier" TYPE "Tier_new" USING ("tier"::text::"Tier_new");
ALTER TABLE "PaymentTransaction" ALTER COLUMN "tierRequested" TYPE "Tier_new" USING ("tierRequested"::text::"Tier_new");
ALTER TYPE "Tier" RENAME TO "Tier_old";
ALTER TYPE "Tier_new" RENAME TO "Tier";
DROP TYPE "public"."Tier_old";
ALTER TABLE "Organizer" ALTER COLUMN "tier" SET DEFAULT 'FREE';
COMMIT;