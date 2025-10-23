/**
 * Script de debug para probar el flujo de diagnóstico
 * Simula todas las respuestas hasta la generación del diagnóstico
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { DiagnosticFlowService, type DiagnosticFlowState } from '../services/openai/diagnostic-flow.service';

async function testDiagnosticFlow() {
  const flowService = new DiagnosticFlowService();

  console.log('🧪 INICIANDO TEST DEL FLUJO DE DIAGNÓSTICO\n');
  console.log('='.repeat(60));

  // 1. Inicializar flujo
  console.log('\n📋 PASO 1: Inicializar flujo');
  const { message: welcomeMessage, state: initialState } = flowService.initializeFlow('es', 'Kevin');
  console.log('✅ Welcome message:', welcomeMessage.substring(0, 100) + '...');
  console.log('✅ Estado inicial:', {
    step: initialState.step,
    currentQuestionIndex: initialState.currentQuestionIndex,
    currentBlockId: initialState.currentBlockId,
  });

  // 2. Respuesta inicial (empezar)
  console.log('\n📋 PASO 2: Usuario dice "sí" para empezar');
  const step2 = await flowService.processMessage('sí', initialState);
  console.log('✅ Pregunta recibida:', step2.message.substring(0, 80) + '...');
  console.log('✅ Estado:', {
    step: step2.newState.step,
    questionIndex: step2.newState.currentQuestionIndex,
    blockId: step2.newState.currentBlockId,
  });

  // 3. Pregunta 1: Edad y ocupación
  console.log('\n📋 PASO 3: Responder edad y ocupación');
  const step3 = await flowService.processMessage('Tengo 30 años y soy programador', step2.newState);
  console.log('✅ Respuesta (con comentario de ocupación):', step3.message.substring(0, 150) + '...');
  console.log('✅ Collected Info:', step3.newState.collectedInfo);
  console.log('✅ Estado:', {
    step: step3.newState.step,
    questionIndex: step3.newState.currentQuestionIndex,
    blockId: step3.newState.currentBlockId,
  });

  // 4. Pregunta 2: Problema principal
  console.log('\n📋 PASO 4: Responder problema principal');
  const step4 = await flowService.processMessage('Me siento muy hinchado después de comer, especialmente con pan y pasta', step3.newState);
  console.log('✅ Respuesta:', step4.message.substring(0, 100) + '...');
  console.log('✅ Collected Info:', step4.newState.collectedInfo);

  // 5. Pregunta 3: Duración
  console.log('\n📋 PASO 5: Responder duración');
  const step5 = await flowService.processMessage('Como 2 años', step4.newState);
  console.log('✅ Respuesta:', step5.message.substring(0, 100) + '...');

  // 6. Pregunta 4: Alimentación
  console.log('\n📋 PASO 6: Responder alimentación');
  const step6 = await flowService.processMessage('Como saludable pero a veces salto comidas por el trabajo', step5.newState);
  console.log('✅ Respuesta:', step6.message.substring(0, 100) + '...');

  // 7. Pregunta 5: Alimentos que caen mal (debería omitirse porque ya mencionó pan/pasta)
  console.log('\n📋 PASO 7: Verificar si omite pregunta 5 (alimentos malos)');
  console.log('✅ BadFoods ya detectados:', step6.newState.collectedInfo.badFoods);
  console.log('✅ Siguiente pregunta index:', step6.newState.currentQuestionIndex);

  // 8. Pregunta 6: Agua
  console.log('\n📋 PASO 8: Responder agua');
  const step7 = await flowService.processMessage('Como 1 litro al día', step6.newState);
  console.log('✅ Respuesta:', step7.message.substring(0, 100) + '...');

  // 9. Pregunta 7: Ejercicio
  console.log('\n📋 PASO 9: Responder ejercicio');
  const step8 = await flowService.processMessage('Casi nada, soy muy sedentario', step7.newState);
  console.log('✅ Respuesta:', step8.message.substring(0, 100) + '...');

  // 10. Pregunta 8: Sueño
  console.log('\n📋 PASO 10: Responder sueño');
  const step9 = await flowService.processMessage('Duermo mal, me cuesta conciliar el sueño', step8.newState);
  console.log('✅ Respuesta:', step9.message.substring(0, 100) + '...');

  // 11. Pregunta 9: Estrés
  console.log('\n📋 PASO 11: Responder estrés');
  const step10 = await flowService.processMessage('Sí, cuando tengo deadline siento el estómago revuelto', step9.newState);
  console.log('✅ Respuesta:', step10.message.substring(0, 100) + '...');

  // 12. Pregunta 10: Condiciones médicas
  console.log('\n📋 PASO 12: Responder condiciones médicas');
  const step11 = await flowService.processMessage('No, nada diagnosticado', step10.newState);
  console.log('✅ Respuesta:', step11.message.substring(0, 100) + '...');

  // 13. Pregunta 11: Objetivo
  console.log('\n📋 PASO 13: Responder objetivo');
  const step12 = await flowService.processMessage('Quiero dejar de sentirme hinchado y tener más energía', step11.newState);
  console.log('✅ Respuesta:', step12.message.substring(0, 100) + '...');

  // 14. Pregunta 12: Motivación
  console.log('\n📋 PASO 14: Responder motivación');
  const step13 = await flowService.processMessage('8', step12.newState);
  console.log('✅ Respuesta:', step13.message.substring(0, 100) + '...');
  console.log('✅ Estado:', {
    step: step13.newState.step,
    questionIndex: step13.newState.currentQuestionIndex,
  });

  // 15. Pregunta 13: Foto (última pregunta) - AQUÍ DEBERÍA GENERAR EL DIAGNÓSTICO
  console.log('\n📋 PASO 15: Responder foto (NO)');
  console.log('⚠️  CRÍTICO: Esta respuesta debería generar el diagnóstico');
  const step14 = await flowService.processMessage('no', step13.newState);

  console.log('\n🔍 ANÁLISIS DEL RESULTADO:');
  console.log('='.repeat(60));
  console.log('Estado final:', step14.newState.step);
  console.log('Tipo de respuesta:', step14.type);
  console.log('Tiene diagnóstico?', !!step14.newState.diagnosisContent);

  if (step14.newState.diagnosisContent) {
    console.log('\n✅ DIAGNÓSTICO GENERADO:');
    console.log('='.repeat(60));
    console.log(step14.newState.diagnosisContent);
    console.log('='.repeat(60));
  } else {
    console.log('\n❌ ERROR: NO SE GENERÓ EL DIAGNÓSTICO');
    console.log('Mensaje recibido:', step14.message.substring(0, 200) + '...');
  }

  console.log('\n📊 INFORMACIÓN RECOPILADA:');
  console.log(JSON.stringify(step14.newState.collectedInfo, null, 2));

  // 16. Probar respuesta PDF
  if (step14.newState.step === 'completed') {
    console.log('\n📋 PASO 16: Responder a pregunta del PDF');
    const step15 = await flowService.processMessage('no', step14.newState);
    console.log('✅ CTA recibido:', step15.message.substring(0, 200) + '...');
    console.log('✅ Estado final:', step15.newState.step);
  }

  console.log('\n✅ TEST COMPLETADO');
}

// Ejecutar test
testDiagnosticFlow().catch((error) => {
  console.error('\n❌ ERROR EN EL TEST:');
  console.error(error);
  process.exit(1);
});
