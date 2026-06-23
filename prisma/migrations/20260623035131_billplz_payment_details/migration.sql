-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'FPX');

-- AlterTable (nullable first so the existing row can be backfilled)
ALTER TABLE "PaymentTransaction" ADD COLUMN     "paymentMethod" "PaymentMethod",
ADD COLUMN     "payorCountry" VARCHAR(60),
ADD COLUMN     "payorEmail" VARCHAR(255),
ADD COLUMN     "payorFirstName" VARCHAR(80),
ADD COLUMN     "payorLastName" VARCHAR(80),
ADD COLUMN     "payorPhone" VARCHAR(30);

-- Backfill existing row(s) from the related User, since this data predates the checkout form.
UPDATE "PaymentTransaction" pt
SET "paymentMethod" = 'FPX',
    "payorCountry" = 'Malaysia',
    "payorEmail" = u."email",
    "payorFirstName" = COALESCE(NULLIF(split_part(u."name", ' ', 1), ''), 'Unknown'),
    "payorLastName" = COALESCE(NULLIF(substring(u."name" from position(' ' in u."name") + 1), ''), 'Unknown'),
    "payorPhone" = ''
FROM "User" u
WHERE u."id" = pt."userId";

-- Now that every row has a value, enforce NOT NULL.
ALTER TABLE "PaymentTransaction" ALTER COLUMN "paymentMethod" SET NOT NULL,
ALTER COLUMN "payorCountry" SET NOT NULL,
ALTER COLUMN "payorEmail" SET NOT NULL,
ALTER COLUMN "payorFirstName" SET NOT NULL,
ALTER COLUMN "payorLastName" SET NOT NULL,
ALTER COLUMN "payorPhone" SET NOT NULL;
