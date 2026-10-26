import { Router } from 'express'
import { authenticate } from '../../middleware/auth.middleware'
import { tenantGuard } from '../../middleware/tenant.middleware'
import { requirePermission, Permission } from '../../middleware/permission.middleware'
import {
  // Categorías
  getCategories,
  seedCategories,
  createCategory,
  // Fondos
  getFunds,
  seedFunds,
  createFund,
  // Transacciones
  getTransactions,
  createTransaction,
  updateTransaction,
  approveTransaction,
  deleteTransaction,
  // Reportes
  getSummary,
  getTithingReport,
  getCouncilReport,
  getOfferingsReport,
  getMonthlyComparison,
  getAnnualReport,
  getDetailedTransactions,
  generateMonthlyPDFReport,
  generateAnnualCouncilReport,
  getMonthlyTithesDetails,
} from './finances.controller'

const router = Router()

// Todas las rutas requieren autenticación + tenant
router.use(authenticate, tenantGuard)

// ============================================
// CATEGORÍAS
// ============================================
router.get('/categories', requirePermission(Permission.FINANCES_VIEW), getCategories)
router.post('/categories/seed', requirePermission(Permission.FINANCES_CREATE), seedCategories)
router.post('/categories', requirePermission(Permission.FINANCES_CREATE), createCategory)

// ============================================
// FONDOS
// ============================================
router.get('/funds', requirePermission(Permission.FINANCES_VIEW), getFunds)
router.post('/funds/seed', requirePermission(Permission.FINANCES_CREATE), seedFunds)
router.post('/funds', requirePermission(Permission.FINANCES_CREATE), createFund)

// ============================================
// TRANSACCIONES
// ============================================
router.get('/transactions', requirePermission(Permission.FINANCES_VIEW), getTransactions)
router.post('/transactions', requirePermission(Permission.FINANCES_CREATE), createTransaction)
router.put('/transactions/:id', requirePermission(Permission.FINANCES_EDIT), updateTransaction)
router.patch('/transactions/:id/approve', requirePermission(Permission.FINANCES_APPROVE), approveTransaction)
router.delete('/transactions/:id', requirePermission(Permission.FINANCES_DELETE), deleteTransaction)

// ============================================
// REPORTES
// ============================================
router.get('/summary', requirePermission(Permission.FINANCES_VIEW), getSummary)
router.get('/reports/tithing', requirePermission(Permission.FINANCES_REPORTS), getTithingReport)
router.get('/reports/council', requirePermission(Permission.FINANCES_REPORTS), getCouncilReport)
router.get('/reports/offerings', requirePermission(Permission.FINANCES_REPORTS), getOfferingsReport)
router.get('/reports/monthly-comparison', requirePermission(Permission.FINANCES_REPORTS), getMonthlyComparison)
router.get('/reports/annual', requirePermission(Permission.FINANCES_REPORTS), getAnnualReport)
router.get('/reports/transactions', requirePermission(Permission.FINANCES_REPORTS), getDetailedTransactions)
router.get('/reports/monthly-pdf', requirePermission(Permission.FINANCES_REPORTS), generateMonthlyPDFReport)
router.get('/reports/council-annual', requirePermission(Permission.FINANCES_REPORTS), generateAnnualCouncilReport)

// Desglose de diezmos (para vista web)
router.get('/tithes-details', requirePermission(Permission.FINANCES_VIEW), getMonthlyTithesDetails)

export default router
