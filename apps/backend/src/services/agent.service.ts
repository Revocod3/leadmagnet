/**
 * Multi-Agent Service - OpenAI Agents SDK
 *
 * Sistema de agentes especializados con handoffs:
 * - Clara (Conversation Agent) - Principal
 * - Style Analyzer Agent - Analiza estilo de comunicación
 * - Diagnosis Agent - Genera diagnóstico personalizado
 */

import { Agent, tool, run, handoff } from '@openai/agents';
import { z } from 'zod';
import { prisma } from '../config/database';
import { CLARA_INSTRUCTIONS_V2 as CLARA_INSTRUCTIONS, DIAGNOSIS_INSTRUCTIONS, buildDynamicInstructionsV2 as buildDynamicInstructions } from '../config/assistant-instructions-v2';
import { PATTERN_ANALYZER_INSTRUCTIONS } from '../config/pattern-detection-instructions';
import { logger } from '../utils/logger';
import { convertDiagnosisToHTML } from '../utils/markdown-to-html';

export class AgentService {
  private claraAgent: Agent;
  private styleAnalyzerAgent: Agent;
  private patternAnalyzerAgent: Agent;
  private diagnosisAgent: Agent;

  constructor() {
    // Tools compartidos
    const tools = this.createTools();

    // Agent 1: Style Analyzer - Analiza estilo de comunicación
    this.styleAnalyzerAgent = new Agent({
      name: 'StyleAnalyzer',
      instructions: `
Eres un analista experto en comunicación. Tu trabajo es analizar cómo escribe el usuario y detectar su estilo.

ANALIZA:
1. **Formalidad** (1-10):
   - Usa "usted", "señor/a", lenguaje formal → 8-10
   - Usa emojis, tuteo, lenguaje casual → 1-3
   - Neutral → 4-7

2. **Verbosidad** (1-10):
   - Respuestas de 1-3 palabras → 1-3
   - Respuestas de 4-10 palabras → 4-7
   - Respuestas de 11+ palabras → 8-10

3. **Nivel Emocional** (1-10):
   - Palabras emocionales (frustrado, cansado, desesperado, feliz) → 7-10
   - Signos de exclamación → +1-2
   - Emojis emocionales → +1-2
   - Neutral, racional → 1-5

IMPORTANTE:
- Solo analiza, NO respondas al usuario
- Usa el tool save_style_analysis para guardar tu análisis
- Devuelve un mensaje breve confirmando el análisis

FORMATO DE RESPUESTA:
"Análisis completado. Estilo detectado: [breve descripción]"
`,
      tools: [tools.saveStyleAnalysis],
    });

    // Agent 2: Pattern Analyzer - Detecta patrón de usuario
    this.patternAnalyzerAgent = new Agent({
      name: 'PatternAnalyzer',
      instructions: PATTERN_ANALYZER_INSTRUCTIONS,
      tools: [tools.saveUserPattern],
    });

    // Agent 3: Diagnosis Agent - Genera diagnóstico personalizado
    this.diagnosisAgent = new Agent({
      name: 'DiagnosisGenerator',
      instructions: `${CLARA_INSTRUCTIONS}\n\n${DIAGNOSIS_INSTRUCTIONS}

IMPORTANTE:
- Genera un diagnóstico COMPLETO y PERSONALIZADO basado en toda la conversación
- Usa el template exacto del DIAGNOSIS_INSTRUCTIONS
- Menciona síntomas específicos que el usuario compartió
- Usa el tool save_diagnosis para guardar el diagnóstico generado
`,
      tools: [tools.saveDiagnosis, tools.saveDiagnosisMetadata],
    });

    // Agent 4: Clara (Conversation Agent) - Principal
    this.claraAgent = new Agent({
      name: 'Clara',
      instructions: CLARA_INSTRUCTIONS,
      model: 'gpt-5-mini-2025-08-07',
      tools: [
        tools.saveConversation,
        tools.trackEngagement,
        tools.trackEmotion,
        tools.trackKeyMoment,
        tools.track24x7Pitch,
      ],
      handoffs: [
        this.styleAnalyzerAgent,
        this.patternAnalyzerAgent,
        this.diagnosisAgent,
      ],
    });
  }

