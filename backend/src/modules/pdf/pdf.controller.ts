import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import Program from '../../models/Program.model';
import Church from '../../models/Church.model';
import { pdfService } from './pdf.service';
import { NotFoundError } from '../../utils/errors';

/**
 * PDF CONTROLLER — Paso 5
 * GET /programs/:id/pdf  →  descarga el PDF del programa
 * GET /programs/:id/pdf/preview  →  retorna el HTML para previsualizar en browser
 */

export const downloadProgramPdf = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const program = await Program.findOne({
      _id: req.params.id,
      churchId: req.churchId,
    });
    if (!program) throw new NotFoundError('Programa no encontrado');

    const church = await Church.findById(req.churchId);
    if (!church) throw new NotFoundError('Iglesia no encontrada');

    // Determinar si la iglesia tiene plan PRO (en Fase 3 leer de church.plan)
    const isPro = (church as any).plan === 'PRO' || (church as any).plan === 'ENTERPRISE';

    // Permitir pasar un resumen personalizado por query param (para preview dinámico)
    let summary = req.query.summary as string | undefined;
    if (summary) (program as any).summary = summary;
    // Usar el formato flyer visual
    const result = await pdfService.generateBuffer({ program, church, isPro, flyerStyle: true });

    // Actualizar pdfUrl en el programa (opcional, para historial)
    await Program.findByIdAndUpdate(program._id, {
      pdfUrl: `generated:${result.filename}`,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'Content-Length': result.buffer.length,
      'Cache-Control': 'no-cache',
    });

    res.send(result.buffer);
  } catch (error) {
    next(error);
  }
};

export const previewProgramPdf = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const program = await Program.findOne({
      _id: req.params.id,
      churchId: req.churchId,
    });
    if (!program) throw new NotFoundError('Programa no encontrado');

    const church = await Church.findById(req.churchId);
    if (!church) throw new NotFoundError('Iglesia no encontrada');

    const isPro = (church as any).plan === 'PRO' || (church as any).plan === 'ENTERPRISE';

    // Permitir pasar un resumen personalizado por query param (para preview dinámico)
    let summary = req.query.summary as string | undefined;
    if (summary) (program as any).summary = summary;
    // Devolver HTML del flyer visual para previsualización en el browser
    const html = pdfService.buildHtml({ program, church, isPro, flyerStyle: true });

    res.set('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    next(error);
  }
};
