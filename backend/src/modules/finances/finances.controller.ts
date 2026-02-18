// Endpoint: GET /finances/tithes-details?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
export const getMonthlyTithesDetails = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const churchId = req.churchId
    const { startDate, endDate } = req.query
    if (!startDate || !endDate) {
      throw new AppError('startDate y endDate son requeridos', 400)
    }
    // Buscar la categoría de diezmos
    const tithesCategory = await FinanceCategory.findOne({
      church: churchId,
      code: 'ING-01',
      type: 'INCOME',
    })
    if (!tithesCategory) {
      return res.json({ success: true, data: [] })
    }
    // Buscar transacciones de diezmo aprobadas en el rango
    const tithes = await FinanceTransaction.find({
      church: churchId,
      category: tithesCategory._id,
      type: 'INCOME',
      approvalStatus: { $in: ['APPROVED', 'NOT_REQUIRED'] },
      date: { $gte: new Date(startDate as string), $lte: new Date(endDate as string) },
    })
      .populate('person', 'fullName')
      .sort({ date: 1 })
    // Mapear desglose
    const details = tithes.map(t => ({
      date: t.date,
      personName: t.person ? (t.person as any).fullName : 'Anónimo',
      amount: t.amount,
      councilAmount: t.amount * 0.10,
      churchAmount: t.amount * 0.90,
    }))
    res.json({ success: true, data: details })
  } catch (error) {
    next(error)
  }
}
import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/auth.middleware'
import { 
  FinanceTransaction, 
  FinanceCategory, 
  Fund,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_FUNDS,
  APPROVAL_THRESHOLDS
} from '../../models'
import { AppError } from '../../utils/errors'
import mongoose from 'mongoose'
import { Church } from '../../models'
import { generateMonthlyReportPDF, generateAnnualCouncilReportPDF } from './generateFinanceReport'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// ============================================
// CATEGORÍAS
// ============================================

// Obtener todas las categorías
export const getCategories = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const churchId = req.churchId
    const { type, active } = req.query

    const filter: any = { church: churchId }
    if (type) filter.type = type
    if (active !== undefined) filter.isActive = active === 'true'

    const categories = await FinanceCategory.find(filter).sort({ type: 1, code: 1 })
    
    res.json({
      success: true,
      data: categories,
    })
  } catch (error) {
    next(error)
  }
}

// Inicializar categorías predeterminadas
export const seedCategories = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const churchId = req.churchId

    // Verificar si ya existen categorías
    const existingCount = await FinanceCategory.countDocuments({ church: churchId })
    if (existingCount > 0) {
      return res.json({
        success: true,
        message: 'Las categorías ya existen',
        data: await FinanceCategory.find({ church: churchId }).sort({ type: 1, code: 1 }),
      })
    }

    // Crear categorías de ingresos
    const incomeCategories = DEFAULT_INCOME_CATEGORIES.map(cat => ({
      ...cat,
      church: churchId,
      type: 'INCOME' as const,
      isDefault: true,
      isActive: true,
    }))

    // Crear categorías de gastos
    const expenseCategories = DEFAULT_EXPENSE_CATEGORIES.map(cat => ({
      ...cat,
      church: churchId,
      type: 'EXPENSE' as const,
      isDefault: true,
      isActive: true,
    }))

    const allCategories = [...incomeCategories, ...expenseCategories]
    await FinanceCategory.insertMany(allCategories)

    const categories = await FinanceCategory.find({ church: churchId }).sort({ type: 1, code: 1 })
    
    res.json({
      success: true,
      message: 'Categorías creadas correctamente',
      data: categories,
    })
  } catch (error) {
    next(error)
  }
}

// Crear categoría personalizada
export const createCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const churchId = req.churchId
    const { name, code, type, description, color, icon } = req.body

    const category = new FinanceCategory({
      church: churchId,
      name,
      code: code.toUpperCase(),
      type,
      description,
      color,
      icon,
      isDefault: false,
      isActive: true,
    })

    await category.save()
    
    res.status(201).json({
      success: true,
      data: category,
    })
  } catch (error) {
    next(error)
  }
}

// ============================================
// FONDOS
// ============================================

// Obtener todos los fondos
export const getFunds = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const churchId = req.churchId
    const { active } = req.query

    const filter: any = { church: churchId }
    if (active !== undefined) filter.isActive = active === 'true'

    const funds = await Fund.find(filter).sort({ isDefault: -1, name: 1 })
    
    res.json({
      success: true,
      data: funds,
    })
  } catch (error) {
    next(error)
  }
}