  /**
   * Crea los tools compartidos entre agentes
   */
  private createTools() {
    // Tool: Guardar conversación
    const saveConversation = tool({
      name: 'save_conversation',
      description: 'Guarda un mensaje de la conversación en la base de datos',
      parameters: z.object({
        sessionId: z.string(),
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      }),
      async execute({ sessionId, role, content }) {
        try {
          await prisma.message.create({
            data: {
              sessionId,
              role,
              content,
              metadata: {},
            },
          });
          logger.info(`Message saved: ${role} in session ${sessionId}`);
          return { success: true };
        } catch (error) {
          logger.error('Error saving message:', { error });
          return { success: false, error: String(error) };
        }
      },
    });

    // Tool: Track engagement
    const trackEngagement = tool({
      name: 'track_engagement',
      description: 'Rastrea el engagement del usuario',
      parameters: z.object({
        sessionId: z.string(),
        event: z.string(),
      }),
      async execute({ sessionId, event }) {
        try {
          await prisma.session.update({
            where: { id: sessionId },
            data: {
              engagementSignals: {
                lastEvent: event,
                timestamp: new Date(),
              },
            },
          });
          logger.info(`[ENGAGEMENT] ${event} - Session: ${sessionId}`);
          return { success: true };
        } catch (error) {
          logger.error('Error tracking engagement:', { error });
          return { success: false, error: String(error) };
        }
      },
    });

    // Tool: Guardar análisis de estilo (usado por Style Analyzer Agent)
    const saveStyleAnalysis = tool({
      name: 'save_style_analysis',
      description: 'Guarda el análisis de estilo del usuario en ConversationalMemory',
      parameters: z.object({
        sessionId: z.string(),
        formality: z.number().min(1).max(10),
        verbosity: z.number().min(1).max(10),
        emotionLevel: z.number().min(1).max(10),
        justification: z.string().optional().nullable(),
      }),
      async execute({ sessionId, formality, verbosity, emotionLevel, justification }) {
        try {
          // Obtener o crear ConversationalMemory
          let memory = await prisma.conversationalMemory.findUnique({
            where: { sessionId },
          });

          if (!memory) {
            memory = await prisma.conversationalMemory.create({
              data: {
                sessionId,
                userStyle: { formality, verbosity, emotionLevel },
                turnCount: 0,
              },
            });
          } else {
            await prisma.conversationalMemory.update({
              where: { sessionId },
              data: {
                userStyle: { formality, verbosity, emotionLevel },
              },
            });
          }

          logger.info(`[STYLE ANALYSIS] Session ${sessionId}: F=${formality}, V=${verbosity}, E=${emotionLevel}`);
          if (justification) {
            logger.info(`[STYLE ANALYSIS] Justification: ${justification}`);
          }

          return {
            success: true,
            message: 'Style analysis saved successfully',
            style: { formality, verbosity, emotionLevel },
          };
        } catch (error) {
          logger.error('Error saving style analysis:', { error });
          return { success: false, error: String(error) };
        }
      },
    });

    // Tool: Guardar diagnóstico (usado por Diagnosis Agent)
    const saveDiagnosis = tool({
      name: 'save_diagnosis',
      description: 'Guarda el diagnóstico generado en la base de datos',
      parameters: z.object({
        sessionId: z.string(),
        content: z.string(),
        userName: z.string(),
      }),
      async execute({ sessionId, content, userName }) {
        try {
          // Convertir a HTML
          const diagnosisHTML = convertDiagnosisToHTML(content);

          // Buscar sesión
          const session = await prisma.session.findUnique({
            where: { id: sessionId },
            include: { diagnosis: true },
          });

          if (!session) {
            return { success: false, error: 'Session not found' };
          }

          // Guardar diagnóstico
          if (!session.diagnosis) {
            await prisma.diagnosis.create({
              data: {
                sessionId,
                userId: session.userId || null,
                content: diagnosisHTML,
                questionsAsked: session.currentQuestionIndex,
              },
            });
          }

          logger.info(`[DIAGNOSIS] Saved for session ${sessionId}, user: ${userName}`);

          return {
            success: true,
            message: 'Diagnosis saved successfully',
          };
        } catch (error) {
          logger.error('Error saving diagnosis:', { error });
          return { success: false, error: String(error) };
        }
      },
    });

    // Tool: Track emotional marker
    const trackEmotion = tool({
      name: 'track_emotion',
      description: 'Tracks an emotional moment in the conversation',
      parameters: z.object({
        sessionId: z.string(),
        turn: z.number(),
        emotion: z.string(),
        intensity: z.number(),
        trigger: z.string(),
        quote: z.string(),
      }),
      async execute({ sessionId, turn, emotion, intensity, trigger, quote }) {
        try {
          const memory = await prisma.conversationalMemory.findUnique({
            where: { sessionId },
          });

          if (!memory) {
            logger.warn(`Memory not found for session ${sessionId}`);
            return { success: false, error: 'Memory not found' };
          }

          const currentMarkers = (memory.emotionalMarkers || []) as any[];
          await prisma.conversationalMemory.update({
            where: { sessionId },
            data: {
              emotionalMarkers: [...currentMarkers, { turn, emotion, intensity, trigger, quote }],
            },
          });

          logger.info(`[EMOTION] ${emotion} (${intensity}/10) - Session: ${sessionId}`);
          return { success: true };
        } catch (error) {
          logger.error('Error tracking emotion:', { error });
          return { success: false, error: String(error) };
        }
      },
    });

    // Tool: Guardar patrón de usuario (usado por Pattern Analyzer Agent)
    const saveUserPattern = tool({
      name: 'save_user_pattern',
      description: 'Guarda el patrón de usuario detectado en ConversationalMemory',
      parameters: z.object({
        sessionId: z.string(),
        pattern: z.enum([
          'MOTIVACION_ALTA',
          'MOTIVACION_MEDIA',
          'MOTIVACION_BAJA',
          'DOLOR_FUERTE',
          'PERFIL_EMOCIONAL',
          'PERFIL_ESTETICO',
        ]),
        confidence: z.number().min(0).max(100),
        indicators: z.array(z.string()),
        recommendedQuestionCount: z.number().min(3).max(10),
      }),
      async execute({ sessionId, pattern, confidence, indicators, recommendedQuestionCount }) {
        try {
          // Obtener o crear ConversationalMemory
          let memory = await prisma.conversationalMemory.findUnique({
            where: { sessionId },
          });

          if (!memory) {
            memory = await prisma.conversationalMemory.create({
              data: {
                sessionId,
                factualInfo: {
                  userPattern: pattern,
                  patternConfidence: confidence,
                  patternIndicators: indicators,
                  recommendedQuestionCount,
                },
                turnCount: 0,
              },
            });
          } else {
            const currentFactualInfo = (memory.factualInfo || {}) as any;
            await prisma.conversationalMemory.update({
              where: { sessionId },
              data: {
                factualInfo: {
                  ...currentFactualInfo,
                  userPattern: pattern,
                  patternConfidence: confidence,
                  patternIndicators: indicators,
                  recommendedQuestionCount,
                },
              },
            });
          }

          logger.info(
            `[PATTERN] Session ${sessionId}: ${pattern} (${confidence}% confianza, ${recommendedQuestionCount} preguntas)`
          );
          logger.info(`[PATTERN] Indicadores: ${indicators.join(', ')}`);

          return {
            success: true,
            message: 'Pattern saved successfully',
            pattern: { pattern, confidence, recommendedQuestionCount },
          };
        } catch (error) {
          logger.error('Error saving user pattern:', { error });
          return { success: false, error: String(error) };
        }
      },
    });

    // Tool: Guardar metadata de diagnóstico (usado por Diagnosis Agent)
    const saveDiagnosisMetadata = tool({
      name: 'save_diagnosis_metadata',
      description: 'Guarda metadata del tipo de diagnóstico generado',
      parameters: z.object({
        sessionId: z.string(),
        diagnosisType: z.enum([
          'DIGESTIVO_INFLAMATORIO',
          'EMOCIONAL_DIGESTIVO',
          'MIXTO',
          'ESTETICO_BASE_DIGESTIVA',
        ]),
        confidence: z.number().min(0).max(100),
        keyFindings: z.array(z.string()),
        primaryRecommendations: z.array(z.string()),
      }),
      async execute({ sessionId, diagnosisType, confidence, keyFindings, primaryRecommendations }) {
        try {
          const memory = await prisma.conversationalMemory.findUnique({
            where: { sessionId },
          });

          if (!memory) {
            logger.warn(`Memory not found for session ${sessionId}`);
            return { success: false, error: 'Memory not found' };
          }

          const currentHypothesis = (memory.currentHypothesis || {}) as any;
          await prisma.conversationalMemory.update({
            where: { sessionId },
            data: {
              currentHypothesis: {
                ...currentHypothesis,
                diagnosisType,
                diagnosisConfidence: confidence,
                keyFindings,
                primaryRecommendations,
              },
            },
          });

          logger.info(`[DIAGNOSIS TYPE] ${diagnosisType} (${confidence}% confianza) - Session: ${sessionId}`);
          logger.info(`[DIAGNOSIS] Key findings: ${keyFindings.join(', ')}`);

          return { success: true };
        } catch (error) {
          logger.error('Error saving diagnosis metadata:', { error });
          return { success: false, error: String(error) };
        }
      },
    });

    // Tool: Track 24/7 pitch
    const track24x7Pitch = tool({
      name: 'track_24x7_pitch',
      description: 'Rastrea cuándo se muestra el pitch del Chat 24/7 PRO y la respuesta del usuario',
      parameters: z.object({
        sessionId: z.string(),
        pitchShown: z.boolean(),
        userResponse: z.enum(['interested', 'declined', 'thinking', 'no_response']),
        objection: z.string().optional(),
      }),
      async execute({ sessionId, pitchShown, userResponse, objection }) {
        try {
          const session = await prisma.session.findUnique({
            where: { id: sessionId },
          });

          if (!session) {
            return { success: false, error: 'Session not found' };
          }

          const currentFlowState = (session.flowState || {}) as any;
          await prisma.session.update({
            where: { id: sessionId },
            data: {
              flowState: {
                ...currentFlowState,
                pitchShown,
                pitchResponse: userResponse,
                pitchObjection: objection || null,
                pitchTimestamp: new Date().toISOString(),
              },
            },
          });

          logger.info(`[24/7 PITCH] ${userResponse} - Session: ${sessionId}`);
          if (objection) {
            logger.info(`[24/7 PITCH] Objection: ${objection}`);
          }

          return { success: true };
        } catch (error) {
          logger.error('Error tracking 24/7 pitch:', { error });
          return { success: false, error: String(error) };
        }
      },
    });

    // Tool: Track key moment
    const trackKeyMoment = tool({
      name: 'track_key_moment',
      description: 'Tracks a significant moment or insight in the conversation',
      parameters: z.object({
        sessionId: z.string(),
        turn: z.number(),
        type: z.string(),
        content: z.string(),
        significance: z.string(),
      }),
      async execute({ sessionId, turn, type, content, significance }) {
        try {
          const memory = await prisma.conversationalMemory.findUnique({
            where: { sessionId },
          });

          if (!memory) {
            logger.warn(`Memory not found for session ${sessionId}`);
            return { success: false, error: 'Memory not found' };
          }

          const currentMoments = (memory.keyMoments || []) as any[];
          await prisma.conversationalMemory.update({
            where: { sessionId },
            data: {
              keyMoments: [...currentMoments, { turn, type, content, significance }],
            },
          });

          logger.info(`[KEY MOMENT] ${type} - Session: ${sessionId}`);
          return { success: true };
        } catch (error) {
          logger.error('Error tracking key moment:', { error });
          return { success: false, error: String(error) };
        }
      },
    });

    return {
      saveConversation,
      trackEngagement,
      saveStyleAnalysis,
      saveUserPattern,
      saveDiagnosis,
      saveDiagnosisMetadata,
      trackEmotion,
      trackKeyMoment,
      track24x7Pitch,
    };
  }

