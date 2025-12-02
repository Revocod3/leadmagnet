/**
 * Challenge Service - Clara Premium
 * 
 * Manages micro-challenges for users. Challenges are assigned every 3-5 days
 * based on user's symptoms and progress.
 */

import { prisma } from '../config/database';

// Types
export interface ChallengeData {
  title: string;
  description: string;
  instructions: string;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  durationDays: number;
  points: number;
}

/**
 * Get current active challenge for user
 */
export async function getCurrentChallenge(userId: string) {
  return prisma.userChallenge.findFirst({
    where: {
      userId,
      status: 'IN_PROGRESS'
    },
    include: {
      challenge: true
    }
  });
}

/**
 * Get all challenges for a user
 */
export async function getUserChallenges(userId: string) {
  return prisma.userChallenge.findMany({
    where: { userId },
    include: {
      challenge: true
    },
    orderBy: { startedAt: 'desc' }
  });
}

/**
 * Get challenge stats for a user
 */
export async function getChallengeStats(userId: string) {
  const challenges = await prisma.userChallenge.findMany({
    where: { userId }
  });

  const completed = challenges.filter(c => c.status === 'COMPLETED').length;
  const totalPoints = challenges
    .filter(c => c.status === 'COMPLETED')
    .reduce((sum, c) => sum + (c.pointsEarned || 0), 0);
  const streak = await calculateStreak(userId);

  return {
    total: challenges.length,
    completed,
    skipped: challenges.filter(c => c.status === 'SKIPPED').length,
    inProgress: challenges.filter(c => c.status === 'IN_PROGRESS').length,
    totalPoints,
    streak,
    completionRate: challenges.length > 0 ? Math.round((completed / challenges.length) * 100) : 0
  };
}

/**
 * Calculate current streak of completed challenges
 */
