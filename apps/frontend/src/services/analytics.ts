/**
 * Google Analytics service for tracking events
 * Tracks user interactions across both free and PRO chat
 */

// Extend the Window interface to include gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
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
