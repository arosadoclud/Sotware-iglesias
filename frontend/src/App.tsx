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
import RegisterPage from './pages/auth/RegisterPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import PersonsPage from './pages/persons/PersonsPage'
import PersonDetailPage from './pages/persons/PersonDetailPage'
import ActivityTypesPage from './pages/activities/ActivityTypesPage'
import ProgramsPage from './pages/programs/ProgramsPage'
import GenerateProgramPage from './pages/programs/GenerateProgramPage'
import ProgramEditPage from './pages/programs/ProgramEditPage'
import CleaningProgramEditPage from './pages/programs/CleaningProgramEditPage'
import FlyerPreviewPage from './pages/programs/FlyerPreviewPage'
import BatchReviewPage from './pages/programs/BatchReviewPage'
import WhatsAppWizardPage from './pages/programs/WhatsAppWizardPage'
import CalendarPage from './pages/CalendarPage'
import LetterWizardPage from './pages/letters/LetterWizardPage'
import { FinancesPage, FinanceReportsPage } from './pages/finances'
import SettingsPage from './pages/SettingsPage'
import NewMembersPage from './pages/new-members/NewMembersPage'
import EventsManagementPage from './pages/events/EventsManagementPage'
import UsersManagementPage from './pages/admin/UsersManagementPage'
import AuditLogsPage from './pages/admin/AuditLogsPage'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

// Rutas permitidas para el rol VIEWER
const VIEWER_ALLOWED_ROUTES = ['/', '/letters', '/new-members', '/calendar']

const ViewerGuard = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore()
  const location = useLocation()
  
  if (user?.role === 'VIEWER') {
    const isAllowed = VIEWER_ALLOWED_ROUTES.some(route => 
      route === '/' ? location.pathname === '/' : location.pathname.startsWith(route)
    )
    if (!isAllowed) return <Navigate to="/" replace />
  }
  
  return <>{children}</>
}

// Animated Routes component to handle page transitions
const AnimatedRoutes = () => {
  const location = useLocation()
  
  return (
      <Routes location={location}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={
            <PageTransition><LoginPage /></PageTransition>
          } />
          <Route path="/register" element={
            <PageTransition><RegisterPage /></PageTransition>
          } />
          <Route path="/verify-email/:token" element={
            <PageTransition><VerifyEmailPage /></PageTransition>
          } />
          <Route path="/reset-password/:token" element={
            <PageTransition><ResetPasswordPage /></PageTransition>
          } />
        </Route>
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/" element={
            <PageTransition><DashboardPage /></PageTransition>
          } />
          <Route path="/persons" element={
            <ViewerGuard><PageTransition><PersonsPage /></PageTransition></ViewerGuard>
          } />
          <Route path="/persons/:id" element={
            <ViewerGuard><PageTransition><PersonDetailPage /></PageTransition></ViewerGuard>
          } />
          <Route path="/activities" element={
            <ViewerGuard><PageTransition><ActivityTypesPage /></PageTransition></ViewerGuard>
          } />
          <Route path="/programs" element={
            <ViewerGuard><PageTransition><ProgramsPage /></PageTransition></ViewerGuard>
          } />
          <Route path="/programs/generate" element={
            <ViewerGuard>
              <PermissionRoute permissions={[P.PROGRAMS_CREATE, P.PROGRAMS_GENERATE]}>
                <PageTransition><GenerateProgramPage /></PageTransition>
              </PermissionRoute>
            </ViewerGuard>
          } />
          <Route path="/programs/:id/edit" element={
            <ViewerGuard>
              <PermissionRoute permissions={P.PROGRAMS_EDIT}>
                <PageTransition><ProgramEditPage /></PageTransition>
              </PermissionRoute>
            </ViewerGuard>
          } />
          <Route path="/programs/edit-cleaning/:id" element={
            <ViewerGuard>
              <PermissionRoute permissions={P.PROGRAMS_EDIT}>
                <PageTransition><CleaningProgramEditPage /></PageTransition>
              </PermissionRoute>
            </ViewerGuard>
          } />
          <Route path="/programs/:id/flyer" element={
            <ViewerGuard><PageTransition><FlyerPreviewPage /></PageTransition></ViewerGuard>
          } />
          <Route path="/programs/batch-review" element={
            <ViewerGuard>
              <PermissionRoute permissions={[P.PROGRAMS_CREATE, P.PROGRAMS_BATCH]}>
                <PageTransition><BatchReviewPage /></PageTransition>
              </PermissionRoute>
            </ViewerGuard>
          } />
          <Route path="/programs/share-whatsapp" element={
            <ViewerGuard><PageTransition><WhatsAppWizardPage /></PageTransition></ViewerGuard>
          } />
          <Route path="/calendar" element={
            <PageTransition><CalendarPage /></PageTransition>
          } />
          <Route path="/events" element={
            <ViewerGuard><PageTransition><EventsManagementPage /></PageTransition></ViewerGuard>
          } />
          <Route path="/new-members" element={
            <PageTransition><NewMembersPage /></PageTransition>
          } />
          <Route path="/letters" element={
            <PageTransition><LetterWizardPage /></PageTransition>
          } />
          <Route path="/finances" element={
            <ViewerGuard>
              <ProtectedModuleRoute module="finances">
                <PageTransition><FinancesPage /></PageTransition>
              </ProtectedModuleRoute>
            </ViewerGuard>
          } />
          <Route path="/finances/reports" element={
            <ViewerGuard>
              <ProtectedModuleRoute module="finances">
                <PageTransition><FinanceReportsPage /></PageTransition>
              </ProtectedModuleRoute>
            </ViewerGuard>
          } />
          <Route path="/settings" element={
            <ViewerGuard>
              <ProtectedModuleRoute module="settings">
                <PageTransition><SettingsPage /></PageTransition>
              </ProtectedModuleRoute>
            </ViewerGuard>
          } />
          <Route path="/admin/users" element={
            <ViewerGuard>
              <ProtectedModuleRoute module="users">
                <PageTransition><UsersManagementPage /></PageTransition>
              </ProtectedModuleRoute>
            </ViewerGuard>
          } />
          <Route path="/admin/audit" element={
            <ViewerGuard>
              <ProtectedModuleRoute module="audit">
                <PageTransition><AuditLogsPage /></PageTransition>
              </ProtectedModuleRoute>
            </ViewerGuard>
          } />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
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
