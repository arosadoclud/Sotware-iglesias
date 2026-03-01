import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import Person from '../../models/Person.model';

/**
 * Calcula cuántos días faltan para el próximo cumpleaños de una fecha.
 * Devuelve 0 si es hoy, negativo si ya pasó este año (usa el año siguiente).
 */
function daysUntilBirthday(birthDate: Date): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Próximo cumpleaños este año
  let next = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());

  // Si ya pasó este año, usar el año siguiente
  if (next < today) {
    next = new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
  }

  const diff = next.getTime() - today.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

/**
 * GET /birthdays
 * Devuelve todos los miembros con su fecha de cumpleaños, ordenados por el
 * próximo cumpleaños más cercano.
 */
export const getBirthdays = async (req: AuthRequest, res: Response) => {
  try {
    const churchId = req.churchId;

    const persons = await Person.find({ churchId })
      .select('fullName phone birthDate ministry status')
      .sort({ fullName: 1 })
      .lean();

    const withDays = persons.map((p) => {
      const daysUntil = p.birthDate ? daysUntilBirthday(new Date(p.birthDate)) : null;
      return { ...p, daysUntil };
    });

    // Ordenar: primero los que tienen cumpleaños (por días), luego los sin fecha
    withDays.sort((a, b) => {
      if (a.daysUntil === null && b.daysUntil === null) return 0;
      if (a.daysUntil === null) return 1;
      if (b.daysUntil === null) return -1;
      return a.daysUntil - b.daysUntil;
    });

    res.json({ success: true, data: withDays });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /birthdays/:personId
 * Actualiza la fecha de cumpleaños de una persona.
 */
export const updateBirthday = async (req: AuthRequest, res: Response) => {
  try {
    const churchId = req.churchId;
    const { personId } = req.params;
    const { birthDate } = req.body;

    const person = await Person.findOne({ _id: personId, churchId });
    if (!person) {
      return res.status(404).json({ success: false, message: 'Persona no encontrada' });
    }

    if (birthDate === null || birthDate === '') {
      person.birthDate = undefined;
    } else {
      const parsed = new Date(birthDate);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ success: false, message: 'Fecha inválida' });
      }
      person.birthDate = parsed;
    }

    await person.save();

    const daysUntil = person.birthDate ? daysUntilBirthday(person.birthDate) : null;
    res.json({ success: true, data: { ...person.toObject(), daysUntil } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
