import { prisma } from '../config/database';
import { wordPressSyncService } from '../services/wordpress-sync.service';

/**
 * Script para probar el flujo completo de sincronización
 * 
 * Este script:
 * 1. Crea una sesión de prueba con wordpressLeadId
 * 2. Simula completar el diagnóstico
 * 3. Intenta sincronizar con WordPress
 */

async function testCompleteFlow() {
  try {
    console.log('🧪 ===== PRUEBA DE FLUJO COMPLETO =====\n');

    // 1. Crear sesión de prueba con wordpressLeadId
    console.log('1️⃣ Creando sesión de prueba con wordpressLeadId...');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const session = await prisma.session.create({
      data: {
        userName: 'Test User',
        userEmail: 'test@example.com',
        language: 'es',
        wordpressLeadId: 'wp_10', // Simular ID de WordPress (debe existir en WordPress)
        step: 'diagnosis_ready',
        completedDiagnosis: true,
        diagnosticType: 'chat',
        diagnosticMode: 'deep',
        questionsAsked: 15,
        engagementScore: 85.5,
        avgResponseLength: 120.5,
        timeSpent: 600000, // 10 minutos en ms
        completionTime: new Date(),
        expiresAt,
      },
    });

    console.log('✅ Sesión creada:', {
      id: session.id,
      wordpressLeadId: session.wordpressLeadId,
      completedDiagnosis: session.completedDiagnosis,
    });

    // 2. Crear algunos mensajes de prueba
    console.log('\n2️⃣ Creando mensajes de prueba...');

    await prisma.message.createMany({
      data: [
        {
          sessionId: session.id,
          role: 'user',
          content: 'Hola, quiero hacer el diagnóstico',
        },
        {
          sessionId: session.id,
          role: 'assistant',
          content: '¡Hola Test User! Comenzemos con tu diagnóstico personalizado.',
        },
        {
          sessionId: session.id,
          role: 'user',
          content: '30 años',
        },
      ],
    });

    console.log('✅ Mensajes creados');

    // 3. Crear un diagnóstico de prueba
    console.log('\n3️⃣ Creando diagnóstico de prueba...');

    await prisma.diagnosis.create({
      data: {
        sessionId: session.id,
        content: '# Diagnóstico Personalizado\n\nEste es un diagnóstico de prueba...',
        totalScore: 150,
        scorePercentage: 75.0,
        diagnosticMode: 'deep',
        questionsAsked: 15,
        engagementScore: 85.5,
      },
    });

    console.log('✅ Diagnóstico creado');

    // 4. Intentar sincronizar con WordPress
    console.log('\n4️⃣ Intentando sincronizar con WordPress...');
    console.log('URL configurada:', process.env.WORDPRESS_WEBHOOK_URL || 'NO CONFIGURADA');
    console.log('API Key configurada:', process.env.WORDPRESS_API_KEY ? 'SÍ' : 'NO');
    console.log('');

    await wordPressSyncService.syncDiagnosisCompletion(session.id);

    console.log('\n✅ PRUEBA COMPLETADA');
    console.log('\n📝 Notas:');
    console.log('- Si ves un error de conexión, es normal en local');
    console.log('- El wordpressLeadId debe existir en WordPress (ID: 10)');
    console.log('- Verifica los logs del servicio de WordPress arriba');
    console.log(`- Session ID para consultar: ${session.id}`);

  } catch (error) {
    console.error('\n❌ Error durante la prueba:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testCompleteFlow();