  /**
   * Iniciar conversación
   */
  async startConversation(userName: string): Promise<{
    conversationId: string;
    welcomeMessage: string;
  }> {
    try {
      const tempSessionId = `temp_${Date.now()}`;

      const welcomeMessage = `Hola ${userName}, bienvenido a Objetivo Vientre Plano 🌿\n\nEncantada de saludarte. Soy Clara, tu asistente personal.\n\nVoy a ayudarte mediante algunas preguntas a obtener un diagnóstico personalizado para entender tu inflamación abdominal, mejorar tu energía y ayudarte a sentirte realmente bien contigo mismo.\n\n**¿Empezamos?** ¿O prefieres hacerme alguna pregunta antes?\n\nEstoy aquí para ti. Este es tu espacio.`;

      return {
        conversationId: tempSessionId,
        welcomeMessage,
      };
    } catch (error) {
      logger.error('Error starting conversation:', { error });
      throw error;
    }
  }

  /**
   * Procesar mensaje del usuario
   */
  async processMessage(
    conversationId: string,
    userMessage: string,
    context: {
      userName?: string;
      mainProblem?: string;
      turnCount: number;
      hasRealProblem?: boolean;
      sessionId?: string;
      hasImage?: boolean;
      hasOfferedImage?: boolean;
    },
    imageBuffer?: Buffer
  ): Promise<{
    message: string;
    isDiagnosisReady?: boolean;
    shouldEndConversation?: boolean;
  }> {
    try {
      // Obtener análisis de estilo y patrón si existen
      let userStyle = null;
      let detectedPattern = null;
      if (context.sessionId) {
        const memory = await prisma.conversationalMemory.findUnique({
          where: { sessionId: context.sessionId },
        });

        // Style analysis (después del turno 2)
        if (context.turnCount >= 3) {
          userStyle = memory?.userStyle as { formality: number; verbosity: number; emotionLevel: number } | null;
          if (userStyle) {
            logger.info('[STYLE] Using user style analysis:', { userStyle, turnCount: context.turnCount });
          }
        }

        // Pattern detection (después del turno 1)
        if (context.turnCount >= 2 && memory?.factualInfo) {
          const factualInfo = memory.factualInfo as any;
          if (factualInfo.userPattern) {
            detectedPattern = {
              pattern: factualInfo.userPattern,
              confidence: factualInfo.patternConfidence || 0,
              indicators: factualInfo.patternIndicators || [],
              recommendedQuestionCount: factualInfo.recommendedQuestionCount || 6,
            };
            logger.info('[PATTERN] Using detected pattern:', { detectedPattern, turnCount: context.turnCount });
          }
        }
      }

      // Construir instrucciones dinámicas (V2 simplificadas)
      const dynamicInstructions = buildDynamicInstructions({
        userName: context.userName || undefined,
        turnCount: context.turnCount,
        hasRealProblem: context.hasRealProblem || undefined,
        hasImage: context.hasImage || undefined,
        userStyle: userStyle || undefined,
        detectedPattern: detectedPattern || undefined,
      });

      const fullInstructions = `${CLARA_INSTRUCTIONS}\n\n${dynamicInstructions}`;

      // Agregar contexto de sessionId para que los tools funcionen
      let messageWithContext = userMessage;
      if (context.sessionId) {
        messageWithContext = `[SessionID: ${context.sessionId}]\n${userMessage}`;
      }

      if (imageBuffer) {
        const base64Image = imageBuffer.toString('base64');
        messageWithContext += `\n\n[Imagen compartida: data:image/jpeg;base64,${base64Image}]`;
      }

      // Crear Clara temporal con instrucciones dinámicas
      const tools = this.createTools();
      const tempClara = new Agent({
        name: 'Clara',
        instructions: fullInstructions,
        model: 'gpt-5-mini-2025-08-07',
        tools: [
          tools.saveConversation,
          tools.trackEngagement,
          tools.trackEmotion,
          tools.trackKeyMoment,
        ],
        handoffs: [this.diagnosisAgent], // Diagnosis Agent implícito
      });

      // HANDOFF EXPLÍCITO 0: Pattern Analyzer (turnos 1 y 2 - detecta patrón temprano)
      if (context.turnCount === 1 || context.turnCount === 2) {
        logger.info(`[HANDOFF] Calling Pattern Analyzer at turn ${context.turnCount}`);
        try {
          const conversationHistory = await prisma.message.findMany({
            where: { sessionId: context.sessionId! },
            orderBy: { createdAt: 'asc' },
            take: 3, // Primeros mensajes para detectar patrón
          });

          const historyText = conversationHistory
            .map(m => `${m.role}: ${m.content}`)
            .join('\n');

          const patternAnalysisPrompt = `Analiza el patrón del usuario basándote en estos mensajes:

${historyText}

Determina cuál de los 6 patrones describe mejor al usuario:
1. MOTIVACION_ALTA - Alta energía, decisión, urgencia positiva
2. MOTIVACION_MEDIA - Interés moderado, cauteloso
3. MOTIVACION_BAJA - Poco compromiso, escéptico
4. DOLOR_FUERTE - Síntomas intensos, frustración, urgencia
5. PERFIL_EMOCIONAL - Estrés, ansiedad, conexión emocional
6. PERFIL_ESTETICO - Enfoque estético, vientre plano

Usa el tool save_user_pattern con el sessionId: ${context.sessionId}`;

          await run(this.patternAnalyzerAgent, patternAnalysisPrompt);
          logger.info('[HANDOFF] Pattern Analyzer completed successfully');
        } catch (error) {
          logger.error('[HANDOFF] Pattern Analyzer failed:', { error });
        }
      }

      // HANDOFF EXPLÍCITO 1: Style Analyzer (turnos 2 y 3 - ambos aportan contexto)
      if (context.turnCount === 2 || context.turnCount === 3) {
        logger.info(`[HANDOFF] Calling Style Analyzer at turn ${context.turnCount}`);
        try {
          const conversationHistory = await prisma.message.findMany({
            where: { sessionId: context.sessionId! },
            orderBy: { createdAt: 'asc' },
            take: 5, // Primeros 5 mensajes
          });

          const historyText = conversationHistory
            .map(m => `${m.role}: ${m.content}`)
            .join('\n');

          const styleAnalysisPrompt = `Analiza el estilo de comunicación del usuario basándote en estos mensajes:

${historyText}

Determina:
1. Formality (1-10): ¿Casual o formal?
2. Verbosity (1-10): ¿Breve o detallado?
3. EmotionLevel (1-10): ¿Racional o emocional?

Usa el tool save_style_analysis con estos valores y el sessionId: ${context.sessionId}`;

          await run(this.styleAnalyzerAgent, styleAnalysisPrompt);
          logger.info('[HANDOFF] Style Analyzer completed successfully');
        } catch (error) {
          logger.error('[HANDOFF] Style Analyzer failed:', { error });
        }
      }

      // TODO: SAFETY NET - Implementar después de testing
      // Forzar diagnóstico después de 18 turnos para prevenir conversaciones infinitas

      // Obtener historial de conversación desde la BD
      let conversationHistory: { role: string; content: string }[] = [];
      if (context.sessionId) {
        const dbMessages = await prisma.message.findMany({
          where: { sessionId: context.sessionId },
          orderBy: { createdAt: 'asc' },
        });
        conversationHistory = dbMessages.map(m => ({
          role: m.role,
          content: m.content,
        }));
      }

      // Construir prompt con historial completo
      let fullPrompt = messageWithContext;
      if (conversationHistory.length > 0) {
        const historyText = conversationHistory
          .map(m => `${m.role === 'user' ? 'Usuario' : 'Clara'}: ${m.content}`)
          .join('\n\n');

        fullPrompt = `HISTORIAL DE CONVERSACIÓN:
${historyText}

NUEVO MENSAJE DEL USUARIO:
${messageWithContext}

Responde considerando TODO el historial anterior. Mantén el contexto de la conversación.`;
      }

      // Ejecutar Clara con historial completo
      const result = await run(tempClara, fullPrompt);

      const messageText = result.finalOutput || 'Lo siento, hubo un error. Por favor, intenta de nuevo.';

      // Detectar si está listo para diagnóstico
      const isDiagnosisReady = this.shouldGenerateDiagnosis(
        messageText,
        context.turnCount,
        context.hasRealProblem
      );

      const shouldEndConversation = this.shouldEndConversation(
        messageText,
        context.hasRealProblem
      );

      logger.info(`Message processed, turn: ${context.turnCount}, diagnosis ready: ${isDiagnosisReady}`);

      return {
        message: messageText,
        isDiagnosisReady,
        shouldEndConversation,
      };
    } catch (error) {
      logger.error('Error processing message:', { error });
      throw error;
    }
  }

