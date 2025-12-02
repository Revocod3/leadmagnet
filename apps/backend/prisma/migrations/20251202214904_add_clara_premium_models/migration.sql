-- CreateTable
CREATE TABLE "user_global_contexts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "digestiveProfile" JSONB NOT NULL DEFAULT '{}',
    "emotionalProfile" JSONB NOT NULL DEFAULT '{}',
    "culturalProfile" JSONB NOT NULL DEFAULT '{}',
    "habitsProfile" JSONB NOT NULL DEFAULT '{}',
    "medicalHistory" JSONB NOT NULL DEFAULT '{}',
    "goals" JSONB NOT NULL DEFAULT '[]',
    "identifiedTriggers" JSONB NOT NULL DEFAULT '[]',
    "strengths" JSONB NOT NULL DEFAULT '[]',
    "currentPhase" TEXT NOT NULL DEFAULT 'onboarding',
    "weekNumber" INTEGER NOT NULL DEFAULT 0,
    "daysInProgram" INTEGER NOT NULL DEFAULT 0,
    "programStartDate" TIMESTAMP(3),
    "radiographyCompleted" BOOLEAN NOT NULL DEFAULT false,
    "radiographyContent" TEXT,
    "radiographyDate" TIMESTAMP(3),
    "personalityType" TEXT,
    "communicationStyle" JSONB NOT NULL DEFAULT '{}',
    "lastCheckInDate" TIMESTAMP(3),
    "lastDiaryEntryDate" TIMESTAMP(3),
    "consecutiveDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_global_contexts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diary_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mood" INTEGER,
    "bloating" INTEGER,
    "energy" INTEGER,
    "stress" INTEGER,
    "symptoms" JSONB NOT NULL DEFAULT '[]',
    "meals" JSONB NOT NULL DEFAULT '[]',
    "claraNotes" TEXT,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diary_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_check_ins" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "digestiveStatus" TEXT,
    "emotionalStatus" TEXT,
    "microActionCompleted" BOOLEAN NOT NULL DEFAULT false,
    "microActionNotes" TEXT,
    "celebrationGiven" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "micro_challenges" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL DEFAULT 1,
    "difficulty" TEXT NOT NULL DEFAULT 'easy',
    "targetPhase" TEXT,
    "instructions" TEXT NOT NULL,
    "followUpQuestion" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "micro_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_challenges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "feedback" TEXT,
    "rating" INTEGER,

    CONSTRAINT "user_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "preferredTime" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Madrid',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_global_contexts_userId_key" ON "user_global_contexts"("userId");

-- CreateIndex
CREATE INDEX "user_global_contexts_userId_idx" ON "user_global_contexts"("userId");

-- CreateIndex
CREATE INDEX "diary_entries_userId_idx" ON "diary_entries"("userId");

-- CreateIndex
CREATE INDEX "diary_entries_date_idx" ON "diary_entries"("date");

-- CreateIndex
CREATE UNIQUE INDEX "diary_entries_userId_date_key" ON "diary_entries"("userId", "date");

-- CreateIndex
CREATE INDEX "daily_check_ins_userId_idx" ON "daily_check_ins"("userId");

-- CreateIndex
CREATE INDEX "daily_check_ins_date_idx" ON "daily_check_ins"("date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_check_ins_userId_date_key" ON "daily_check_ins"("userId", "date");

-- CreateIndex
CREATE INDEX "user_challenges_userId_idx" ON "user_challenges"("userId");

-- CreateIndex
CREATE INDEX "user_challenges_challengeId_idx" ON "user_challenges"("challengeId");

-- CreateIndex
CREATE INDEX "user_challenges_status_idx" ON "user_challenges"("status");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "push_subscriptions_userId_idx" ON "push_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "reminders_userId_idx" ON "reminders"("userId");

-- CreateIndex
CREATE INDEX "reminders_enabled_idx" ON "reminders"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "reminders_userId_type_key" ON "reminders"("userId", "type");

-- AddForeignKey
ALTER TABLE "user_global_contexts" ADD CONSTRAINT "user_global_contexts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diary_entries" ADD CONSTRAINT "diary_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_check_ins" ADD CONSTRAINT "daily_check_ins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_challenges" ADD CONSTRAINT "user_challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_challenges" ADD CONSTRAINT "user_challenges_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "micro_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
