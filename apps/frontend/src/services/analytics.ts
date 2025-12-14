/**
 * Analytics service for tracking events
 * Tracks user interactions across both free and PRO chat
 * Supports Google Analytics and Meta Pixel
 */

// Extend the Window interface to include gtag and fbq
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    fbq?: (...args: any[]) => void;
  }
}

export type ChatType = 'free' | 'pro';

interface BaseEventParams {
  chat_type?: ChatType;
  [key: string]: any;
}

/**
 * Send a custom event to Google Analytics
 */
export const trackEvent = (eventName: string, params?: BaseEventParams): void => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
};

/**
 * Track when a chat session starts
 */
export const trackChatStart = (chatType: ChatType): void => {
  trackEvent('chat_start', {
    chat_type: chatType,
  });
};

/**
 * Track when a user sends a message
 */
export const trackMessageSent = (chatType: ChatType, messageLength: number): void => {
  trackEvent('chat_message_sent', {
    chat_type: chatType,
    message_length: messageLength,
  });
};

/**
 * Track when a user selects a quick reply option
 */
export const trackQuickReplySelected = (chatType: ChatType, optionValue: string): void => {
  trackEvent('quick_reply_selected', {
    chat_type: chatType,
    option_value: optionValue,
  });
};

/**
 * Track when the diagnosis is completed
 */
export const trackDiagnosisCompleted = (chatType: ChatType): void => {
  trackEvent('diagnosis_completed', {
    chat_type: chatType,
  });
};

/**
 * Track when a user downloads the PDF
 */
export const trackPdfDownload = (chatType: ChatType): void => {
  trackEvent('pdf_download', {
    chat_type: chatType,
  });
};

/**
 * Track when a user clicks on subscription/pricing CTA
 */
export const trackSubscriptionClick = (chatType: ChatType, source: string): void => {
  trackEvent('subscription_click', {
    chat_type: chatType,
    source, // e.g., 'diagnosis_cta', 'limit_exceeded', 'closing_message'
  });
};

/**
 * Track when a user rates their experience
 */
export const trackRatingSubmitted = (chatType: ChatType, rating: number): void => {
  trackEvent('rating_submitted', {
    chat_type: chatType,
    rating,
  });
};

/**
 * Track when a user uploads an image
 */
export const trackImageUpload = (chatType: ChatType): void => {
  trackEvent('image_upload', {
    chat_type: chatType,
  });
};

/**
 * Track when a user hits the image limit
 */
export const trackImageLimitReached = (chatType: ChatType): void => {
  trackEvent('image_limit_reached', {
    chat_type: chatType,
  });
};

/**
 * Track when a user completes onboarding
 */
export const trackOnboardingCompleted = (chatType: ChatType): void => {
  trackEvent('onboarding_completed', {
    chat_type: chatType,
  });
};

/**
 * Track session duration (call this on unmount or navigation)
 */
export const trackSessionDuration = (chatType: ChatType, durationSeconds: number): void => {
  trackEvent('session_duration', {
    chat_type: chatType,
    duration_seconds: durationSeconds,
  });
};

/**
 * Track specific flow steps
 */
export const trackFlowStep = (chatType: ChatType, stepName: string): void => {
  trackEvent('flow_step', {
    chat_type: chatType,
    step_name: stepName,
  });
};

/**
 * Track errors for debugging
 */
export const trackError = (chatType: ChatType, errorType: string, errorMessage?: string): void => {
  trackEvent('error_occurred', {
    chat_type: chatType,
    error_type: errorType,
    error_message: errorMessage,
  });
};

// ============================================================================
// Meta Pixel Events
// ============================================================================
// IMPORTANTE: Cumplimiento con políticas de Meta para sector salud
// ❌ NO enviar: condiciones médicas, síntomas, diagnósticos, emails en parámetros
// ✅ SÍ enviar: eventos genéricos, valores agregados, datos hasheados vía fbq('init')

/**
 * Update Meta Pixel Advanced Matching with user data
 * Meta automatically hashes this data before sending it
 *
 * @param email - User's email (will be hashed by Meta)
 * @param userData - Optional additional user data (name, phone, etc.)
 *
 * PRIVACIDAD: Los datos son hasheados automáticamente por Meta antes de enviarse
 */
export const updateMetaAdvancedMatching = (
  email: string,
  userData?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  }
): void => {
  if (typeof window.fbq === 'function') {
    const matchingData: Record<string, string> = {
      em: email.toLowerCase().trim(), // Meta lo hashea automáticamente
    };

    // Agregar datos opcionales si están disponibles
    if (userData?.firstName) matchingData.fn = userData.firstName.toLowerCase().trim();
    if (userData?.lastName) matchingData.ln = userData.lastName.toLowerCase().trim();
    if (userData?.phone) matchingData.ph = userData.phone.replace(/\D/g, ''); // Solo dígitos
    if (userData?.city) matchingData.ct = userData.city.toLowerCase().trim();
    if (userData?.state) matchingData.st = userData.state.toLowerCase().trim();
    if (userData?.zip) matchingData.zp = userData.zip.replace(/\s/g, '');
    if (userData?.country) matchingData.country = userData.country.toLowerCase().trim();

    // Actualizar advanced matching
    window.fbq('init', '280096591096341', matchingData);
  }
};

/**
 * Track Lead event in Meta Pixel
 * Call this when a user completes the diagnosis or captures email
 *
 * PRIVACIDAD: Solo envía datos genéricos, sin información médica o personal
 */
export const trackMetaLead = (): void => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'Lead', {
      content_name: 'Diagnóstico Vientre Plano',
      content_category: 'Health & Wellness',
      value: 0,
      currency: 'EUR'
    });
  }
};

/**
 * Track CompleteRegistration event in Meta Pixel
 * Call this when a user completes registration
 *
 * PRIVACIDAD: Solo envía datos genéricos, sin información médica o personal
 */
export const trackMetaCompleteRegistration = (): void => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'CompleteRegistration', {
      content_name: 'Onboarding Completo',
      status: 'completed',
      value: 0,
      currency: 'EUR'
    });
  }
};

/**
 * Track Purchase event in Meta Pixel
 * Call this when a user completes a purchase
 *
 * PRIVACIDAD: Solo envía valor y moneda, sin datos personales
 */
export const trackMetaPurchase = (value: number, currency: string = 'EUR'): void => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'Purchase', {
      value,
      currency,
      content_type: 'product',
      content_name: 'Plan Premium'
    });
  }
};
