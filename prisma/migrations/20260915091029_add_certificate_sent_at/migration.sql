-- AlterTable
ALTER TABLE "Certificate" ADD COLUMN     "sentAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Certificate_emailStatus_sentAt_idx" ON "Certificate"("emailStatus", "sentAt");