// Inicializar fondos predeterminados
export const seedFunds = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const churchId = req.churchId

    // Verificar si ya existen fondos
    const existingCount = await Fund.countDocuments({ church: churchId })
    if (existingCount > 0) {
      return res.json({
        success: true,
        message: 'Los fondos ya existen',
        data: await Fund.find({ church: churchId }).sort({ isDefault: -1, name: 1 }),
      })
    }

    // Crear fondos predeterminados
    const fundsToCreate = DEFAULT_FUNDS.map(fund => ({
      ...fund,
      church: churchId,
      balance: 0,
      isActive: true,
    }))

    await Fund.insertMany(fundsToCreate)

    const funds = await Fund.find({ church: churchId }).sort({ isDefault: -1, name: 1 })
    
    res.json({
      success: true,
      message: 'Fondos creados correctamente',
      data: funds,
    })
  } catch (error) {
    next(error)
  }
}

// Crear fondo personalizado
export const createFund = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const churchId = req.churchId
    const { name, code, description, color, goal, isRestricted } = req.body

    const fund = new Fund({
      church: churchId,
      name,
      code: code.toUpperCase(),
      description,
      color,
      goal,
      isRestricted: isRestricted || false,
      balance: 0,
      isDefault: false,
      isActive: true,
    })

    await fund.save()
    
    res.status(201).json({
      success: true,
      data: fund,
    })
  } catch (error) {
    next(error)
  }
}

// ============================================
// TRANSACCIONES
// ============================================

// Obtener transacciones con filtros y paginación
export const getTransactions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const churchId = req.churchId
    const { 
      type, 
      category, 
      fund, 
      startDate, 
      endDate, 
      person,
      approvalStatus,
      page = '1', 
      limit = '20' 
    } = req.query

    const filter: any = { church: churchId }
    
    if (type) filter.type = type
    if (category) filter.category = category
    if (fund) filter.fund = fund
    if (person) filter.person = person
    if (approvalStatus) filter.approvalStatus = approvalStatus
    
    // Filtro de fechas
    if (startDate || endDate) {
      filter.date = {}
      if (startDate) filter.date.$gte = new Date(startDate as string)
      if (endDate) filter.date.$lte = new Date(endDate as string)
    }

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    const [transactions, total] = await Promise.all([
      FinanceTransaction.find(filter)
        .populate('category', 'name code type color')
        .populate('fund', 'name code color')
        .populate('person', 'fullName')
        .populate('createdBy', 'name')
        .populate('approvedBy', 'name')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      FinanceTransaction.countDocuments(filter),
    ])
    
    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    })
  } catch (error) {
    next(error)
  }
}

// Crear transacción
export const createTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const churchId = req.churchId
    const userId = req.userId
    const { 
      type, 
      category, 
      fund, 
      amount, 
      date, 
      description, 
      person,
      paymentMethod,
      reference,
      notes,
    } = req.body

    // Verificar que la categoría existe y es del tipo correcto
    const categoryDoc = await FinanceCategory.findOne({ _id: category, church: churchId })
    if (!categoryDoc) {
      throw new AppError('Categoría no encontrada', 404)
    }
    if (categoryDoc.type !== type) {
      throw new AppError(`La categoría seleccionada no es de tipo ${type}`, 400)
    }

    // Verificar que el fondo existe
    const fundDoc = await Fund.findOne({ _id: fund, church: churchId })
    if (!fundDoc) {
      throw new AppError('Fondo no encontrado', 404)
    }

    // Determinar si requiere aprobación (solo para gastos)
    let approvalRequired = false
    let approvalStatus: 'NOT_REQUIRED' | 'PENDING' = 'NOT_REQUIRED'
    
    if (type === 'EXPENSE' && amount >= APPROVAL_THRESHOLDS.NO_APPROVAL) {
      approvalRequired = true
      approvalStatus = 'PENDING'
    }

    const transaction = new FinanceTransaction({
      church: churchId,
      type,
      category,
      fund,
      amount,
      date: date || new Date(),
      description,
      person: person || undefined,
      paymentMethod: paymentMethod || 'CASH',
      reference,
      notes,
      approvalRequired,
      approvalStatus,
      createdBy: userId,
    })

    await transaction.save()

    // Actualizar balance del fondo
    if (type === 'INCOME' || (type === 'EXPENSE' && approvalStatus === 'NOT_REQUIRED')) {
      const balanceChange = type === 'INCOME' ? amount : -amount
      await Fund.findByIdAndUpdate(fund, { $inc: { balance: balanceChange } })
    }

    // Poblar datos para respuesta
    await transaction.populate([
      { path: 'category', select: 'name code type color' },
      { path: 'fund', select: 'name code color' },
      { path: 'person', select: 'fullName' },
    ])
    
    res.status(201).json({
      success: true,
      data: transaction,
    })
  } catch (error) {
    next(error)
  }
}