  /**
   * Generar diagnóstico con handoff explícito al Diagnosis Agent
   */
  async generateDiagnosis(conversationId: string, userName: string): Promise<string> {
    try {
      const sessionId = conversationId.startsWith('temp_') ? null : conversationId;

      if (!sessionId) {
        throw new Error('Invalid session ID for diagnosis');
      }

      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { diagnosis: true },
      });

      // Si ya existe, retornarlo
      if (session?.diagnosis?.content) {
        return session.diagnosis.content;
      }

      // HANDOFF EXPLÍCITO 2: Diagnosis Agent
      logger.info(`[HANDOFF] Calling Diagnosis Agent for session ${sessionId}`);

      // Obtener historial completo de la conversación
      const conversationHistory = await prisma.message.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
      });

      const historyText = conversationHistory
        .map(m => `${m.role}: ${m.content}`)
        .join('\n\n');

      const diagnosisPrompt = `Genera un diagnóstico personalizado para ${userName}.

Historial completo de la conversación:
${historyText}

SessionID para guardar: ${sessionId}

IMPORTANTE: Usa el tool save_diagnosis para guardar el diagnóstico generado.`;

      const result = await run(this.diagnosisAgent, diagnosisPrompt);
      logger.info('[HANDOFF] Diagnosis Agent completed successfully');

      const diagnosisMarkdown = result.finalOutput || 'No se pudo generar el diagnóstico.';
      const diagnosisHTML = convertDiagnosisToHTML(diagnosisMarkdown);

      logger.info(`Diagnosis generated for ${userName}`);

      return diagnosisHTML;
    } catch (error) {
      logger.error('Error generating diagnosis:', { error });
      throw error;
    }
  }

  /**
   * Detecta si es momento de generar diagnóstico
   */
  private shouldGenerateDiagnosis(
    message: string,
    turnCount: number,
    hasRealProblem?: boolean
  ): boolean {
    if (!hasRealProblem) return false;
    if (turnCount >= 14) return true;

    const diagnosisSignals = [
      'basándome en lo que me has contado',
      'basandome en lo que',
      'hola \\w+,',
      'puntos clave',
      'necesitas enfoque integral',
      'necesitas un enfoque',
      'diagnóstico de',
      'diagnóstico personalizado',
      'conclusión integradora',
      'preparar tu diagnóstico',
      'ya tengo todo',
      'dame un momento para preparar',
      'listo para tu diagnóstico',
      'generar tu diagnóstico'
    ];

    return diagnosisSignals.some(signal =>
      new RegExp(signal, 'i').test(message)
    );
  }

  /**
   * Detecta si debe terminar conversación
   */
  private shouldEndConversation(
    message: string,
    hasRealProblem?: boolean
  ): boolean {
    if (hasRealProblem) return false;

    const endSignals = [
      'lo dejamos aquí',
      'aquí estoy si necesitas',
      'si en algún momento tienes dudas'
    ];

    return endSignals.some(signal =>
      new RegExp(signal, 'i').test(message)
    );
  }
}

export const agentService = new AgentService();
