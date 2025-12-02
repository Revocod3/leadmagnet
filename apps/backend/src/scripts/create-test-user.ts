import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';

async function createTestUser() {
  try {
    const hashedPassword = await bcrypt.hash('test123456', 10);

    // Crear usuario de prueba
    const user = await prisma.user.upsert({
      where: { email: 'test@pro.com' },
      update: { password: hashedPassword },
      create: {
        email: 'test@pro.com',
        name: 'Usuario Pro Test',
        password: hashedPassword,
        provider: 'local',
        emailVerified: true,
        role: 'user',
      }
    });

    console.log('✅ Usuario creado:');
    console.log('   Email: test@pro.com');
    console.log('   Password: test123456');
    console.log('   User ID:', user.id);

    // Buscar suscripción existente
    const existingSub = await prisma.subscription.findFirst({
      where: { userId: user.id }
    });

    let subscription;
    const stripeSubId = 'sub_test_' + Date.now();

    if (existingSub) {
      subscription = await prisma.subscription.update({
        where: { id: existingSub.id },
        data: {
          status: 'active',
          plan: 'pro',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }
      });
    } else {
      subscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          stripeSubscriptionId: stripeSubId,
          stripeCustomerId: 'cus_test_' + Date.now(),
          stripePriceId: 'price_test',
          status: 'active',
          plan: 'pro',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }
      });
    }

    console.log('   Subscription:', subscription.status, subscription.plan);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
