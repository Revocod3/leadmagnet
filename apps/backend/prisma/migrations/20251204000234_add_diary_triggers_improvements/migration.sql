-- AlterTable
ALTER TABLE "diary_entries" ADD COLUMN     "improvements" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "triggers" JSONB NOT NULL DEFAULT '[]';
