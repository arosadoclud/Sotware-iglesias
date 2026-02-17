import { Router } from 'express';
import * as bibleController from './bible.controller';

const router = Router();

/**
 * GET /api/bible/verse/:reference
 * Obtiene un versículo bíblico
 * Ejemplo: /api/bible/verse/Mateo%2028:19
 */
router.get('/verse/:reference', bibleController.getVerse);

export default router;