// Aprobar gasto pendiente
export const approveTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const churchId = req.churchId
    const userId = req.userId
    const { id } = req.params
    const { approved, notes } = req.body

    const transaction = await FinanceTransaction.findOne({ _id: id, church: churchId })
    if (!transaction) {
      throw new AppError('Transacción no encontrada', 404)
    }

    if (transaction.approvalStatus !== 'PENDING') {
      throw new AppError('Esta transacción no está pendiente de aprobación', 400)
    }

    transaction.approvalStatus = approved ? 'APPROVED' : 'REJECTED'
    transaction.approvedBy = new mongoose.Types.ObjectId(userId)
    if (notes) transaction.notes = (transaction.notes || '') + '\n[Aprobación] ' + notes

    await transaction.save()

    // Si se aprobó, actualizar balance del fondo
    if (approved) {
      await Fund.findByIdAndUpdate(transaction.fund, { 
        $inc: { balance: -transaction.amount } 
      })
    }

    await transaction.populate([
      { path: 'category', select: 'name code type color' },
      { path: 'fund', select: 'name code color' },
      { path: 'approvedBy', select: 'name' },
    ])
    
    res.json({
      success: true,
      data: transaction,
    })
  } catch (error) {
    next(error)
  }
}

// Eliminar transacción
export const deleteTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const churchId = req.churchId
    const { id } = req.params

    const transaction = await FinanceTransaction.findOne({ _id: id, church: churchId })
    if (!transaction) {
      throw new AppError('Transacción no encontrada', 404)
    }

    // Revertir balance del fondo si la transacción ya había afectado el balance
    if (transaction.type === 'INCOME' || 
        (transaction.type === 'EXPENSE' && transaction.approvalStatus !== 'PENDING')) {
      const balanceChange = transaction.type === 'INCOME' ? -transaction.amount : transaction.amount
      await Fund.findByIdAndUpdate(transaction.fund, { $inc: { balance: balanceChange } })
    }

    await transaction.deleteOne()
    
    res.json({
      success: true,
      message: 'Transacción eliminada correctamente',
    })
  } catch (error) {
    next(error)
  }
}

// Actualizar una transacción existente
export const updateTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const churchId = req.churchId
    const userId = req.userId
    const { id } = req.params
    const { 
      type, 
      category, 
      fund, 
      amount, 
      date, 
      description, 
      person,
      paymentMethod,
      reference,
      notes,
    } = req.body

    // Buscar la transacción existente
    const transaction = await FinanceTransaction.findOne({ _id: id, church: churchId })
    if (!transaction) {
      throw new AppError('Transacción no encontrada', 404)
    }

    // No permitir editar transacciones aprobadas de gastos
    if (transaction.type === 'EXPENSE' && transaction.approvalStatus === 'APPROVED') {
      throw new AppError('No se puede editar una transacción de gasto ya aprobada', 400)
    }

    // Guardar valores antiguos para revertir balance
    const oldAmount = transaction.amount
    const oldType = transaction.type
    const oldFund = transaction.fund
    const oldApprovalStatus = transaction.approvalStatus

    // Verificar nueva categoría si se cambió
    if (category && category !== transaction.category.toString()) {
      const categoryDoc = await FinanceCategory.findOne({ _id: category, church: churchId })
      if (!categoryDoc) {
        throw new AppError('Categoría no encontrada', 404)
      }
      if (type && categoryDoc.type !== type) {
        throw new AppError(`La categoría seleccionada no es de tipo ${type}`, 400)
      }
      transaction.category = category
    }

    // Verificar nuevo fondo si se cambió
    if (fund && fund !== transaction.fund.toString()) {
      const fundDoc = await Fund.findOne({ _id: fund, church: churchId })
      if (!fundDoc) {
        throw new AppError('Fondo no encontrado', 404)
      }
      transaction.fund = fund
    }

    // Actualizar campos
    if (type) transaction.type = type
    if (amount !== undefined) transaction.amount = amount
    if (date) transaction.date = new Date(date)
    if (description !== undefined) transaction.description = description
    if (person !== undefined) transaction.person = person || undefined
    if (paymentMethod) transaction.paymentMethod = paymentMethod
    if (reference !== undefined) transaction.reference = reference
    if (notes !== undefined) transaction.notes = notes

    // Recalcular si requiere aprobación
    if (transaction.type === 'EXPENSE' && transaction.amount >= APPROVAL_THRESHOLDS.NO_APPROVAL) {
      if (!transaction.approvalRequired) {
        transaction.approvalRequired = true
        transaction.approvalStatus = 'PENDING'
      }
    } else if (transaction.type === 'EXPENSE') {
      transaction.approvalRequired = false
      transaction.approvalStatus = 'NOT_REQUIRED'
    }

    // Actualizar quien modificó
    transaction.updatedBy = new mongoose.Types.ObjectId(userId as string)

    // Revertir balance anterior
    if (oldType === 'INCOME' || (oldType === 'EXPENSE' && oldApprovalStatus !== 'PENDING')) {
      const revertChange = oldType === 'INCOME' ? -oldAmount : oldAmount
      await Fund.findByIdAndUpdate(oldFund, { $inc: { balance: revertChange } })
    }

    // Aplicar nuevo balance
    if (transaction.type === 'INCOME' || 
        (transaction.type === 'EXPENSE' && transaction.approvalStatus === 'NOT_REQUIRED')) {
      const newChange = transaction.type === 'INCOME' ? transaction.amount : -transaction.amount
      await Fund.findByIdAndUpdate(transaction.fund, { $inc: { balance: newChange } })
    }

    await transaction.save()

    // Poblar datos para respuesta
    await transaction.populate([
      { path: 'category', select: 'name code type color' },
      { path: 'fund', select: 'name code color' },
      { path: 'person', select: 'fullName' },
      { path: 'createdBy', select: 'firstName lastName' },
      { path: 'updatedBy', select: 'firstName lastName' },
    ])

    res.json({
      success: true,
      data: transaction,
      message: 'Transacción actualizada correctamente',
    })
  } catch (error) {
    next(error)
  }
}

