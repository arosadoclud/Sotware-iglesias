import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'

interface OnboardingState {
  hasCompletedTour: boolean
  hasSeenModule: Record<string, boolean>
  exploredFeatures: string[]
}

const STORAGE_KEY = 'onboarding-state'

export const useOnboarding = () => {
  const { user } = useAuthStore()
  
  const [state, setState] = useState<OnboardingState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return {
          hasCompletedTour: false,
          hasSeenModule: {},
          exploredFeatures: []
        }
      }
    }
    return {
      hasCompletedTour: false,
      hasSeenModule: {},
      exploredFeatures: []
    }
  })

  const [showTour, setShowTour] = useState(false)

  // Persistir cambios en localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  // Mostrar tour automáticamente si es la primera vez
  useEffect(() => {
    if (!state.hasCompletedTour && user) {
      // Delay para que se cargue bien el DOM
      const timer = setTimeout(() => {
        setShowTour(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [state.hasCompletedTour, user])

  const completeTour = () => {
    setState(prev => ({
      ...prev,
      hasCompletedTour: true
    }))
    setShowTour(false)
  }

  const markModuleAsSeen = (moduleName: string) => {
    setState(prev => ({
      ...prev,
      hasSeenModule: {
        ...prev.hasSeenModule,
        [moduleName]: true
      }
    }))
  }

  const markFeatureAsExplored = (featureId: string) => {
    setState(prev => ({
      ...prev,
      exploredFeatures: [...new Set([...prev.exploredFeatures, featureId])]
    }))
  }

  const isFeatureNew = (featureId: string) => {
    return !state.exploredFeatures.includes(featureId)
  }

  const restartTour = () => {
    setShowTour(true)
  }

  const resetOnboarding = () => {
    setState({
      hasCompletedTour: false,
      hasSeenModule: {},
      exploredFeatures: []
    })
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    showTour,
    setShowTour,
    hasCompletedTour: state.hasCompletedTour,
    hasSeenModule: state.hasSeenModule,
    completeTour,
    markModuleAsSeen,
    markFeatureAsExplored,
    isFeatureNew,
    restartTour,
    resetOnboarding
  }
}
