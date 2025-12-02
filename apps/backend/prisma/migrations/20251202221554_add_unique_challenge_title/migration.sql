/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `micro_challenges` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "micro_challenges_title_key" ON "micro_challenges"("title");
