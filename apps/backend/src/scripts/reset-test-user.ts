import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';

async function resetTestUser() {
  try {
    const email = 'test@pro.com';
    console.log(`🔄 Resetting user ${email}...`);

    // 1. Find user
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    let userIdToUse: string | undefined;

    if (existingUser) {
      console.log(`Found user ${existingUser.id}. Cleaning up data...`);
      userIdToUse = existingUser.id;

      // 2. Delete sessions (cascades to messages, diagnoses, etc.)
      // Note: We need to delete sessions where userId is the user's ID.
      // Also, there might be sessions with this email but no userId if they started as guests?
      // But for a registered user, we care about sessions linked to them.
      const deletedSessions = await prisma.session.deleteMany({
        where: { userId: existingUser.id },
      });
      console.log(`Deleted ${deletedSessions.count} sessions.`);

      // 3. Delete the user (cascades to subscription, pro conversations, global context, etc.)
      await prisma.user.delete({
        where: { id: existingUser.id },
      });
      console.log('User deleted.');
    } else {
      console.log('User not found. Creating fresh...');
    }

    // 4. Recreate user
    const hashedPassword = await bcrypt.hash('test123456', 10);

    const userData: any = {
      email: 'test@pro.com',
      name: 'Usuario Pro Test',
      password: hashedPassword,
      provider: 'local',
      emailVerified: true,
      role: 'PRO', // Setting to PRO directly as per previous script logic (though previous script set 'user' then updated subscription)
      // Previous script set role: 'user' but plan: 'pro' in subscription.
      // Let's stick to the previous script's logic for consistency, but maybe 'PRO' role is better?
      // Schema says role default is "FREE".
      // Let's check create-test-user.ts again. It set role: 'user'.
      // But schema says role is "FREE" or "PRO". 'user' might be invalid if it's an enum?
      // Schema: role String @default("FREE") // "FREE" | "PRO"
      // create-test-user.ts used 'user'. This might be a string field, not an enum in DB, but logically it should be FREE/PRO.
      // I will use 'PRO' to be safe and consistent with the intent.
    };

    // Preserve the ID if it existed
    if (userIdToUse) {
      userData.id = userIdToUse;
    }

    const newUser = await prisma.user.create({
      data: userData
    });

    console.log('✅ User created:');
    console.log('   Email:', newUser.email);
    console.log('   ID:', newUser.id);

    // 5. Create subscription
    const stripeSubId = 'sub_test_' + Date.now();
    const subscription = await prisma.subscription.create({
      data: {
        userId: newUser.id,
        stripeSubscriptionId: stripeSubId,
        stripeCustomerId: 'cus_test_' + Date.now(),
        stripePriceId: 'price_test',
        status: 'active',
        plan: 'pro',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }
    });

    console.log('   Subscription created:', subscription.status, subscription.plan);

  } catch (error) {
    console.error('Error resetting user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetTestUser();
