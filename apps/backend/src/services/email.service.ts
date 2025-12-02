import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

// Zoho SMTP Configuration
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.zoho.eu';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465');
const SMTP_USER = process.env.SMTP_USER || 'info@objetivovientreplano.com';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'Objetivo Vientre Plano';
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || SMTP_USER;

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://chat.objetivovientreplano.com';

// Create transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export interface WelcomeEmailData {
  email: string;
  name: string;
  plan: string;
  isNewUser: boolean;
  resetToken?: string;
}

export class EmailService {
  /**
   * Verify SMTP connection
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await transporter.verify();
      logger.info('📧 SMTP connection verified');
      return true;
    } catch (error) {
      logger.error('📧 SMTP connection failed:', { error: String(error) });
      return false;
    }
  }

  /**
   * Send welcome email to new PRO subscriber
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    console.log('[EmailService] sendWelcomeEmail called with:', {
      email: data.email,
      name: data.name,
      plan: data.plan,
      isNewUser: data.isNewUser,
      hasResetToken: !!data.resetToken,
    });

    const { email, name, plan, isNewUser, resetToken } = data;

    const subject = isNewUser
      ? '🎉 ¡Bienvenido/a a Objetivo Vientre Plano PRO!'
      : '🎉 ¡Tu membresía PRO está activa!';

    const setPasswordUrl = resetToken
      ? `${FRONTEND_URL}/set-password?token=${resetToken}&email=${encodeURIComponent(email)}`
      : null;

    const loginUrl = `${FRONTEND_URL}/login`;
    const googleLoginUrl = `${FRONTEND_URL}/login?method=google`;

    const planName = {
      monthly: 'Plan Mensual',
      yearly: 'Plan Anual',
      lifetime: 'Plan Vitalicio',
    }[plan] || 'Plan PRO';

    const html = this.generateWelcomeEmailHTML({
      name,
      planName,
      isNewUser,
      setPasswordUrl,
      loginUrl,
      googleLoginUrl,
    });

    const text = this.generateWelcomeEmailText({
      name,
      planName,
      isNewUser,
      setPasswordUrl,
      loginUrl,
    });

    try {
      await transporter.sendMail({
        from: `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`,
        to: email,
        subject,
        text,
        html,
      });

      logger.info(`📧 Welcome email sent to: ${email}`);
      return true;
    } catch (error) {
      logger.error(`📧 Failed to send welcome email to ${email}:`, { error: String(error) });
      return false;
    }
  }

  /**
   * Generate HTML email template
   */
  private generateWelcomeEmailHTML(data: {
    name: string;
    planName: string;
    isNewUser: boolean;
    setPasswordUrl: string | null;
    loginUrl: string;
    googleLoginUrl: string;
  }): string {
    const { name, planName, isNewUser, setPasswordUrl, loginUrl, googleLoginUrl } = data;

    const accessSection = isNewUser && setPasswordUrl
      ? `
        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 24px; margin: 24px 0;">
          <h3 style="color: #333; margin: 0 0 16px 0; font-size: 18px;">Elige cómo acceder:</h3>
          
          <div style="margin-bottom: 16px;">
            <a href="${googleLoginUrl}" style="display: inline-block; background: #4285F4; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 16px;">
              🔵 Acceder con Google
            </a>
            <p style="color: #666; font-size: 14px; margin: 8px 0 0 0;">La forma más rápida si usas Gmail</p>
          </div>
          
          <div style="border-top: 1px solid #ddd; padding-top: 16px; margin-top: 16px;">
            <a href="${setPasswordUrl}" style="display: inline-block; background: #9FB870; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 16px;">
              🔐 Crear mi contraseña
            </a>
            <p style="color: #666; font-size: 14px; margin: 8px 0 0 0;">Configura una contraseña para acceder con tu email</p>
          </div>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center;">
          El enlace para crear tu contraseña expira en 24 horas.
        </p>
      `
      : `
        <div style="text-align: center; margin: 24px 0;">
          <a href="${loginUrl}" style="display: inline-block; background: #9FB870; color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; font-size: 18px;">
            Acceder a mi cuenta PRO →
          </a>
        </div>
      `;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #9FB870; font-size: 28px; margin: 0;">🌿 Objetivo Vientre Plano</h1>
  </div>
  
  <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <h2 style="color: #333; margin: 0 0 16px 0;">¡Hola ${name}! 👋</h2>
    
    <p style="font-size: 16px; color: #555;">
      ${isNewUser
        ? `¡Gracias por unirte a <strong>Objetivo Vientre Plano PRO</strong>! Tu ${planName} ya está activo y tienes acceso completo a todas las funcionalidades.`
        : `¡Genial! Tu <strong>${planName}</strong> ya está activo. Ahora tienes acceso completo a todas las funcionalidades PRO.`
      }
    </p>
    
    ${accessSection}
    
    <div style="background: #f0f7e6; border-radius: 8px; padding: 20px; margin-top: 24px;">
      <h3 style="color: #5a7a2d; margin: 0 0 12px 0; font-size: 16px;">✨ Tu membresía PRO incluye:</h3>
      <ul style="color: #555; margin: 0; padding-left: 20px;">
        <li>Conversaciones ilimitadas con Clara, tu asistente de salud digestiva</li>
        <li>Análisis de imágenes sin límite</li>
        <li>Diagnósticos personalizados avanzados</li>
        <li>Seguimiento de tu progreso</li>
        <li>Soporte prioritario</li>
      </ul>
    </div>
  </div>
  
  <div style="text-align: center; margin-top: 32px; color: #999; font-size: 14px;">
    <p>¿Tienes preguntas? Responde a este correo y te ayudaremos.</p>
    <p style="margin-top: 16px;">
      <a href="https://objetivovientreplano.com" style="color: #9FB870;">objetivovientreplano.com</a>
    </p>
  </div>
  
</body>
</html>
    `;
  }

  /**
   * Generate plain text email
   */
  private generateWelcomeEmailText(data: {
    name: string;
    planName: string;
    isNewUser: boolean;
    setPasswordUrl: string | null;
    loginUrl: string;
  }): string {
    const { name, planName, isNewUser, setPasswordUrl, loginUrl } = data;

    let text = `¡Hola ${name}!\n\n`;

    if (isNewUser) {
      text += `¡Gracias por unirte a Objetivo Vientre Plano PRO! Tu ${planName} ya está activo.\n\n`;
      if (setPasswordUrl) {
        text += `Para acceder a tu cuenta, puedes:\n\n`;
        text += `1. Acceder con Google: ${loginUrl}?method=google\n`;
        text += `2. Crear una contraseña: ${setPasswordUrl}\n\n`;
        text += `El enlace para crear tu contraseña expira en 24 horas.\n\n`;
      }
    } else {
      text += `¡Tu ${planName} ya está activo! Ahora tienes acceso completo a todas las funcionalidades PRO.\n\n`;
      text += `Accede a tu cuenta: ${loginUrl}\n\n`;
    }

    text += `Tu membresía PRO incluye:\n`;
    text += `- Conversaciones ilimitadas con Clara\n`;
    text += `- Análisis de imágenes sin límite\n`;
    text += `- Diagnósticos personalizados avanzados\n`;
    text += `- Seguimiento de tu progreso\n`;
    text += `- Soporte prioritario\n\n`;

    text += `¿Tienes preguntas? Responde a este correo y te ayudaremos.\n\n`;
    text += `- El equipo de Objetivo Vientre Plano`;

    return text;
  }
}

export const emailService = new EmailService();
