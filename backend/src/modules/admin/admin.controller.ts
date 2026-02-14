import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import User, { UserRole } from '../../models/User.model';
import AuditLog from '../../models/AuditLog.model';
import { AuditService, AuditAction, AuditCategory, AuditSeverity } from '../../middleware/audit.middleware';
import { Permission, DEFAULT_ROLE_PERMISSIONS, PERMISSION_DESCRIPTIONS, PERMISSION_CATEGORIES } from '../../config/permissions';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../utils/errors';

/**
 * Obtener todos los usuarios de la iglesia
 */
export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 50, search, role, isActive } = req.query;
    
    const filter: any = { churchId: req.churchId };
    
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (role) {
      filter.role = role;
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const users = await User.find(filter)
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await User.countDocuments(filter);

    // Agregar permisos efectivos a cada usuario
    const usersWithPermissions = users.map(user => ({
      ...user.toObject(),
      effectivePermissions: user.getEffectivePermissions(),
    }));

    res.json({
      success: true,
      data: usersWithPermissions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener un usuario por ID
 */
export const getUserById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ _id: id, churchId: req.churchId })
      .populate('createdBy', 'fullName email');

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        effectivePermissions: user.getEffectivePermissions(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear un nuevo usuario
 */
export const createUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { email, password, fullName, role, permissions, useCustomPermissions } = req.body;

    // Verificar que el email no exista
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new BadRequestError('El email ya está registrado');
    }

    // Verificar que no se cree un SUPER_ADMIN a menos que sea SUPER_ADMIN
    if (role === UserRole.SUPER_ADMIN && req.userRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenError('Solo un Super Admin puede crear otro Super Admin');
    }

    // Crear el usuario
    const user = await User.create({
      churchId: req.churchId,
      email: email.toLowerCase(),
      passwordHash: password,
      fullName,
      role: role || UserRole.VIEWER,
      permissions: permissions || [],
      useCustomPermissions: useCustomPermissions || false,
      createdBy: req.userId,
    });

    // Audit log
    await AuditService.logFromRequest(req, AuditAction.USER_CREATE, AuditCategory.USERS, 'User', {
      resourceId: user._id.toString(),
      resourceName: user.fullName,
      newValue: { email: user.email, role: user.role, fullName: user.fullName },
    });

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: user.getPublicProfile(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar un usuario
 */
export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { fullName, role, isActive, permissions, useCustomPermissions } = req.body;

    const user = await User.findOne({ _id: id, churchId: req.churchId });
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // No permitir editar SUPER_ADMIN a menos que seas SUPER_ADMIN
    if (user.role === UserRole.SUPER_ADMIN && req.userRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenError('No puede modificar un Super Admin');
    }

    // No permitir cambiarse el rol a sí mismo
    if (id === req.userId && role && role !== user.role) {
      throw new BadRequestError('No puede cambiar su propio rol');
    }

    // Guardar valores anteriores para auditoría
    const previousValue = {
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      permissions: user.permissions,
      useCustomPermissions: user.useCustomPermissions,
    };

    // Actualizar campos
    if (fullName) user.fullName = fullName;
    if (role && req.userRole === UserRole.SUPER_ADMIN) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (permissions !== undefined) user.permissions = permissions;
    if (useCustomPermissions !== undefined) user.useCustomPermissions = useCustomPermissions;

    await user.save();

    // Calcular cambios para auditoría
    const changes = AuditService.calculateChanges(
      previousValue,
      { fullName: user.fullName, role: user.role, isActive: user.isActive, permissions: user.permissions, useCustomPermissions: user.useCustomPermissions },
      ['fullName', 'role', 'isActive', 'permissions', 'useCustomPermissions']
    );

    // Audit log
    await AuditService.logFromRequest(req, AuditAction.USER_UPDATE, AuditCategory.USERS, 'User', {
      resourceId: user._id.toString(),
      resourceName: user.fullName,
      previousValue,
      newValue: { fullName: user.fullName, role: user.role, isActive: user.isActive },
      changes,
    });

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: {
        ...user.toObject(),
        effectivePermissions: user.getEffectivePermissions(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar permisos de un usuario
 */
export const updateUserPermissions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { permissions, useCustomPermissions } = req.body;

    const user = await User.findOne({ _id: id, churchId: req.churchId });
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // No permitir editar permisos de SUPER_ADMIN
    if (user.role === UserRole.SUPER_ADMIN && req.userRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenError('No puede modificar permisos de un Super Admin');
    }

    const previousPermissions = user.permissions;
    const previousUseCustom = user.useCustomPermissions;

    user.permissions = permissions || [];
    user.useCustomPermissions = useCustomPermissions ?? true;

    await user.save();

    // Audit log
    await AuditService.logFromRequest(req, AuditAction.USER_PERMISSION_CHANGE, AuditCategory.USERS, 'User', {
      resourceId: user._id.toString(),
      resourceName: user.fullName,
      previousValue: { permissions: previousPermissions, useCustomPermissions: previousUseCustom },
      newValue: { permissions: user.permissions, useCustomPermissions: user.useCustomPermissions },
      severity: AuditSeverity.WARNING,
    });

    res.json({
      success: true,
      message: 'Permisos actualizados exitosamente',
      data: {
        ...user.toObject(),
        effectivePermissions: user.getEffectivePermissions(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cambiar contraseña de un usuario (admin)
 */
export const resetUserPassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestError('La contraseña debe tener al menos 6 caracteres');
    }

    const user = await User.findOne({ _id: id, churchId: req.churchId });
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // No permitir cambiar contraseña de SUPER_ADMIN a menos que seas SUPER_ADMIN
    if (user.role === UserRole.SUPER_ADMIN && req.userRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenError('No puede cambiar la contraseña de un Super Admin');
    }

    user.passwordHash = newPassword;
    await user.save();

    // Audit log
    await AuditService.logFromRequest(req, AuditAction.PASSWORD_CHANGE, AuditCategory.USERS, 'User', {
      resourceId: user._id.toString(),
      resourceName: user.fullName,
      metadata: { changedByAdmin: true },
      severity: AuditSeverity.WARNING,
    });

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar un usuario (soft delete - desactivar)
 */
export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (id === req.userId) {
      throw new BadRequestError('No puede eliminarse a sí mismo');
    }

    const user = await User.findOne({ _id: id, churchId: req.churchId });
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // No permitir eliminar SUPER_ADMIN
    if (user.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenError('No puede eliminar un Super Admin');
    }

    // Soft delete
    user.isActive = false;
    await user.save();

    // Audit log
    await AuditService.logFromRequest(req, AuditAction.USER_DELETE, AuditCategory.USERS, 'User', {
      resourceId: user._id.toString(),
      resourceName: user.fullName,
      previousValue: { email: user.email, role: user.role, fullName: user.fullName },
      severity: AuditSeverity.WARNING,
    });

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Activar un usuario
 */
export const activateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ _id: id, churchId: req.churchId });
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    user.isActive = true;
    await user.save();

    // Audit log
    await AuditService.logFromRequest(req, AuditAction.USER_ACTIVATE, AuditCategory.USERS, 'User', {
      resourceId: user._id.toString(),
      resourceName: user.fullName,
    });

    res.json({
      success: true,
      message: 'Usuario activado exitosamente',
      data: user.getPublicProfile(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener logs de auditoría
 */
export const getAuditLogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      action,
      category,
      startDate,
      endDate,
      resourceType,
      severity,
    } = req.query;

    const filter: any = { churchId: req.churchId };

    if (userId) filter.userId = userId;
    if (action) filter.action = action;
    if (category) filter.category = category;
    if (resourceType) filter.resourceType = resourceType;
    if (severity) filter.severity = severity;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await AuditLog.countDocuments(filter);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener estadísticas de auditoría
 */
export const getAuditStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    // Acciones por categoría
    const byCategory = await AuditLog.aggregate([
      { $match: { churchId: req.user!.churchId, createdAt: { $gte: startDate } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Acciones por usuario
    const byUser = await AuditLog.aggregate([
      { $match: { churchId: req.user!.churchId, createdAt: { $gte: startDate } } },
      { $group: { _id: { id: '$userId', name: '$userName' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Acciones por día
    const byDay = await AuditLog.aggregate([
      { $match: { churchId: req.user!.churchId, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Total de logs
    const total = await AuditLog.countDocuments({
      churchId: req.churchId,
      createdAt: { $gte: startDate },
    });

    res.json({
      success: true,
      data: {
        total,
        byCategory,
        byUser,
        byDay,
        period: { days: Number(days), startDate, endDate: new Date() },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener lista de permisos disponibles
 */
export const getAvailablePermissions = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const permissions = Object.values(Permission).map(p => ({
      value: p,
      ...PERMISSION_DESCRIPTIONS[p],
    }));

    // Agrupar por categoría
    const grouped: Record<string, any[]> = {};
    for (const perm of permissions) {
      if (!grouped[perm.category]) {
        grouped[perm.category] = [];
      }
      grouped[perm.category].push(perm);
    }

    res.json({
      success: true,
      data: {
        permissions,
        grouped,
        categories: PERMISSION_CATEGORIES,
        defaultRolePermissions: DEFAULT_ROLE_PERMISSIONS,
        roles: Object.values(UserRole),
      },
    });
  } catch (error) {
    next(error);
  }
};
