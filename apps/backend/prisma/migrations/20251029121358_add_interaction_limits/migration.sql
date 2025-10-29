-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "hasSharedImage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "messageCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "postDiagnosisMessageCount" INTEGER NOT NULL DEFAULT 0;
