import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import Person from '../../models/Person.model';
import User from '../../models/User.model';
import mongoose from 'mongoose';

export const getPersons = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, ministry, search, roleId } = req.query;
    const filter: any = { churchId: req.churchId };

    if (status) filter.status = status;
    if (ministry) filter.ministry = ministry;
    if (search) filter.fullName = { $regex: search, $options: 'i' };
    if (roleId) filter['roles.roleId'] = roleId;

    // Paginación
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '10', 10);
    const skip = (page - 1) * limit;

    // Proyección de campos
    const projection = 'firstName lastName fullName phone email ministry status priority roles userId createdAt';

    const [persons, total] = await Promise.all([
      Person.find(filter)
        .select(projection)
        .sort({ fullName: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),  // Objetos planos (más rápido)
      Person.countDocuments(filter)
    ]);

    console.log('📋 GET PERSONS - Resultados:');
    console.log('  Total personas encontradas:', total);
    console.log('  Personas en esta página:', persons.length);
    console.log('  Filtros aplicados:', JSON.stringify({ status, ministry, search, roleId }));
    if (roleId) {
      console.log('  🎯 Filtro por rol aplicado. Personas con ese rol:');
      persons.forEach(p => {
        console.log(`    - ${p.fullName}: ${p.roles.length} roles`);
        p.roles.forEach((r: any) => console.log(`       • ${r.roleName}`));
      });
    }

    res.json({
      success: true,
      data: persons,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) { next(error); }
};

export const getPerson = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const person = await Person.findOne({ _id: req.params.id, churchId: req.churchId }).populate('userId', 'fullName email role isActive');
    if (!person) return res.status(404).json({ success: false, message: 'Persona no encontrada' });
    res.json({ success: true, data: person });
  } catch (error) { next(error); }
};

export const createPerson = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    console.log('\n🆕 CREATE PERSON - Datos recibidos:');
    console.log('  Body completo:', JSON.stringify(req.body, null, 2));
    console.log('  Roles en body:', req.body.roles);
    console.log('  RoleIds en body:', req.body.roleIds);
    
    const { userId: _ignoredUserId, churchId: _ignoredChurchId, ...personData } = req.body;
    const person = await Person.create({ ...personData, churchId: req.churchId });
    
    console.log('  ✅ Person creada:');
    console.log('  Nombre:', person.fullName);
    console.log('  Roles después de crear:', person.roles);
    console.log('  Cantidad de roles:', person.roles.length);
    
    res.status(201).json({ success: true, data: person });
  } catch (error) {
    console.error('❌ Error al crear persona:', error);
    next(error);
  }
};

export const updatePerson = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    console.log('\n📝 UPDATE PERSON - Datos recibidos:');
    console.log('  Person ID:', req.params.id);
    console.log('  Body completo:', JSON.stringify(req.body, null, 2));
    console.log('  Roles en body:', req.body.roles);
    console.log('  RoleIds en body:', req.body.roleIds);
    
    const { userId: _ignoredUserId, churchId: _ignoredChurchId, ...personData } = req.body;
    const person = await Person.findOneAndUpdate(
      { _id: req.params.id, churchId: req.churchId },
      personData,
      { new: true, runValidators: true }
    );
    
    if (!person) return res.status(404).json({ success: false, message: 'Persona no encontrada' });
    
    console.log('  ✅ Person actualizada:');
    console.log('  Nombre:', person.fullName);
    console.log('  Roles después de actualizar:', person.roles);
    console.log('  Cantidad de roles:', person.roles.length);
    
    res.json({ success: true, data: person });
  } catch (error) { 
    console.error('❌ Error al actualizar persona:', error);
    next(error); 
  }
};

export const deletePerson = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const person = await Person.findOneAndDelete({ _id: req.params.id, churchId: req.churchId });
    if (!person) return res.status(404).json({ success: false, message: 'Persona no encontrada' });
    res.json({ success: true, message: 'Persona eliminada' });
  } catch (error) { next(error); }
};

// GET /persons/ministries - obtener ministerios únicos
export const getMinistries = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ministries = await Person.distinct('ministry', { churchId: req.churchId, ministry: { $nin: [null, ''] } });
    res.json({ success: true, data: ministries.filter(Boolean).sort() });
  } catch (error) { next(error); }
};

export const getAvailableUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [users, linked] = await Promise.all([
      User.find({ churchId: req.churchId }).select('fullName email role isActive').sort({ fullName: 1 }).lean(),
      Person.find({ churchId: req.churchId, userId: { $exists: true, $ne: null } }).select('userId').lean()
    ]);
    const taken = new Set(linked.map(person => String(person.userId)));
    res.json({ success: true, data: users.filter(user => !taken.has(String(user._id))) });
  } catch (error) { next(error); }
};

export const linkPersonUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.body;
    if (userId !== null && (typeof userId !== 'string' || !mongoose.isValidObjectId(userId))) {
      return res.status(400).json({ success: false, message: 'Usuario inválido' });
    }
    const person = await Person.findOne({ _id: req.params.id, churchId: req.churchId });
    if (!person) return res.status(404).json({ success: false, message: 'Persona no encontrada' });
    if (userId) {
      const user = await User.findOne({ _id: userId, churchId: req.churchId });
      if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado en esta iglesia' });
      const existing = await Person.findOne({ churchId: req.churchId, userId, _id: { $ne: person._id } });
      if (existing) return res.status(409).json({ success: false, message: 'Este usuario ya está vinculado a otra persona' });
    }
    person.userId = userId ? new mongoose.Types.ObjectId(userId) : undefined;
    await person.save();
    await person.populate('userId', 'fullName email role isActive');
    res.json({ success: true, data: person });
  } catch (error) { next(error); }
};
