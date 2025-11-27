import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar OpenAI (usa la misma API key del backend)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY
});

const languages = {
  'en': 'English (US)',
  'fr': 'French (France)',
  'de': 'German (Germany)',
  'it': 'Italian (Italy)',
  'pt': 'Portuguese (Brazil)'
};

async function translateJSON(sourceJSON, targetLang, langName) {
  console.log(`\n🔄 Traduciendo a ${langName}...`);

  const prompt = `You are a professional translator. Translate this JSON file from Spanish to ${langName}.

IMPORTANT RULES:
1. Keep the exact same JSON structure
2. Only translate the string values, NOT the keys
3. Use natural, professional language appropriate for a health/nutrition app
4. Maintain formatting like line breaks (\\n) if present
5. Keep HTML tags if present
6. For medical/health terms, use professional terminology
7. Return ONLY valid JSON, no additional text

Source JSON (Spanish):
${JSON.stringify(sourceJSON, null, 2)}

Return the translated JSON in ${langName}:`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Modelo económico
      messages: [
        {
          role: "system",
          content: "You are a professional translator specializing in health and nutrition content. Return only valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3, // Más determinista para traducciones
    });

    const content = response.choices[0].message.content;

    // Extraer JSON del response (por si viene con markdown)
    let jsonContent = content;
    if (content.includes('```json')) {
      jsonContent = content.split('```json')[1].split('```')[0].trim();
    } else if (content.includes('```')) {
      jsonContent = content.split('```')[1].split('```')[0].trim();
    }

    const translated = JSON.parse(jsonContent);
    console.log(`✅ ${langName} traducido exitosamente`);
    return translated;
  } catch (error) {
    console.error(`❌ Error traduciendo a ${langName}:`, error.message);
    throw error;
  }
}

async function generateAllTranslations() {
  console.log('🚀 Iniciando generación de traducciones automáticas...\n');

  // Leer archivo fuente en español
  const sourcePath = path.join(__dirname, '../public/locales/es/translation.json');
  const sourceJSON = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));

  console.log(`📖 Archivo fuente cargado: ${Object.keys(sourceJSON).length} secciones`);
  console.log(`💰 Costo estimado: $0.10 - $0.50 total\n`);

  let totalCost = 0;
  let successCount = 0;

  for (const [code, name] of Object.entries(languages)) {
    try {
      const translated = await translateJSON(sourceJSON, code, name);

      // Guardar archivo traducido
      const targetPath = path.join(__dirname, `../public/locales/${code}/translation.json`);
      fs.writeFileSync(targetPath, JSON.stringify(translated, null, 2), 'utf-8');

      console.log(`💾 Guardado en: public/locales/${code}/translation.json`);
      successCount++;

      // Pequeña pausa entre traducciones
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`\n⚠️  Falló la traducción a ${name}`);
      console.error(`Error: ${error.message}\n`);
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✨ Traducción completada!`);
  console.log(`📊 Idiomas generados: ${successCount}/${Object.keys(languages).length}`);
  console.log(`💵 Costo estimado total: < $0.50`);
  console.log(`${'='.repeat(50)}\n`);
}

// Ejecutar
generateAllTranslations().catch(console.error);
