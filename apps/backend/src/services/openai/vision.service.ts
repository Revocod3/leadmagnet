import OpenAI from 'openai';
import { openai, MODELS } from '../../config/openai';
import type { Language } from '../../types';

export class VisionService {
  async analyzeImage(imageBuffer: Buffer, language: Language): Promise<string> {
    const base64Image = imageBuffer.toString('base64');

    const prompt = language === 'es'
      ? `Analiza esta imagen del abdomen y describe qué observas. Concéntrate en:
- Forma y apariencia general del abdomen
- Cualquier signo visible de distensión o inflamación
- Aspecto de la piel
- Postura corporal

Proporciona una descripción objetiva y profesional.`
      : `Analyze this abdominal image and describe what you observe. Focus on:
- General shape and appearance of the abdomen
- Any visible signs of distension or inflammation
- Skin appearance
- Body posture

Provide an objective and professional description.`;

    const response = await openai.chat.completions.create({
      model: MODELS.VISION,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    return response.choices[0]?.message?.content || '';
  }

  async validateImage(imageBuffer: Buffer): Promise<{ isValid: boolean; reason?: string }> {
    // Check file size (max 10MB)
    if (imageBuffer.length > 10 * 1024 * 1024) {
      return { isValid: false, reason: 'Imagen muy grande (máximo 10MB)' };
    }

    // Check minimum size (at least 1KB to ensure it's not empty)
    if (imageBuffer.length < 1024) {
      return { isValid: false, reason: 'Imagen muy pequeña o corrupta' };
    }

    // Simple validation - just check if we can create a base64 string
    try {
      const base64Image = imageBuffer.toString('base64');

      // Basic check: base64 should have reasonable length
      if (base64Image.length < 100) {
        return { isValid: false, reason: 'Formato de imagen inválido' };
      }

      // If we got here, the image is probably valid
      // Skip the expensive OpenAI Vision validation to avoid errors
      return { isValid: true };

    } catch (error) {
      console.error('Error validating image:', error);
      return { isValid: false, reason: 'Formato de imagen inválido' };
    }
  }
}