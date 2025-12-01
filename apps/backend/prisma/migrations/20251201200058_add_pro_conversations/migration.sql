/*
  Warnings:

  - A unique constraint covering the columns `[googleId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[facebookId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "facebookId" TEXT,
ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'email',
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'FREE';

-- CreateTable
CREATE TABLE "pro_conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "summary" TEXT,
    "openaiConversationId" TEXT,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pro_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pro_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pro_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pro_conversations_userId_idx" ON "pro_conversations"("userId");

-- CreateIndex
CREATE INDEX "pro_conversations_lastMessageAt_idx" ON "pro_conversations"("lastMessageAt");

-- CreateIndex
CREATE INDEX "pro_messages_conversationId_idx" ON "pro_messages"("conversationId");

-- CreateIndex
CREATE INDEX "pro_messages_createdAt_idx" ON "pro_messages"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "users_facebookId_key" ON "users"("facebookId");

-- AddForeignKey
ALTER TABLE "pro_conversations" ADD CONSTRAINT "pro_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pro_messages" ADD CONSTRAINT "pro_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "pro_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
