import { Router } from 'express'
import { authenticate } from '../../middleware/auth.middleware'
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
} from './finances.controller'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authenticate)

// ============================================
// CATEGORÍAS
// ============================================
router.get('/categories', getCategories)
router.post('/categories/seed', seedCategories)
router.post('/categories', createCategory)

// ============================================
// FONDOS
// ============================================
router.get('/funds', getFunds)
router.post('/funds/seed', seedFunds)
router.post('/funds', createFund)

// ============================================
// TRANSACCIONES
// ============================================
router.get('/transactions', getTransactions)
router.post('/transactions', createTransaction)
router.patch('/transactions/:id/approve', approveTransaction)
router.delete('/transactions/:id', deleteTransaction)

// ============================================
// REPORTES
// ============================================
router.get('/summary', getSummary)
router.get('/reports/tithing', getTithingReport)
router.get('/reports/council', getCouncilReport)
router.get('/reports/offerings', getOfferingsReport)
router.get('/reports/monthly-comparison', getMonthlyComparison)
router.get('/reports/annual', getAnnualReport)
router.get('/reports/transactions', getDetailedTransactions)

export default router
