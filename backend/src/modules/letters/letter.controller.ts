import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import LetterTemplate from '../../models/LetterTemplate.model';
import GeneratedLetter from '../../models/GeneratedLetter.model';
import Person from '../../models/Person.model';
import Church from '../../models/Church.model';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import puppeteer from 'puppeteer';
import { renderLetterDocument } from './letterDocument';

export const getLetterTemplates = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const templates = await LetterTemplate.find({ churchId: req.churchId }).sort({ name: 1 });
    res.json({ success: true, data: templates });
  } catch (error) { next(error); }
};

export const getLetterTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const template = await LetterTemplate.findOne({ _id: req.params.id, churchId: req.churchId });
    if (!template) throw new NotFoundError('Plantilla no encontrada');
    res.json({ success: true, data: template });
  } catch (error) { next(error); }
};

export const createLetterTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    delete req.body.churchId;
    const template = await LetterTemplate.create({ ...req.body, churchId: req.churchId });
    res.status(201).json({ success: true, data: template });
  } catch (error) { next(error); }
};

export const updateLetterTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    delete req.body.churchId;
    const template = await LetterTemplate.findOneAndUpdate(
      { _id: req.params.id, churchId: req.churchId }, req.body, { new: true }
    );
    if (!template) throw new NotFoundError('Plantilla no encontrada');
    res.json({ success: true, data: template });
  } catch (error) { next(error); }
};

export const deleteLetterTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const template = await LetterTemplate.findOneAndDelete({ _id: req.params.id, churchId: req.churchId });
    if (!template) throw new NotFoundError('Plantilla no encontrada');
    res.json({ success: true, message: 'Plantilla eliminada' });
  } catch (error) { next(error); }
};

export const getGeneratedLetters = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const letters = await GeneratedLetter.find({ churchId: req.churchId }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: letters });
  } catch (error) { next(error); }
};

export const deleteGeneratedLetter = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const letter = await GeneratedLetter.findOneAndDelete({ _id: req.params.id, churchId: req.churchId });
    if (!letter) throw new NotFoundError('Carta no encontrada');
    res.json({ success: true, message: 'Carta eliminada' });
  } catch (error) { next(error); }
};

export const generateLetter = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { templateId, personId, customFields, content: directContent, recipientName, templateName: directTemplateName } = req.body;
    
    // Buscar plantilla si existe y el templateId no es un wizard-type
    let template = null;
    let templateName = directTemplateName || 'Carta';
    
    if (templateId && !templateId.startsWith('wizard-')) {
      template = await LetterTemplate.findOne({ _id: templateId, churchId: req.churchId });
      if (!template) throw new NotFoundError('Plantilla no encontrada');
      templateName = template.name;
    }

    let finalContent = directContent || (template?.content || '');
    let recipient = recipientName || '';
    const variablesUsed: Record<string, string> = {};

    // Si se proporciona personId, obtener datos de la persona
    if (personId) {
      const person = await Person.findOne({ _id: personId, churchId: req.churchId });
      if (!person) throw new NotFoundError('Persona no encontrada');
      recipient = person.fullName;
      finalContent = finalContent.replace(/\{\{nombre\}\}/gi, person.fullName);
      finalContent = finalContent.replace(/\{\{fecha\}\}/gi, new Date().toLocaleDateString('es-DO'));
      variablesUsed['nombre'] = person.fullName;
    }

    // Reemplazar variables adicionales
    if (customFields) {
      Object.entries(customFields).forEach(([key, val]) => {
        finalContent = finalContent.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'gi'), String(val));
        variablesUsed[key] = String(val);
      });
    }

    const letter = await GeneratedLetter.create({
      churchId: req.churchId,
      templateId: templateId || 'wizard',
      recipientName: recipient || 'Destinatario',
      templateName,
      finalContent,
      variablesUsed,
      generatedBy: { id: req.userId, name: req.user?.fullName || 'Sistema' },
    });

    res.status(201).json({ success: true, data: letter });
  } catch (error) { next(error); }
};

// Descargar carta como PDF
export const downloadLetterPdf = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { content, title, recipientName, churchData } = req.body;
    if (!content) throw new BadRequestError('El contenido es requerido');

    if (typeof content !== 'string') throw new BadRequestError('El contenido debe ser texto');
    const html = renderLetterDocument({content, title, churchData});

    const browser = await puppeteer.launch({
      headless: 'new',
      timeout: 30000,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
      ],
    });
    let pdfBuffer: Uint8Array;
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load', timeout: 15000 });
      pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
    } finally { await browser.close(); }

    const recipientSlug = String(recipientName || 'documento').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 80) || 'documento';
    const filename = `carta-${recipientSlug}-${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(Buffer.from(pdfBuffer));
  } catch (error) { next(error); }
};
