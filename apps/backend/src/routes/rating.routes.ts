import { Router, type Router as RouterType } from 'express';
import { RatingController } from '../controllers/rating.controller';

const router: RouterType = Router();
const ratingController = new RatingController();

// POST /api/ratings - Crear una nueva valoración
router.post('/', (req, res) => ratingController.createRating(req, res));

// GET /api/ratings/:sessionId - Obtener valoraciones de una sesión
router.get('/:sessionId', (req, res) => ratingController.getRatingsBySession(req, res));

export default router;
