/**
 * Script para crear o actualizar el Assistant de Clara en OpenAI
 * 
 * Ejecutar: npx tsx apps/backend/src/scripts/setup-assistant.ts
 */

import OpenAI from 'openai';
import { CLARA_INSTRUCTIONS } from '../config/assistant-instructions-optimized';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Crear cliente de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function setupAssistant() {
  try {
    console.log('🚀 Configurando Assistant de Clara...\n');

    const existingAssistantId = process.env.CLARA_ASSISTANT_ID;

    if (existingAssistantId) {
      console.log(`📝 Assistant ID existente encontrado: ${existingAssistantId}`);
      console.log('🔄 Actualizando instrucciones...\n');

      // Actualizar assistant existente
      const assistant = await openai.beta.assistants.update(existingAssistantId, {
        name: 'Clara - Especialista en Salud Digestiva',
        instructions: CLARA_INSTRUCTIONS,
        model: 'gpt-4o-mini',
        tools: [],
      });

      console.log('✅ Assistant actualizado exitosamente!');
      console.log(`   ID: ${assistant.id}`);
      console.log(`   Modelo: ${assistant.model}`);
      console.log(`   Instrucciones: ${CLARA_INSTRUCTIONS.length} caracteres\n`);

    } else {
      console.log('🆕 Creando nuevo Assistant...\n');

      // Crear nuevo assistant
      const assistant = await openai.beta.assistants.create({
        name: 'Clara - Especialista en Salud Digestiva',
        instructions: CLARA_INSTRUCTIONS,
        model: 'gpt-4o-mini',
        tools: [],
      });

      console.log('✅ Assistant creado exitosamente!');
      console.log(`   ID: ${assistant.id}`);
      console.log(`   Modelo: ${assistant.model}`);
      console.log(`   Instrucciones: ${CLARA_INSTRUCTIONS.length} caracteres\n`);
      console.log('⚠️  IMPORTANTE: Agrega esta variable a tu archivo .env:');
      console.log(`   CLARA_ASSISTANT_ID=${assistant.id}\n`);
    }

  } catch (error) {
    console.error('❌ Error configurando Assistant:', error);
    process.exit(1);
  }
}

setupAssistant();
