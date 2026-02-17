import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from 'sonner'
import { useAuthStore } from './store/authStore'
import AuthLayout from './components/layout/AuthLayout'
import DashboardLayout from './components/layout/DashboardLayout'
import SplashScreen from './components/ui/SplashScreen'
import PageTransition from './components/ui/PageTransition'
import { ProtectedModuleRoute } from './components/ui/ProtectedModuleRoute'
import { PermissionRoute } from './components/ui/PermissionRoute'
import { P } from './constants/permissions'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PersonsPage from './pages/persons/PersonsPage'
import PersonDetailPage from './pages/persons/PersonDetailPage'
import ActivityTypesPage from './pages/activities/ActivityTypesPage'
import ProgramsPage from './pages/programs/ProgramsPage'
import GenerateProgramPage from './pages/programs/GenerateProgramPage'
import ProgramEditPage from './pages/programs/ProgramEditPage'
import FlyerPreviewPage from './pages/programs/FlyerPreviewPage'
import BatchReviewPage from './pages/programs/BatchReviewPage'
import WhatsAppWizardPage from './pages/programs/WhatsAppWizardPage'
import CalendarPage from './pages/CalendarPage'
import LetterWizardPage from './pages/letters/LetterWizardPage'
import { FinancesPage, FinanceReportsPage } from './pages/finances'
import SettingsPage from './pages/SettingsPage'
import NewMembersPage from './pages/new-members/NewMembersPage'
import UsersManagementPage from './pages/admin/UsersManagementPage'
import AuditLogsPage from './pages/admin/AuditLogsPage'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

// Animated Routes component to handle page transitions
const AnimatedRoutes = () => {
  const location = useLocation()
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={
            <PageTransition><LoginPage /></PageTransition>
          } />
        </Route>
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/" element={
            <PageTransition><DashboardPage /></PageTransition>
          } />
          <Route path="/persons" element={
            <PageTransition><PersonsPage /></PageTransition>
          } />
          <Route path="/persons/:id" element={
            <PageTransition><PersonDetailPage /></PageTransition>
          } />
          <Route path="/activities" element={
            <PageTransition><ActivityTypesPage /></PageTransition>
          } />
          <Route path="/programs" element={
            <PageTransition><ProgramsPage /></PageTransition>
          } />
          <Route path="/programs/generate" element={
            <PermissionRoute permissions={[P.PROGRAMS_CREATE, P.PROGRAMS_GENERATE]}>
              <PageTransition><GenerateProgramPage /></PageTransition>
            </PermissionRoute>
          } />
          <Route path="/programs/:id/edit" element={
            <PermissionRoute permissions={P.PROGRAMS_EDIT}>
              <PageTransition><ProgramEditPage /></PageTransition>
            </PermissionRoute>
          } />
          <Route path="/programs/:id/flyer" element={
            <PageTransition><FlyerPreviewPage /></PageTransition>
          } />
          <Route path="/programs/batch-review" element={
            <PermissionRoute permissions={[P.PROGRAMS_CREATE, P.PROGRAMS_BATCH]}>
              <PageTransition><BatchReviewPage /></PageTransition>
            </PermissionRoute>
          } />
          <Route path="/programs/share-whatsapp" element={
            <PageTransition><WhatsAppWizardPage /></PageTransition>
          } />
          <Route path="/calendar" element={
            <PageTransition><CalendarPage /></PageTransition>
          } />
          <Route path="/new-members" element={
            <PageTransition><NewMembersPage /></PageTransition>
          } />
          <Route path="/letters" element={
            <PageTransition><LetterWizardPage /></PageTransition>
          } />
          <Route path="/finances" element={
            <ProtectedModuleRoute module="finances">
              <PageTransition><FinancesPage /></PageTransition>
            </ProtectedModuleRoute>
          } />
          <Route path="/finances/reports" element={
            <ProtectedModuleRoute module="finances">
              <PageTransition><FinanceReportsPage /></PageTransition>
            </ProtectedModuleRoute>
          } />
          <Route path="/settings" element={
            <ProtectedModuleRoute module="settings">
              <PageTransition><SettingsPage /></PageTransition>
            </ProtectedModuleRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedModuleRoute module="users">
              <PageTransition><UsersManagementPage /></PageTransition>
            </ProtectedModuleRoute>
          } />
          <Route path="/admin/audit" element={
            <ProtectedModuleRoute module="audit">
              <PageTransition><AuditLogsPage /></PageTransition>
            </ProtectedModuleRoute>
          } />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [hasSeenSplash, setHasSeenSplash] = useState(false)

  useEffect(() => {
    // Check if user has already seen splash this session
    const seen = sessionStorage.getItem('splashSeen')
    if (seen) {
      setShowSplash(false)
      setHasSeenSplash(true)
    }
  }, [])

  const handleSplashComplete = () => {
    sessionStorage.setItem('splashSeen', 'true')
    setShowSplash(false)
    setHasSeenSplash(true)
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && !hasSeenSplash && (
          <SplashScreen onComplete={handleSplashComplete} minimumDisplayTime={2800} />
        )}
      </AnimatePresence>
      
      {(!showSplash || hasSeenSplash) && (
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      )}
      
      <Toaster position="top-right" richColors />
    </>
  )
}

export default App
