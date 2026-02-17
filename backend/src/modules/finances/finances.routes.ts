import { Router } from 'express'
import { authenticate } from '../../middleware/auth.middleware'
import { tenantGuard } from '../../middleware/tenant.middleware'
import { rbac } from '../../middleware/rbac.middleware'
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
router.get('/categories', rbac('finances', 'read'), getCategories)
router.post('/categories/seed', rbac('finances', 'create'), seedCategories)
router.post('/categories', rbac('finances', 'create'), createCategory)

// ============================================
// FONDOS
// ============================================
router.get('/funds', rbac('finances', 'read'), getFunds)
router.post('/funds/seed', rbac('finances', 'create'), seedFunds)
router.post('/funds', rbac('finances', 'create'), createFund)

// ============================================
// TRANSACCIONES
// ============================================
router.get('/transactions', rbac('finances', 'read'), getTransactions)
router.post('/transactions', rbac('finances', 'create'), createTransaction)
router.put('/transactions/:id', rbac('finances', 'update'), updateTransaction)
router.patch('/transactions/:id/approve', rbac('finances', 'update'), approveTransaction)
router.delete('/transactions/:id', rbac('finances', 'delete'), deleteTransaction)

// ============================================
// REPORTES
// ============================================
router.get('/summary', rbac('finances', 'read'), getSummary)
router.get('/reports/tithing', rbac('finances', 'read'), getTithingReport)
router.get('/reports/council', rbac('finances', 'read'), getCouncilReport)
router.get('/reports/offerings', rbac('finances', 'read'), getOfferingsReport)
router.get('/reports/monthly-comparison', rbac('finances', 'read'), getMonthlyComparison)
router.get('/reports/annual', rbac('finances', 'read'), getAnnualReport)
router.get('/reports/transactions', rbac('finances', 'read'), getDetailedTransactions)
router.get('/reports/monthly-pdf', rbac('finances', 'read'), generateMonthlyPDFReport)
router.get('/reports/council-annual', rbac('finances', 'read'), generateAnnualCouncilReport)

// Desglose de diezmos (para vista web)
router.get('/tithes-details', rbac('finances', 'read'), getMonthlyTithesDetails)

export default router
