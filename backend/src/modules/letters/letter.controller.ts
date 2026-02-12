import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import LetterTemplate from '../../models/LetterTemplate.model';
import GeneratedLetter from '../../models/GeneratedLetter.model';
import Person from '../../models/Person.model';
import { NotFoundError, BadRequestError } from '../../utils/errors';

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

export const generateLetter = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { templateId, personId, customFields } = req.body;
    if (!templateId || !personId) throw new BadRequestError('templateId y personId son requeridos');

    const [template, person] = await Promise.all([
      LetterTemplate.findOne({ _id: templateId, churchId: req.churchId }),
      Person.findOne({ _id: personId, churchId: req.churchId }),
    ]);
    if (!template) throw new NotFoundError('Plantilla no encontrada');
    if (!person) throw new NotFoundError('Persona no encontrada');

    // Reemplazar variables en el template
    let content = template.content || '';
    content = content.replace(/\{\{nombre\}\}/gi, person.fullName);
    content = content.replace(/\{\{fecha\}\}/gi, new Date().toLocaleDateString('es-DO'));
    if (customFields) {
      Object.entries(customFields).forEach(([key, val]) => {
        content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'gi'), String(val));
      });
    }

    const letter = await GeneratedLetter.create({
      churchId: req.churchId,
      templateId,
      personId,
      personName: person.fullName,
      templateName: template.name,
      content,
      generatedBy: { id: req.userId, name: req.user?.fullName || 'Sistema' },
    });

    res.status(201).json({ success: true, data: letter });
  } catch (error) { next(error); }
};
