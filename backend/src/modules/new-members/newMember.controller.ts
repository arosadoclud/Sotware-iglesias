import { Response, NextFunction } from 'express';
import NewMember from '../../models/NewMember.model';
import Person from '../../models/Person.model';
import { AuthRequest } from '../../middleware/auth.middleware';

// ── GET ALL ──────────────────────────────────────────────────────────────────
export const getNewMembers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const churchId = req.user!.churchId;
    const { phase, isActive, search, page = 1, limit = 50 } = req.query;

    const filter: any = { churchId };
    if (phase) filter.phase = phase;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) filter.fullName = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      NewMember.find(filter)
        .sort({ firstVisitDate: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      NewMember.countDocuments(filter),
    ]);

    res.json({ success: true, data, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
};

// ── GET ONE ──────────────────────────────────────────────────────────────────
export const getNewMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const member = await NewMember.findOne({
      _id: req.params.id,
      churchId: req.user!.churchId,
    }).lean();
    if (!member) return res.status(404).json({ success: false, message: 'Miembro no encontrado' });
    res.json({ success: true, data: member });
  } catch (err) { next(err); }
};

// ── CREATE ───────────────────────────────────────────────────────────────────
export const createNewMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const member = await NewMember.create({
      ...req.body,
      churchId: req.user!.churchId,
    });
    res.status(201).json({ success: true, data: member });
  } catch (err) { next(err); }
};

// ── UPDATE ───────────────────────────────────────────────────────────────────
export const updateNewMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const member = await NewMember.findOneAndUpdate(
      { _id: req.params.id, churchId: req.user!.churchId },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!member) return res.status(404).json({ success: false, message: 'Miembro no encontrado' });
    res.json({ success: true, data: member });
  } catch (err) { next(err); }
};

// ── DELETE ───────────────────────────────────────────────────────────────────
export const deleteNewMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const member = await NewMember.findOneAndDelete({
      _id: req.params.id,
      churchId: req.user!.churchId,
    });
    if (!member) return res.status(404).json({ success: false, message: 'Miembro no encontrado' });
    res.json({ success: true, message: 'Eliminado' });
  } catch (err) { next(err); }
};

// ── ADD FOLLOW-UP ENTRY ──────────────────────────────────────────────────────
export const addFollowUp = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type, note, madeBy, whatsappSent } = req.body;
    const member = await NewMember.findOneAndUpdate(
      { _id: req.params.id, churchId: req.user!.churchId },
      {
        $push: {
          followUpHistory: { date: new Date(), type, note, madeBy, whatsappSent },
        },
      },
      { new: true, runValidators: true }
    );
    if (!member) return res.status(404).json({ success: false, message: 'No encontrado' });
    res.json({ success: true, data: member });
  } catch (err) { next(err); }
};

// ── UPDATE PHASE ─────────────────────────────────────────────────────────────
export const updatePhase = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { phase } = req.body;
    const member = await NewMember.findOneAndUpdate(
      { _id: req.params.id, churchId: req.user!.churchId },
      { $set: { phase } },
      { new: true }
    );
    if (!member) return res.status(404).json({ success: false, message: 'No encontrado' });
    res.json({ success: true, data: member });
  } catch (err) { next(err); }
};

// ── SCHEDULE ALERT ───────────────────────────────────────────────────────────
export const scheduleAlert = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { scheduledDate, message, type } = req.body;
    const member = await NewMember.findOneAndUpdate(
      { _id: req.params.id, churchId: req.user!.churchId },
      {
        $push: {
          scheduledAlerts: { scheduledDate, message, type: type || 'INTERNAL', sent: false },
        },
      },
      { new: true }
    );
    if (!member) return res.status(404).json({ success: false, message: 'No encontrado' });
    res.json({ success: true, data: member });
  } catch (err) { next(err); }
};

