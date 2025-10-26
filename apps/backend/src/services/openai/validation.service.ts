import { isValidEmail, sanitizeString } from '../../utils/helpers';

export interface ValidationResult {
  isValid: boolean;
  feedback?: string;
}

export class ValidationService {
  /**
   * Validate session ID format
   */
  validateSessionId(sessionId: string): ValidationResult {
    if (!sessionId || typeof sessionId !== 'string') {
      return {
        isValid: false,
        feedback: 'ID de sesión inválido',
      };
    }

    if (sessionId.trim().length === 0) {
      return {
        isValid: false,
        feedback: 'ID de sesión no puede estar vacío',
      };
    }

    if (sessionId.length > 100) {
      return {
        isValid: false,
        feedback: 'ID de sesión demasiado largo',
      };
    }

    return {
      isValid: true,
    };
  }

  /**
   * Validate user name
   */
  validateName(name: string): ValidationResult {
    if (!name || typeof name !== 'string') {
      return {
        isValid: false,
        feedback: 'El nombre es requerido',
      };
    }

    const trimmedName = name.trim();

    if (trimmedName.length === 0) {
      return {
        isValid: false,
        feedback: 'El nombre no puede estar vacío',
      };
    }

    if (trimmedName.length < 2) {
      return {
        isValid: false,
        feedback: 'El nombre debe tener al menos 2 caracteres',
      };
    }

    if (trimmedName.length > 100) {
      return {
        isValid: false,
        feedback: 'El nombre es demasiado largo (máximo 100 caracteres)',
      };
    }

    // Check for invalid characters
    const invalidCharsRegex = /[<>{}[\]\\\/]/;
    if (invalidCharsRegex.test(trimmedName)) {
      return {
        isValid: false,
        feedback: 'El nombre contiene caracteres inválidos',
      };
    }

    return {
      isValid: true,
    };
  }

  /**
   * Validate email address
   */
  validateEmail(email: string): ValidationResult {
    if (!email || typeof email !== 'string') {
      return {
        isValid: false,
        feedback: 'El email es requerido',
      };
    }

    const trimmedEmail = email.trim();

    if (trimmedEmail.length === 0) {
      return {
        isValid: false,
        feedback: 'El email no puede estar vacío',
      };
    }

    if (!isValidEmail(trimmedEmail)) {
      return {
        isValid: false,
        feedback: 'El formato del email no es válido',
      };
    }

    if (trimmedEmail.length > 255) {
      return {
        isValid: false,
        feedback: 'El email es demasiado largo',
      };
    }

    return {
      isValid: true,
    };
  }

  /**
   * Validate chat message
   */
  validateMessage(message: string): ValidationResult {
    if (!message || typeof message !== 'string') {
      return {
        isValid: false,
        feedback: 'El mensaje es requerido',
      };
    }

    const trimmedMessage = message.trim();

    if (trimmedMessage.length === 0) {
      return {
        isValid: false,
        feedback: 'El mensaje no puede estar vacío',
      };
    }

    if (trimmedMessage.length > 5000) {
      return {
        isValid: false,
        feedback: 'El mensaje es demasiado largo (máximo 5000 caracteres)',
      };
    }

    return {
      isValid: true,
    };
  }

  /**
   * Sanitize user input
   */
  sanitizeInput(input: string): string {
    return sanitizeString(input);
  }
}