// ============================================
// RESUMEN / DASHBOARD
// ============================================

// Obtener resumen del período
export const getSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const churchId = req.churchId
    const { startDate, endDate } = req.query

    // Por defecto, mes actual
    const now = new Date()
    const start = startDate 
      ? new Date(startDate as string) 
      : new Date(now.getFullYear(), now.getMonth(), 1)
    const end = endDate 
      ? new Date(endDate as string) 
      : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // Resumen por tipo
    const summary = await FinanceTransaction.aggregate([
      {
        $match: {
          church: new mongoose.Types.ObjectId(churchId),
          date: { $gte: start, $lte: end },
          $or: [
            { type: 'INCOME' },
            { type: 'EXPENSE', approvalStatus: { $ne: 'PENDING' } },
          ],
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ])

    // Resumen por categoría
    const byCategory = await FinanceTransaction.aggregate([
      {
        $match: {
          church: new mongoose.Types.ObjectId(churchId),
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'financecategories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $unwind: '$category',
      },
      {
        $project: {
          _id: 1,
          total: 1,
          count: 1,
          name: '$category.name',
          type: '$category.type',
          color: '$category.color',
        },
      },
      {
        $sort: { type: 1, total: -1 },
      },
    ])

    // Fondos actuales
    const funds = await Fund.find({ church: churchId, isActive: true })
      .sort({ isDefault: -1, name: 1 })

    // Gastos pendientes de aprobación
    const pendingExpenses = await FinanceTransaction.countDocuments({
      church: churchId,
      type: 'EXPENSE',
      approvalStatus: 'PENDING',
    })

    // Procesar resumen
    const incomeData = summary.find(s => s._id === 'INCOME') || { total: 0, count: 0 }
    const expenseData = summary.find(s => s._id === 'EXPENSE') || { total: 0, count: 0 }

    res.json({
      success: true,
      data: {
        period: { start, end },
        totals: {
          income: incomeData.total,
          incomeCount: incomeData.count,
          expense: expenseData.total,
          expenseCount: expenseData.count,
          balance: incomeData.total - expenseData.total,
        },
        byCategory,
        funds,
        pendingExpenses,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Reporte de diezmos por persona
export const getTithingReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const churchId = req.churchId
    const { personId, year } = req.query

    const yearNum = year ? parseInt(year as string) : new Date().getFullYear()
    const start = new Date(yearNum, 0, 1)
    const end = new Date(yearNum, 11, 31, 23, 59, 59)

    // Buscar categoría de diezmos
    const tithingCategory = await FinanceCategory.findOne({
      church: churchId,
      code: 'ING-01',
    })

    if (!tithingCategory) {
      throw new AppError('Categoría de diezmos no encontrada', 404)
    }

    const filter: any = {
      church: new mongoose.Types.ObjectId(churchId),
      category: tithingCategory._id,
      date: { $gte: start, $lte: end },
    }

    if (personId) {
      filter.person = new mongoose.Types.ObjectId(personId as string)
    }

    const tithings = await FinanceTransaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$person',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          transactions: {
            $push: {
              date: '$date',
              amount: '$amount',
              paymentMethod: '$paymentMethod',
              reference: '$reference',
            },
          },
        },
      },
      {
        $lookup: {
          from: 'persons',
          localField: '_id',
          foreignField: '_id',
          as: 'person',
        },
      },
      {
        $unwind: { path: '$person', preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 1,
          total: 1,
          count: 1,
          transactions: 1,
          personName: { $ifNull: ['$person.fullName', 'Sin identificar'] },
        },
      },
      {
        $sort: { personName: 1 },
      },
    ])

    res.json({
      success: true,
      data: {
        year: yearNum,
        tithings,
        grandTotal: tithings.reduce((sum, t) => sum + t.total, 0),
      },
    })
  } catch (error) {
    next(error)
  }
}

