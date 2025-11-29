-- CreateTable
CREATE TABLE "chat_ratings" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "flowType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_ratings_sessionId_idx" ON "chat_ratings"("sessionId");

-- AddForeignKey
ALTER TABLE "chat_ratings" ADD CONSTRAINT "chat_ratings_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
