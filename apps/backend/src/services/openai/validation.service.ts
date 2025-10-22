import type { ValidationResult } from '../../types';

export class ValidationService {
  validateEmail(email: string): ValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      return { isValid: false, feedback: 'El email es requerido' };
    }

    if (!emailRegex.test(email)) {
      return { isValid: false, feedback: 'Formato de email inválido' };
    }

    return { isValid: true };
  }

  validateName(name: string): ValidationResult {
    if (!name) {
      return { isValid: false, feedback: 'El nombre es requerido' };
    }

    if (name.length < 2) {
      return { isValid: false, feedback: 'El nombre debe tener al menos 2 caracteres' };
    }

    if (name.length > 50) {
      return { isValid: false, feedback: 'El nombre no puede tener más de 50 caracteres' };
    }

    // Check for valid characters (letters, spaces, hyphens, apostrophes)
    const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/;
    if (!nameRegex.test(name)) {
      return { isValid: false, feedback: 'El nombre contiene caracteres inválidos' };
    }

    return { isValid: true };
  }

  validateSessionId(sessionId: string): ValidationResult {
    if (!sessionId) {
      return { isValid: false, feedback: 'ID de sesión requerido' };
    }

    // Check if it's a valid CUID format (basic check)
    if (!sessionId.startsWith('c') || sessionId.length !== 25) {
      return { isValid: false, feedback: 'ID de sesión inválido' };
    }

    return { isValid: true };
  }

  validateMessage(message: string): ValidationResult {
    if (!message) {
      return { isValid: false, feedback: 'El mensaje no puede estar vacío' };
    }

    if (message.length > 1000) {
      return { isValid: false, feedback: 'El mensaje es demasiado largo (máximo 1000 caracteres)' };
    }

    return { isValid: true };
  }

  validateQuizAnswer(questionId: number, answer: string): ValidationResult {
    if (!answer) {
      return { isValid: false, feedback: 'Debes seleccionar una respuesta' };
    }

    if (questionId < 1 || questionId > 17) {
      return { isValid: false, feedback: 'ID de pregunta inválido' };
    }

    return { isValid: true };
  }

  sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .slice(0, 1000); // Limit length
  }
}