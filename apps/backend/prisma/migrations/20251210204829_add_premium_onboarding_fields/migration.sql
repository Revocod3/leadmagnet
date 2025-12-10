-- AlterTable
ALTER TABLE "user_global_contexts" ADD COLUMN     "premiumOnboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "premiumOnboardingResponses" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "premiumOnboardingStep" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "profileTags" JSONB NOT NULL DEFAULT '{}';
