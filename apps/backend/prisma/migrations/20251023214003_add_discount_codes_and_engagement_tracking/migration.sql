-- AlterTable
ALTER TABLE "diagnoses" ADD COLUMN     "diagnosticMode" TEXT,
ADD COLUMN     "engagementScore" DOUBLE PRECISION,
ADD COLUMN     "questionsAsked" INTEGER;

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "avgResponseLength" DOUBLE PRECISION,
ADD COLUMN     "completedDiagnosis" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "convertedToChat" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "diagnosticMode" TEXT,
ADD COLUMN     "engagementScore" DOUBLE PRECISION,
ADD COLUMN     "engagementSignals" JSONB,
ADD COLUMN     "questionsAsked" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "timeSpent" INTEGER,
ADD COLUMN     "wordpressLeadId" TEXT;

-- CreateTable
CREATE TABLE "discount_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "percentage" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discount_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "discount_codes_code_key" ON "discount_codes"("code");

-- CreateIndex
CREATE INDEX "discount_codes_sessionId_idx" ON "discount_codes"("sessionId");

-- CreateIndex
CREATE INDEX "discount_codes_code_idx" ON "discount_codes"("code");

-- AddForeignKey
ALTER TABLE "discount_codes" ADD CONSTRAINT "discount_codes_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
