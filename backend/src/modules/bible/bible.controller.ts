import { Request, Response } from 'express';
import { getBibleVerse } from './bible.service';

/**
 * Obtiene un versículo bíblico
 * GET /api/bible/verse/:reference
 */
export async function getVerse(req: Request, res: Response) {
  try {
    const { reference } = req.params;
    
    if (!reference || reference.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Referencia bíblica requerida',
      });
    }
    
    const decodedRef = decodeURIComponent(reference);
    console.log('🔍 Buscando versículo:', decodedRef);
    
    const verse = await getBibleVerse(decodedRef);
    
    if (!verse) {
      console.log('❌ Versículo no encontrado:', decodedRef);
      return res.status(404).json({
        success: false,
        message: `Versículo no encontrado: "${decodedRef}". Verifica la referencia (ej: Mateo 28:19, Juan 3:16)`,
      });
    }
    
    console.log('✅ Versículo encontrado:', verse.reference);
    
    res.json({
      success: true,
      data: verse,
    });
  } catch (error) {
    console.error('Error en getVerse:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el versículo',
    });
  }
}
