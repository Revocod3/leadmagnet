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
      return { isValid: false, reason: 'Image too large (max 10MB)' };
    }

    // Basic validation - could be enhanced with more sophisticated checks
    const base64Image = imageBuffer.toString('base64');

    try {
      const prompt = `Determine if this is a valid abdominal image for medical analysis. Check if:
- The image shows a human abdomen/stomach area
- The image is clear enough for analysis
- The image is appropriate for medical assessment

Respond with JSON: {"isValid": boolean, "reason": "explanation if invalid"}`;

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
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return { isValid: false, reason: 'Could not analyze image' };
      }

      const result = JSON.parse(content);
      return {
        isValid: result.isValid ?? false,
        reason: result.reason,
      };
    } catch {
      return { isValid: false, reason: 'Invalid image format' };
    }
  }
}