// ── DELETE ALERT ─────────────────────────────────────────────────────────────
export const deleteAlert = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const member = await NewMember.findOneAndUpdate(
      { _id: req.params.id, churchId: req.user!.churchId },
      { $pull: { scheduledAlerts: { _id: req.params.alertId } } },
      { new: true }
    );
    if (!member) return res.status(404).json({ success: false, message: 'No encontrado' });
    res.json({ success: true, data: member });
  } catch (err) { next(err); }
};

// ── CONVERT TO PERSON ────────────────────────────────────────────────────────
export const convertToPerson = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const member = await NewMember.findOne({
      _id: req.params.id,
      churchId: req.user!.churchId,
    });
    if (!member) return res.status(404).json({ success: false, message: 'No encontrado' });
    if (member.convertedToPersonId) {
      return res.status(400).json({ success: false, message: 'Ya fue convertido a miembro' });
    }

    // Crear persona con datos del nuevo miembro
    const person = await Person.create({
      churchId: req.user!.churchId,
      fullName: member.fullName,
      phone: member.phone,
      email: member.email,
      ministry: req.body.ministry || undefined,
      notes: `Integrado desde seguimiento. ${member.notes || ''}`.trim(),
      status: 'ACTIVO',
      priority: 5,
    });

    member.convertedToPersonId = person._id;
    member.phase = 'INTEGRATED' as any;
    await member.save();

    res.json({ success: true, data: { member, person } });
  } catch (err) { next(err); }
};

// ── GET STATS ────────────────────────────────────────────────────────────────
export const getNewMemberStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const churchId = req.user!.churchId;

    const [byPhase, thisMonth, pendingAlerts] = await Promise.all([
      NewMember.aggregate([
        { $match: { churchId: new (mongoose as any).Types.ObjectId(churchId), isActive: true } },
        { $group: { _id: '$phase', count: { $sum: 1 } } },
      ]),
      NewMember.countDocuments({
        churchId,
        isActive: true,
        firstVisitDate: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      }),
      NewMember.aggregate([
        { $match: { churchId: new (mongoose as any).Types.ObjectId(churchId) } },
        { $unwind: '$scheduledAlerts' },
        {
          $match: {
            'scheduledAlerts.sent': false,
            'scheduledAlerts.scheduledDate': { $lte: new Date() },
          },
        },
        { $count: 'total' },
      ]),
    ]);

    const phaseMap: Record<string, number> = {};
    byPhase.forEach((p: any) => { phaseMap[p._id] = p.count; });

    res.json({
      success: true,
      data: {
        total: Object.values(phaseMap).reduce((a, b) => a + b, 0),
        byPhase: phaseMap,
        thisMonth,
        pendingAlerts: pendingAlerts[0]?.total || 0,
      },
    });
  } catch (err) { next(err); }
};

// ── SEND WHATSAPP MESSAGE ────────────────────────────────────────────────────
export const sendWhatsAppMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const member = await NewMember.findOne({
      _id: req.params.id,
      churchId: req.user!.churchId,
    });
    if (!member) return res.status(404).json({ success: false, message: 'No encontrado' });
    if (!member.phone) return res.status(400).json({ success: false, message: 'El miembro no tiene teléfono' });

    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'El mensaje es requerido' });

    // Limpiar número de teléfono
    const cleanPhone = member.phone.replace(/[^0-9+]/g, '');

    // Generar URL de WhatsApp
    const whatsappUrl = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(message)}`;

    // Registrar en historial
    member.followUpHistory.push({
      date: new Date(),
      type: 'WHATSAPP',
      note: message,
      madeBy: req.user!.fullName || 'Sistema',
      whatsappSent: true,
    } as any);
    await member.save();

    res.json({
      success: true,
      data: {
        whatsappUrl,
        phone: cleanPhone,
        message,
      },
    });
  } catch (err) { next(err); }
};

// Importar mongoose para ObjectId en aggregation
import mongoose from 'mongoose';
