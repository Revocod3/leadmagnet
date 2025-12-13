-- AlterTable
ALTER TABLE "user_global_contexts" ADD COLUMN     "profileTags" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "tagsGeneratedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "personalized_documents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sourceConversationId" TEXT,
    "isPDFAvailable" BOOLEAN NOT NULL DEFAULT false,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personalized_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "personalized_documents_userId_idx" ON "personalized_documents"("userId");

-- CreateIndex
CREATE INDEX "personalized_documents_type_idx" ON "personalized_documents"("type");

-- AddForeignKey
ALTER TABLE "personalized_documents" ADD CONSTRAINT "personalized_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
