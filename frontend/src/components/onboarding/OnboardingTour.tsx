import { useEffect } from 'react'
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride'
import { useAuthStore } from '../../store/authStore'
import { ADMIN_TOUR, VIEWER_TOUR } from '../../constants/tourSteps'
import { useOnboarding } from '../../hooks/useOnboarding'

export const OnboardingTour = () => {
  const { user, isAdmin } = useAuthStore()
  const { showTour, setShowTour, completeTour } = useOnboarding()

  // Determinar qué tour mostrar según el rol
  const getTourSteps = (): Step[] => {
    if (!user) return []
    
    // Usar la función isAdmin del store
    return isAdmin() ? ADMIN_TOUR : VIEWER_TOUR
  }

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED]

    if (finishedStatuses.includes(status)) {
      completeTour()
    }
  }

  if (!showTour || !user) {
    return null
  }

  return (
    <Joyride
      steps={getTourSteps()}
      continuous
      showProgress={false}
      showSkipButton
      run={showTour}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          arrowColor: '#fff',
          backgroundColor: '#fff',
          overlayColor: 'rgba(0, 0, 0, 0.3)',
          primaryColor: '#6366f1',
          textColor: '#1f2937',
          width: 420,
          zIndex: 10000,
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
        },
        spotlight: {
          backgroundColor: 'transparent',
          border: '2px solid #6366f1',
          borderRadius: 8,
        },
        tooltip: {
          borderRadius: 12,
          padding: 24,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipContent: {
          padding: '4px 0',
        },
        buttonNext: {
          backgroundColor: '#6366f1',
          borderRadius: 8,
          padding: '10px 20px',
          fontSize: '14px',
          fontWeight: 600,
        },
        buttonBack: {
          color: '#6b7280',
          marginRight: 10,
          fontSize: '14px',
        },
        buttonSkip: {
          color: '#9ca3af',
          fontSize: '13px',
        },
        buttonClose: {
          display: 'none',
        },
      }}
      locale={{
        back: 'Atrás',
        close: 'Cerrar',
        last: 'Finalizar',
        next: 'Siguiente',
        open: 'Abrir',
        skip: 'Saltar tour',
      }}
      floaterProps={{
        disableAnimation: false,
      }}
    />
  )
}
