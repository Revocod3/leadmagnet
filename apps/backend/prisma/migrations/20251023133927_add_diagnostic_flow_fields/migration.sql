-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "currentQuestionIndex" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "flowState" JSONB;
