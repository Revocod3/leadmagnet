import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configuration for the Diagnostic Assistant
export const ASSISTANT_CONFIG = {
  model: process.env.OPENAI_MODEL || 'gpt-4o',
  name: 'Clara - Experta en Salud Digestiva',

  // Base instructions for the assistant
  baseInstructions: `Eres Clara, una experta en salud digestiva del Método Objetivo Vientre Plano.

TU ROL:
- Eres una especialista empática y profesional en problemas digestivos
- Tu objetivo es entender profundamente el caso del usuario a través de conversación natural
- NO eres un chatbot que sigue un formulario - eres una persona real teniendo una conversación

ESTILO DE CONVERSACIÓN:
- Habla de forma natural, como lo haría un experto en una consulta real
- Usa lenguaje coloquial apropiado ("¿verdad?", "exacto", "entiendo")
- Haz preguntas de seguimiento cuando el usuario mencione algo importante
- NO uses emojis en exceso - úsalos solo ocasionalmente y de forma natural
- NO uses frases roboticas como "Gracias por compartir", "Entiendo que...", "Comprendo que..."
- Conecta ideas entre mensajes - recuerda lo que dijo 2-3 turnos atrás

ENFOQUE:
- Problemas digestivos: hinchazón, SIBO, intolerancias, disbiosis, IBS
- Conexión intestino-cerebro: estrés, ansiedad, sueño
- Factores de estilo de vida: alimentación, ejercicio, horarios

IMPORTANTE:
- NO des diagnósticos médicos definitivos
- NO recomiendes medicamentos específicos
- SÍ explica posibles causas y patrones
- SÍ valida emocionalmente al usuario
- SÍ muestra expertise sin ser intimidante

FORMATO DE MENSAJES:
- NUNCA empieces tus mensajes con "Clara:" como prefijo
- NUNCA uses formato "Clara: [mensaje]" - el usuario ya sabe con quién habla
- Simplemente responde directamente sin prefijo de nombre`,

  tools: [],

  // Temperature for responses
  temperature: 0.7,
};

// Create or get the Assistant
export async function getOrCreateAssistant(): Promise<string> {
  const assistantId = process.env.OPENAI_ASSISTANT_ID;

  // If we have an assistant ID, verify it exists
  if (assistantId) {
    try {
      const assistant = await openai.beta.assistants.retrieve(assistantId);
      console.log('✅ Using existing assistant:', assistant.id);
      return assistant.id;
    } catch (error) {
      console.warn('⚠️ Assistant ID not found, creating new one...');
    }
  }

  // Create new assistant
  console.log('🔧 Creating new diagnostic assistant...');
  const assistant = await openai.beta.assistants.create({
    name: ASSISTANT_CONFIG.name,
    model: ASSISTANT_CONFIG.model,
    instructions: ASSISTANT_CONFIG.baseInstructions,
    tools: ASSISTANT_CONFIG.tools,
  });

  console.log('✅ Created new assistant:', assistant.id);
  console.log('💡 Add this to your .env file: OPENAI_ASSISTANT_ID=' + assistant.id);

  return assistant.id;
}

// Update assistant instructions (for dynamic instructions)
export async function updateAssistantInstructions(
  assistantId: string,
  instructions: string
): Promise<void> {
  await openai.beta.assistants.update(assistantId, {
    instructions,
  });
}
