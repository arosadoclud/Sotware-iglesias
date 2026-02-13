import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuthStore } from './store/authStore'
import AuthLayout from './components/layout/AuthLayout'
import DashboardLayout from './components/layout/DashboardLayout'
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
import CalendarPage from './pages/CalendarPage'
import LetterTemplatesPage from './pages/letters/LetterTemplatesPage'
import SettingsPage from './pages/SettingsPage'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/persons" element={<PersonsPage />} />
            <Route path="/persons/:id" element={<PersonDetailPage />} />
            <Route path="/activities" element={<ActivityTypesPage />} />
            <Route path="/programs" element={<ProgramsPage />} />
            <Route path="/programs/generate" element={<GenerateProgramPage />} />
            <Route path="/programs/:id/edit" element={<ProgramEditPage />} />
            <Route path="/programs/:id/flyer" element={<FlyerPreviewPage />} />
            <Route path="/programs/batch-review" element={<BatchReviewPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/letters" element={<LetterTemplatesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </>
  )
}

export default App
