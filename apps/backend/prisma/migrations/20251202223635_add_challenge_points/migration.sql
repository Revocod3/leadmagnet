-- AlterTable
ALTER TABLE "micro_challenges" ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 10;

-- AlterTable
ALTER TABLE "user_challenges" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "pointsEarned" INTEGER;