async function calculateStreak(userId: string): Promise<number> {
  const recentChallenges = await prisma.userChallenge.findMany({
    where: {
      userId,
      status: { in: ['COMPLETED', 'SKIPPED'] }
    },
    orderBy: { completedAt: 'desc' },
    take: 20
  });

  let streak = 0;
  for (const challenge of recentChallenges) {
    if (challenge.status === 'COMPLETED') {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Complete a challenge
 */
export async function completeChallenge(
  userId: string,
  challengeId: string,
  notes?: string
): Promise<{ success: boolean; pointsEarned: number; message: string }> {
  const userChallenge = await prisma.userChallenge.findFirst({
    where: {
      userId,
      challengeId,
      status: 'IN_PROGRESS'
    },
    include: {
      challenge: true
    }
  });

  if (!userChallenge) {
    return {
      success: false,
      pointsEarned: 0,
      message: 'No tienes este reto activo'
    };
  }

  // Calculate bonus points for completing early
  const startedAt = userChallenge.startedAt;
  if (!startedAt) {
    return {
      success: false,
      pointsEarned: 0,
      message: 'El reto no se ha iniciado correctamente'
    };
  }

  const daysActive = Math.ceil(
    (Date.now() - startedAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  const expectedDays = userChallenge.challenge.durationDays;
  const basePoints = userChallenge.challenge.points;

  let bonusMultiplier = 1;
  if (daysActive <= expectedDays) {
    bonusMultiplier = 1.2; // 20% bonus for on-time completion
  }
  if (daysActive === 1) {
    bonusMultiplier = 1.5; // 50% bonus for same-day completion
  }

  const pointsEarned = Math.round(basePoints * bonusMultiplier);

  await prisma.userChallenge.update({
    where: { id: userChallenge.id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      ...(notes && { notes }),
      pointsEarned
    }
  });

  // Update global context with achievement
  await prisma.userGlobalContext.update({
    where: { userId },
    data: {
      updatedAt: new Date()
    }
  });

  return {
    success: true,
    pointsEarned,
    message: pointsEarned > basePoints
      ? `¡Excelente! Has ganado ${pointsEarned} puntos (+bonus por rapidez) 🎉`
      : `¡Bien hecho! Has ganado ${pointsEarned} puntos 🌟`
  };
}

/**
 * Skip a challenge
 */
export async function skipChallenge(
  userId: string,
  challengeId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  const userChallenge = await prisma.userChallenge.findFirst({
    where: {
      userId,
      challengeId,
      status: 'IN_PROGRESS'
    }
  });

  if (!userChallenge) {
    return {
      success: false,
      message: 'No tienes este reto activo'
    };
  }

  await prisma.userChallenge.update({
    where: { id: userChallenge.id },
    data: {
      status: 'SKIPPED',
      completedAt: new Date(),
      ...(reason && { notes: reason })
    }
  });

  return {
    success: true,
    message: 'Reto saltado. ¡No pasa nada, el próximo será mejor! 💪'
  };
}

/**
 * Assign a specific challenge to user
 */
export async function assignChallenge(
  userId: string,
  challengeId: string
): Promise<{ success: boolean; message: string }> {
  // Check if user already has an active challenge
  const active = await getCurrentChallenge(userId);
  if (active) {
    return {
      success: false,
      message: 'Ya tienes un reto activo. Complétalo o sáltalo primero.'
    };
  }

  // Check if challenge exists
  const challenge = await prisma.microChallenge.findUnique({
    where: { id: challengeId }
  });

  if (!challenge) {
    return {
      success: false,
      message: 'Reto no encontrado'
    };
  }

  await prisma.userChallenge.create({
    data: {
      userId,
      challengeId,
      status: 'IN_PROGRESS',
      startedAt: new Date()
    }
  });

  return {
    success: true,
    message: `¡Nuevo reto asignado: ${challenge.title}!`
  };
}

/**
 * Get all available challenges
 */
export async function getAllChallenges() {
  return prisma.microChallenge.findMany({
    where: { isActive: true },
    orderBy: { category: 'asc' }
  });
}

/**
 * Get challenges by category
 */
export async function getChallengesByCategory(category: string) {
  return prisma.microChallenge.findMany({
    where: {
      category,
      isActive: true
    }
  });
}

/**
 * Get next recommended challenge for user
 * Based on symptoms, history, and variety
 */
export async function getRecommendedChallenge(userId: string) {
  // Get user context
  const context = await prisma.userGlobalContext.findUnique({
    where: { userId }
  });

  // Get completed challenges
  const completedIds = (await prisma.userChallenge.findMany({
    where: { userId },
    select: { challengeId: true }
  })).map(c => c.challengeId);

  // Determine relevant categories based on digestive profile
  const relevantCategories: string[] = [];
  const digestiveProfile = context?.digestiveProfile as Record<string, unknown> | null;
  if (digestiveProfile?.symptoms) {
    const symptoms = String(digestiveProfile.symptoms).toLowerCase();
    if (symptoms.includes('estrés') || symptoms.includes('ansiedad')) {
      relevantCategories.push('MINDFULNESS', 'BREATHING');
    }
    if (symptoms.includes('hinchazón') || symptoms.includes('gases')) {
      relevantCategories.push('MOVEMENT', 'EATING');
    }
    if (symptoms.includes('estreñimiento')) {
      relevantCategories.push('HYDRATION', 'MOVEMENT');
    }
  }

  // Default categories
  if (relevantCategories.length === 0) {
    relevantCategories.push('MINDFULNESS', 'HYDRATION', 'MOVEMENT', 'BREATHING');
  }

  // Find challenge not yet done
  const challenge = await prisma.microChallenge.findFirst({
    where: {
      isActive: true,
      id: { notIn: completedIds },
      category: { in: relevantCategories }
    },
    orderBy: { difficulty: 'asc' }
  });

  // Fallback to any available challenge
  if (!challenge) {
    return prisma.microChallenge.findFirst({
      where: {
        isActive: true,
        id: { notIn: completedIds }
      }
    });
  }

  return challenge;
}

// Export service
export const challengeService = {
  getCurrentChallenge,
  getUserChallenges,
  getChallengeStats,
  completeChallenge,
  skipChallenge,
  assignChallenge,
  getAllChallenges,
  getChallengesByCategory,
  getRecommendedChallenge
};

export default challengeService;
