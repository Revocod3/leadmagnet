-- AlterTable
ALTER TABLE "user_global_contexts" ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboardingTurn" INTEGER NOT NULL DEFAULT 0;
