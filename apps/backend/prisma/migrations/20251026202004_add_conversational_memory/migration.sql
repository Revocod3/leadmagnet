-- CreateTable
CREATE TABLE "conversational_memory" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "factualInfo" JSONB NOT NULL DEFAULT '{}',
    "emotionalMarkers" JSONB NOT NULL DEFAULT '[]',
    "keyMoments" JSONB NOT NULL DEFAULT '[]',
    "userStyle" JSONB NOT NULL DEFAULT '{}',
    "currentHypothesis" JSONB NOT NULL DEFAULT '{}',
    "conversationPhase" TEXT NOT NULL DEFAULT 'introduction',
    "topicsExplored" JSONB NOT NULL DEFAULT '[]',
    "turnCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversational_memory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conversational_memory_sessionId_key" ON "conversational_memory"("sessionId");

-- CreateIndex
CREATE INDEX "conversational_memory_sessionId_idx" ON "conversational_memory"("sessionId");

-- AddForeignKey
ALTER TABLE "conversational_memory" ADD CONSTRAINT "conversational_memory_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
