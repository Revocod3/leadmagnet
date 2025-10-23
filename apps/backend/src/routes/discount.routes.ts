import { Router } from 'express';
import { Request, Response } from 'express';
import { DiscountService } from '../services/discount.service';
import type { ApiResponse } from '../types';

const router = Router();
const discountService = new DiscountService();

/**
 * Validate a discount code
 * GET /api/discount/validate/:code
 */
router.get('/validate/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    if (!code) {
      res.status(400).json({
        success: false,
        error: 'Código de descuento requerido',
      } as ApiResponse);
      return;
    }

    const validation = await discountService.validateCode(code);

    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        error: validation.error || 'Código inválido',
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: {
        isValid: true,
        percentage: validation.percentage,
        expiresAt: validation.expiresAt,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Error validating discount code:', error);
    res.status(500).json({
      success: false,
      error: 'Error al validar el código',
    } as ApiResponse);
  }
});

/**
 * Redeem a discount code
 * POST /api/discount/redeem
 */
router.post('/redeem', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      res.status(400).json({
        success: false,
        error: 'Código de descuento requerido',
      } as ApiResponse);
      return;
    }

    const discount = await discountService.redeemCode(code);

    res.json({
      success: true,
      data: {
        code: discount.code,
        percentage: discount.percentage,
        redeemedAt: discount.usedAt,
      },
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error redeeming discount code:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Error al canjear el código',
    } as ApiResponse);
  }
});

/**
 * Get discount by session ID
 * GET /api/discount/session/:sessionId
 */
router.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: 'Session ID requerido',
      } as ApiResponse);
      return;
    }

    const discount = await discountService.getDiscountBySession(sessionId);

    if (!discount) {
      res.status(404).json({
        success: false,
        error: 'No se encontró código de descuento para esta sesión',
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: {
        code: discount.code,
        percentage: discount.percentage,
        expiresAt: discount.expiresAt,
        used: discount.used,
        usedAt: discount.usedAt,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Error getting discount by session:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el código de descuento',
    } as ApiResponse);
  }
});

export default router;
