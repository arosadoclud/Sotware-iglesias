import { Response, NextFunction } from 'express';
import Attendance, { ServiceType } from '../../models/Attendance.model';
import Person from '../../models/Person.model';
import { AuthRequest } from '../../middleware/auth.middleware';

// ── GET ALL ──────────────────────────────────────────────────────────────────
export const getAttendances = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const churchId = req.user!.churchId;
    const { serviceType, from, to, page = 1, limit = 20 } = req.query;

    const filter: any = { churchId };
    if (serviceType) filter.serviceType = serviceType;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from as string);
      if (to)   filter.date.$lte = new Date(to as string);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      Attendance.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Attendance.countDocuments(filter),
    ]);

    res.json({ success: true, data, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
};

// ── GET ONE ──────────────────────────────────────────────────────────────────
export const getAttendance = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const record = await Attendance.findOne({
      _id: req.params.id,
      churchId: req.user!.churchId,
    });
    if (!record) return res.status(404).json({ success: false, message: 'Registro no encontrado' });
    res.json({ success: true, data: record });
  } catch (err) { next(err); }
};

// ── CREATE ───────────────────────────────────────────────────────────────────
export const createAttendance = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const churchId = req.user!.churchId;
    const { serviceType, date, attendees, guestCount, notes } = req.body;

    // Verificar si ya existe un registro para ese culto y fecha
    const existing = await Attendance.findOne({ churchId, serviceType, date: new Date(date) });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un registro de asistencia para ese culto y fecha',
        data: existing,
      });
    }

    const record = await Attendance.create({
      churchId,
      serviceType,
      date: new Date(date),
      attendees: attendees || [],
      guestCount: guestCount || 0,
      notes,
      createdBy: req.user!.email,
    });

    res.status(201).json({ success: true, data: record });
  } catch (err) { next(err); }
};

// ── UPDATE ───────────────────────────────────────────────────────────────────
export const updateAttendance = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { attendees, guestCount, notes } = req.body;

    const record = await Attendance.findOneAndUpdate(
      { _id: req.params.id, churchId: req.user!.churchId },
      { $set: { attendees, guestCount, notes } },
      { new: true, runValidators: true }
    );

    if (!record) return res.status(404).json({ success: false, message: 'Registro no encontrado' });
    res.json({ success: true, data: record });
  } catch (err) { next(err); }
};

// ── DELETE ───────────────────────────────────────────────────────────────────
export const deleteAttendance = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const record = await Attendance.findOneAndDelete({
      _id: req.params.id,
      churchId: req.user!.churchId,
    });
    if (!record) return res.status(404).json({ success: false, message: 'Registro no encontrado' });
    res.json({ success: true, message: 'Registro eliminado' });
  } catch (err) { next(err); }
};

// ── STATS ────────────────────────────────────────────────────────────────────
export const getAttendanceStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const churchId = req.user!.churchId;
    const { from, to } = req.query;

    const dateFilter: any = {};
    if (from) dateFilter.$gte = new Date(from as string);
    if (to)   dateFilter.$lte = new Date(to as string);

    const filter: any = { churchId };
    if (from || to) filter.date = dateFilter;

    const records = await Attendance.find(filter).lean();

    // Totales por tipo de culto
    const byService: Record<string, { totalServices: number; totalPresent: number; totalMembers: number; avgAttendance: number }> = {};

    for (const sType of Object.values(ServiceType)) {
      const serviceRecords = records.filter((r) => r.serviceType === sType);
      const totalServices = serviceRecords.length;
      const totalPresent  = serviceRecords.reduce((acc, r) => acc + r.attendees.filter((a) => a.present).length, 0);
      const totalMembers  = serviceRecords.reduce((acc, r) => acc + r.attendees.length, 0);
      byService[sType] = {
        totalServices,
        totalPresent,
        totalMembers,
        avgAttendance: totalServices > 0 ? Math.round(totalPresent / totalServices) : 0,
      };
    }

    // Tendencia general (últimos registros)
    const recentRecords = await Attendance.find({ churchId })
      .sort({ date: -1 })
      .limit(10)
      .lean();

    res.json({ success: true, data: { byService, recentRecords, totalRecords: records.length } });
  } catch (err) { next(err); }
};

// ── PREPARAR LISTA DE MIEMBROS PARA PASAR ASISTENCIA ────────────────────────
export const getMembersForAttendance = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const churchId = req.user!.churchId;
    const { serviceType, date } = req.query;

    // Obtener todos los miembros activos de la iglesia
    // Se acepta 'ACTIVO', 'activo', 'ACTIVE', 'active' (o sin filtro de estado para máxima compatibilidad)
    const persons = await Person.find({
      churchId,
      $or: [
        { status: { $regex: /^activo$/i } },
        { status: { $regex: /^active$/i } },
        { status: { $exists: false } },
        { status: '' },
      ],
    })
      .select('fullName ministry status')
      .sort({ fullName: 1 })
      .lean();

    // Si ya existe un registro para ese culto y fecha, devolver los datos existentes
    let existingRecord = null;
    if (serviceType && date) {
      existingRecord = await Attendance.findOne({
        churchId,
        serviceType: serviceType as ServiceType,
        date: new Date(date as string),
      });
    }

    // Construir lista base con todos los miembros
    const attendeeList = persons.map((p) => {
      const existing = existingRecord?.attendees.find(
        (a) => a.personId?.toString() === p._id.toString()
      );
      return {
        personId: p._id,
        personName: p.fullName,
        ministry: p.ministry,
        // null = aún no marcado (nuevo registro); true/false = ya marcado en historial existente
        present: existing ? existing.present : null,
        notes: existing?.notes || '',
      };
    });

    res.json({
      success: true,
      data: attendeeList,
      existingRecordId: existingRecord?._id || null,
      guestCount: existingRecord?.guestCount || 0,
      recordNotes: existingRecord?.notes || '',
    });
  } catch (err) { next(err); }
};