// Reporte mensual para concilio
export const getCouncilReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const churchId = req.churchId
    const { month, year } = req.query

    const now = new Date()
    const yearNum = year ? parseInt(year as string) : now.getFullYear()
    const monthNum = month ? parseInt(month as string) - 1 : now.getMonth()

    const start = new Date(yearNum, monthNum, 1)
    const end = new Date(yearNum, monthNum + 1, 0, 23, 59, 59)

    // Ingresos del mes
    const income = await FinanceTransaction.aggregate([
      {
        $match: {
          church: new mongoose.Types.ObjectId(churchId),
          type: 'INCOME',
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
        },
      },
      {
        $lookup: {
          from: 'financecategories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $unwind: '$category',
      },
      {
        $project: {
          categoryName: '$category.name',
          categoryCode: '$category.code',
          total: 1,
        },
      },
      { $sort: { categoryCode: 1 } },
    ])

    // Gastos del mes (solo aprobados)
    const expenses = await FinanceTransaction.aggregate([
      {
        $match: {
          church: new mongoose.Types.ObjectId(churchId),
          type: 'EXPENSE',
          date: { $gte: start, $lte: end },
          approvalStatus: { $in: ['NOT_REQUIRED', 'APPROVED'] },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
        },
      },
      {
        $lookup: {
          from: 'financecategories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $unwind: '$category',
      },
      {
        $project: {
          categoryName: '$category.name',
          categoryCode: '$category.code',
          total: 1,
        },
      },
      { $sort: { categoryCode: 1 } },
    ])

    const totalIncome = income.reduce((sum, i) => sum + i.total, 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + e.total, 0)

    // Calcular 10% de diezmos para concilio
    const tithesItem = income.find((i: any) => i.categoryCode === 'ING-01')
    const tithesTotal = tithesItem ? tithesItem.total : 0
    const councilAmount = tithesTotal * 0.10 // 10% para concilio
    const churchAmount = tithesTotal * 0.90 // 90% para iglesia

    res.json({
      success: true,
      data: {
        period: {
          month: monthNum + 1,
          year: yearNum,
          label: start.toLocaleDateString('es', { month: 'long', year: 'numeric' }),
        },
        income,
        expenses,
        totals: {
          income: totalIncome,
          expenses: totalExpenses,
          balance: totalIncome - totalExpenses,
        },
        tithes: {
          total: tithesTotal,
          councilAmount, // 10% para concilio
          churchAmount,  // 90% para iglesia
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

// ============================================
// REPORTES ADICIONALES
// ============================================

// Reporte de ofrendas por tipo de culto/servicio
export const getOfferingsReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const churchId = req.churchId
    const { startDate, endDate } = req.query

    const now = new Date()
    const start = startDate 
      ? new Date(startDate as string) 
      : new Date(now.getFullYear(), now.getMonth(), 1)
    const end = endDate 
      ? new Date(endDate as string) 
      : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // Buscar categoría de ofrendas
    const offeringCategory = await FinanceCategory.findOne({
      church: churchId,
      code: 'ING-02',
    })

    if (!offeringCategory) {
      throw new AppError('Categoría de ofrendas no encontrada', 404)
    }

    // Obtener todas las ofrendas del período
    const offerings = await FinanceTransaction.find({
      church: churchId,
      category: offeringCategory._id,
      date: { $gte: start, $lte: end },
    }).sort({ date: -1 })

    // Agrupar por tipo de culto (extraer del campo description)
    const serviceTypes: Record<string, { total: number; count: number; transactions: any[] }> = {}
    
    for (const offering of offerings) {
      // El tipo de culto está al inicio de la descripción (ej: "Domingo - Mañana - descripción adicional")
      let serviceType = 'Sin especificar'
      if (offering.description) {
        const parts = offering.description.split(' - ')
        if (parts.length > 0) {
          // Mapear valores a etiquetas legibles
          const typeMap: Record<string, string> = {
            'Domingo - Mañana': 'Domingo - Mañana',
            'Domingo - Noche': 'Domingo - Noche',
            'Miércoles': 'Miércoles',
            'Viernes': 'Viernes',
            'Sábado': 'Sábado',
            'Servicio Especial': 'Servicio Especial',
            'Culto de Ayuno': 'Culto de Ayuno',
            'Vigilia': 'Vigilia',
            'Otro': 'Otro',
          }
          const firstPart = parts[0].trim()
          const combinedPart = parts.length >= 2 ? `${parts[0]} - ${parts[1]}`.trim() : firstPart
          serviceType = typeMap[combinedPart] || typeMap[firstPart] || firstPart
        }
      }

      if (!serviceTypes[serviceType]) {
        serviceTypes[serviceType] = { total: 0, count: 0, transactions: [] }
      }
      serviceTypes[serviceType].total += offering.amount
      serviceTypes[serviceType].count += 1
      serviceTypes[serviceType].transactions.push({
        date: offering.date,
        amount: offering.amount,
        paymentMethod: offering.paymentMethod,
        description: offering.description,
      })
    }

    // Convertir a array y ordenar por total
    const byServiceType = Object.entries(serviceTypes)
      .map(([name, data]) => ({
        serviceType: name,
        ...data,
      }))
      .sort((a, b) => b.total - a.total)

    const grandTotal = offerings.reduce((sum, o) => sum + o.amount, 0)

    res.json({
      success: true,
      data: {
        period: { start, end },
        byServiceType,
        grandTotal,
        totalCount: offerings.length,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Reporte comparativo mensual (últimos 12 meses)
export const getMonthlyComparison = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const churchId = req.churchId
    const { months = '12' } = req.query
    const numMonths = Math.min(parseInt(months as string) || 12, 24)

    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth() - numMonths + 1, 1)

    const comparison = await FinanceTransaction.aggregate([
      {
        $match: {
          church: new mongoose.Types.ObjectId(churchId),
          date: { $gte: startDate },
          $or: [
            { type: 'INCOME' },
            { type: 'EXPENSE', approvalStatus: { $in: ['NOT_REQUIRED', 'APPROVED'] } },
          ],
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ])

    // Organizar datos por mes
    const monthlyData: Record<string, { income: number; expense: number; balance: number }> = {}

    for (let i = 0; i < numMonths; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - numMonths + 1 + i, 1)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyData[key] = { income: 0, expense: 0, balance: 0 }
    }

    for (const item of comparison) {
      const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`
      if (monthlyData[key]) {
        if (item._id.type === 'INCOME') {
          monthlyData[key].income = item.total
        } else {
          monthlyData[key].expense = item.total
        }
        monthlyData[key].balance = monthlyData[key].income - monthlyData[key].expense
      }
    }

    // Convertir a array
    const data = Object.entries(monthlyData).map(([key, values]) => {
      const [year, month] = key.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1, 1)
      return {
        key,
        month: date.toLocaleDateString('es', { month: 'short' }),
        year: parseInt(year),
        monthNum: parseInt(month),
        label: date.toLocaleDateString('es', { month: 'short', year: 'numeric' }),
        ...values,
      }
    })

    // Calcular totales y promedios
    const totals = data.reduce(
      (acc, m) => ({
        income: acc.income + m.income,
        expense: acc.expense + m.expense,
        balance: acc.balance + m.balance,
      }),
      { income: 0, expense: 0, balance: 0 }
    )

    const averages = {
      income: totals.income / numMonths,
      expense: totals.expense / numMonths,
      balance: totals.balance / numMonths,
    }

    res.json({
      success: true,
      data: {
        months: data,
        totals,
        averages,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Reporte anual completo
export const getAnnualReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const churchId = req.churchId
    const { year } = req.query

    const yearNum = year ? parseInt(year as string) : new Date().getFullYear()
    const start = new Date(yearNum, 0, 1)
    const end = new Date(yearNum, 11, 31, 23, 59, 59)

    // Ingresos por categoría
    const incomeByCategory = await FinanceTransaction.aggregate([
      {
        $match: {
          church: new mongoose.Types.ObjectId(churchId),
          type: 'INCOME',
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'financecategories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $project: {
          name: '$category.name',
          code: '$category.code',
          color: '$category.color',
          total: 1,
          count: 1,
        },
      },
      { $sort: { code: 1 } },
    ])

    // Gastos por categoría
    const expenseByCategory = await FinanceTransaction.aggregate([
      {
        $match: {
          church: new mongoose.Types.ObjectId(churchId),
          type: 'EXPENSE',
          date: { $gte: start, $lte: end },
          approvalStatus: { $in: ['NOT_REQUIRED', 'APPROVED'] },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'financecategories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $project: {
          name: '$category.name',
          code: '$category.code',
          color: '$category.color',
          total: 1,
          count: 1,
        },
      },
      { $sort: { code: 1 } },
    ])

    // Movimiento por mes
    const monthlyMovement = await FinanceTransaction.aggregate([
      {
        $match: {
          church: new mongoose.Types.ObjectId(churchId),
          date: { $gte: start, $lte: end },
          $or: [
            { type: 'INCOME' },
            { type: 'EXPENSE', approvalStatus: { $in: ['NOT_REQUIRED', 'APPROVED'] } },
          ],
        },
      },
      {
        $group: {
          _id: {
            month: { $month: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
    ])

    // Organizar datos mensuales
    const months: { month: string; income: number; expense: number; balance: number }[] = []
    for (let i = 1; i <= 12; i++) {
      const income = monthlyMovement.find(m => m._id.month === i && m._id.type === 'INCOME')?.total || 0
      const expense = monthlyMovement.find(m => m._id.month === i && m._id.type === 'EXPENSE')?.total || 0
      const date = new Date(yearNum, i - 1, 1)
      months.push({
        month: date.toLocaleDateString('es', { month: 'long' }),
        income,
        expense,
        balance: income - expense,
      })
    }

    const totalIncome = incomeByCategory.reduce((sum, c) => sum + c.total, 0)
    const totalExpense = expenseByCategory.reduce((sum, c) => sum + c.total, 0)

    // Fondos actuales
    const funds = await Fund.find({ church: churchId, isActive: true })
      .select('name code balance color')
      .sort({ isDefault: -1, name: 1 })

    res.json({
      success: true,
      data: {
        year: yearNum,
        incomeByCategory,
        expenseByCategory,
        months,
        totals: {
          income: totalIncome,
          expense: totalExpense,
          balance: totalIncome - totalExpense,
        },
        funds,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Exportar transacciones detalladas
export const getDetailedTransactions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const churchId = req.churchId
    const { startDate, endDate, type, category, fund } = req.query

    const now = new Date()
    const start = startDate 
      ? new Date(startDate as string) 
      : new Date(now.getFullYear(), now.getMonth(), 1)
    const end = endDate 
      ? new Date(endDate as string) 
      : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    const filter: any = {
      church: churchId,
      date: { $gte: start, $lte: end },
    }

    if (type) filter.type = type
    if (category) filter.category = category
    if (fund) filter.fund = fund

    const transactions = await FinanceTransaction.find(filter)
      .populate('category', 'name code type color')
      .populate('fund', 'name code color')
      .populate('person', 'fullName')
      .populate('createdBy', 'fullName')
      .populate('approvedBy', 'fullName')
      .sort({ date: -1, createdAt: -1 })

    // Calcular totales
    const income = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0)
    const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0)

    res.json({
      success: true,
      data: {
        period: { start, end },
        transactions,
        summary: {
          totalTransactions: transactions.length,
          income,
          expense,
          balance: income - expense,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

// ============================================
// REPORTE PDF MENSUAL CON CÁLCULO DE CONCILIO
// ============================================

export const generateMonthlyPDFReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const churchId = req.churchId
    const userId = req.userId
    const { month, year } = req.query

    if (!month || !year) {
      throw new AppError('Mes y año son requeridos', 400)
    }

    // Obtener información de la iglesia
    const church = await Church.findById(churchId)
    if (!church) {
      throw new AppError('Iglesia no encontrada', 404)
    }

    // Calcular fechas del período
    const startDate = new Date(Number(year), Number(month) - 1, 1)
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59, 999)

    // Agregar ingresos por categoría
    const incomeByCategory = await FinanceTransaction.aggregate([
      {
        $match: {
          church: new mongoose.Types.ObjectId(churchId as string),
          type: 'INCOME',
          approvalStatus: { $in: ['APPROVED', 'NOT_REQUIRED'] },
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'financecategories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryInfo',
        },
      },
      {
        $unwind: '$categoryInfo',
      },
      {
        $project: {
          name: '$categoryInfo.name',
          code: '$categoryInfo.code',
          total: 1,
          count: 1,
        },
      },
      {
        $sort: { code: 1 },
      },
    ])

    // Agregar gastos por categoría
    const expenseByCategory = await FinanceTransaction.aggregate([
      {
        $match: {
          church: new mongoose.Types.ObjectId(churchId as string),
          type: 'EXPENSE',
          approvalStatus: { $in: ['APPROVED', 'NOT_REQUIRED'] },
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'financecategories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryInfo',
        },
      },
      {
        $unwind: '$categoryInfo',
      },
      {
        $project: {
          name: '$categoryInfo.name',
          code: '$categoryInfo.code',
          total: 1,
          count: 1,
        },
      },
      {
        $sort: { code: 1 },
      },
    ])

    // Calcular totales
    const totalIncome = incomeByCategory.reduce((sum, cat) => sum + cat.total, 0)
    const totalExpense = expenseByCategory.reduce((sum, cat) => sum + cat.total, 0)

    // Obtener desglose individual de diezmos con información de persona
    const tithesCategoryDoc = await FinanceCategory.findOne({ 
      church: churchId, 
      code: 'ING-01',
      type: 'INCOME'
    })
    
    let tithesDetails = []
    let totalTithes = 0
    let councilDeduction = 0
    
    if (tithesCategoryDoc) {
      const tithesTransactions = await FinanceTransaction.find({
        church: churchId,
        category: tithesCategoryDoc._id,
        type: 'INCOME',
        approvalStatus: { $in: ['APPROVED', 'NOT_REQUIRED'] },
        date: { $gte: startDate, $lte: endDate },
      })
      .populate('person', 'fullName')
      .sort({ date: 1 })

      totalTithes = tithesTransactions.reduce((sum, t) => sum + t.amount, 0)
      councilDeduction = totalTithes * 0.10

      tithesDetails = tithesTransactions.map(t => ({
        date: t.date,
        personName: t.person ? (t.person as any).fullName : 'Anónimo',
        amount: t.amount,
        councilAmount: t.amount * 0.10,
        churchAmount: t.amount * 0.90,
      }))
    }

    // Calcular balance neto (ingreso - gastos)
    const netBalance = totalIncome - totalExpense

    // Obtener información del usuario que genera el reporte
    const user = await mongoose.model('User').findById(userId)
    const generatedBy = user ? `${user.firstName} ${user.lastName}` : 'Sistema'

    // Generar datos para el reporte
    const reportData = {
      church: {
        name: church.name,
        logoUrl: church.logoUrl,
        location: typeof church.address === 'string' ? church.address : (church as any).getFullAddress?.() || '',
        phone: church.phone || '',
      },
      period: {
        month: format(startDate, 'MMMM', { locale: es }),
        year: Number(year),
        startDate,
        endDate,
      },
      incomeByCategory: incomeByCategory.map(cat => ({
        name: cat.name,
        code: cat.code,
        total: cat.total,
        count: cat.count,
      })),
      expenseByCategory: expenseByCategory.map(cat => ({
        name: cat.name,
        code: cat.code,
        total: cat.total,
        count: cat.count,
      })),
      summary: {
        totalIncome,
        totalExpense,
        totalTithes,
        councilDeduction,
        netBalance,
      },
      tithesDetails, // Desglose individual de diezmos con 10% concilio
      generatedBy,
      generatedAt: new Date(),
    }

    // Generar PDF
    const pdfBuffer = await generateMonthlyReportPDF(reportData)

    // Enviar PDF como respuesta
    const fileName = `Reporte-${church.name.replace(/\s+/g, '-')}-${format(startDate, 'MMMM-yyyy', { locale: es })}.pdf`
    
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    res.setHeader('Content-Length', pdfBuffer.length)
    
    res.send(pdfBuffer)
  } catch (error) {
    next(error)
  }
}

// ============================================
// REPORTE ANUAL PARA EL CONCILIO (10% DE DIEZMOS)
// ============================================

export const generateAnnualCouncilReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const churchId = req.churchId
    const userId = req.userId
    const { year } = req.query

    if (!year) {
      throw new AppError('Año es requerido', 400)
    }

    // Obtener información de la iglesia
    const church = await Church.findById(churchId)
    if (!church) {
      throw new AppError('Iglesia no encontrada', 404)
    }

    // Calcular fechas del período anual
    const startDate = new Date(Number(year), 0, 1) // 1 de enero
    const endDate = new Date(Number(year), 11, 31, 23, 59, 59, 999) // 31 de diciembre

    // Buscar la categoría de Diezmos (ING-01)
    const tithesCategory = await FinanceCategory.findOne({ 
      church: churchId, 
      code: 'ING-01',
      type: 'INCOME'
    })

    if (!tithesCategory) {
      throw new AppError('Categoría de Diezmos (ING-01) no encontrada', 404)
    }

    // Obtener todas las transacciones de diezmos del año con información de persona
    const tithesTransactions = await FinanceTransaction.find({
      church: churchId,
      category: tithesCategory._id,
      type: 'INCOME',
      approvalStatus: { $in: ['APPROVED', 'NOT_REQUIRED'] },
      date: { $gte: startDate, $lte: endDate },
    })
    .populate('person', 'fullName')
    .sort({ date: 1 })

    // Calcular total de diezmos del año
    const totalTithesYear = tithesTransactions.reduce((sum, t) => sum + t.amount, 0)

    // Calcular el 10% para el concilio
    const councilAmount = totalTithesYear * 0.10
    const churchRetention = totalTithesYear * 0.90

    // Crear desglose individual de cada diezmo con información de persona
    const tithesDetails = tithesTransactions.map(t => ({
      date: t.date,
      personName: t.person ? (t.person as any).fullName : 'Anónimo',
      amount: t.amount,
      councilAmount: t.amount * 0.10,
      councilPercentage: 10,
      churchAmount: t.amount * 0.90,
      churchPercentage: 90,
    }))

    // Agrupar por mes para mostrar en el reporte
    const monthlyBreakdown = []
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(Number(year), month, 1)
      const monthEnd = new Date(Number(year), month + 1, 0, 23, 59, 59, 999)
      
      const monthTransactions = tithesTransactions.filter(t => 
        t.date >= monthStart && t.date <= monthEnd
      )
      
      const monthTotal = monthTransactions.reduce((sum, t) => sum + t.amount, 0)
      
      monthlyBreakdown.push({
        month: format(monthStart, 'MMMM', { locale: es }),
        monthNumber: month + 1,
        total: monthTotal,
        count: monthTransactions.length,
      })
    }

    // Obtener información del usuario
    const user = await mongoose.model('User').findById(userId)
    const generatedBy = user ? `${user.firstName} ${user.lastName}` : 'Sistema'

    // Generar datos para el reporte
    const reportData = {
      church: {
        name: church.name,
        logoUrl: church.logoUrl,
        location: typeof church.address === 'string' ? church.address : (church as any).getFullAddress?.() || '',
        phone: church.phone || '',
      },
      year: Number(year),
      monthlyBreakdown,
      tithesDetails, // Desglose individual de cada diezmo del año
      summary: {
        totalTithesYear,
        councilAmount,
        councilPercentage: 10,
        churchRetention,
        churchPercentage: 90,
        transactionCount: tithesTransactions.length,
      },
      generatedBy,
      generatedAt: new Date(),
    }

    // Generar PDF
    const pdfBuffer = await generateAnnualCouncilReportPDF(reportData)

    // Enviar PDF como respuesta
    const fileName = `Reporte-Concilio-${church.name.replace(/\s+/g, '-')}-${year}.pdf`
    
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    res.setHeader('Content-Length', pdfBuffer.length)
    
    res.send(pdfBuffer)
  } catch (error) {
    next(error)
  }
}
