/**
 * Interaction Limits Configuration
 * 
 * Defines the maximum number of interactions allowed per session
 * to control OpenAI API costs.
 */

export const INTERACTION_LIMITS = {
  // Maximum messages before diagnosis (with photo shared)
  MAX_MESSAGES_WITH_PHOTO: 13,

  // Maximum messages before diagnosis (without photo)
  MAX_MESSAGES_WITHOUT_PHOTO: 20,

  // Maximum messages allowed after diagnosis is delivered
  // Usuario puede enviar 1 mensaje después del diagnóstico y Clara responde,
  // al segundo mensaje aparece el límite de suscripción
  POST_DIAGNOSIS_LIMIT: 2,

  // Maximum photos per session
  MAX_PHOTOS: 1,
} as const;

/**
 * Limit exceeded messages by language
 */
export const LIMIT_EXCEEDED_MESSAGES = {
  es: {
    preDiagnosis: 'Has alcanzado el límite de interacciones para generar tu diagnóstico. Permíteme generarlo ahora basándome en nuestra conversación.',
    postDiagnosis: 'Has excedido tu límite de interacciones gratuitas. Para seguir conversando con Clara y recibir apoyo continuo, suscríbete al Método Completo y obtén acceso ilimitado.',
    photoLimit: 'Solo puedes compartir una foto por diagnóstico gratuito. Para análisis adicionales con fotos ilimitadas, suscríbete al Método Completo.',
  },
  en: {
    preDiagnosis: 'You have reached the interaction limit to generate your diagnosis. Let me generate it now based on our conversation.',
    postDiagnosis: 'You have exceeded your free interaction limit. To continue chatting with Clara and receive ongoing support, subscribe to the Complete Method for unlimited access.',
    photoLimit: 'You can only share one photo per free diagnosis. For additional analyses with unlimited photos, subscribe to the Complete Method.',
  },
} as const;
