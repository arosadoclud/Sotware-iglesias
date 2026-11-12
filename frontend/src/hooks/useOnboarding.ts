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
  const storageKey = `${STORAGE_KEY}:${user?.id || 'guest'}`
  
  const [state, setState] = useState<OnboardingState>(() => {
    const stored = localStorage.getItem(storageKey)
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

  useEffect(() => {
    const restart = () => setShowTour(true)
    window.addEventListener('restart-onboarding-tour', restart)
    return () => window.removeEventListener('restart-onboarding-tour', restart)
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    try {
      setState(stored ? JSON.parse(stored) : { hasCompletedTour: false, hasSeenModule: {}, exploredFeatures: [] })
    } catch {
      setState({ hasCompletedTour: false, hasSeenModule: {}, exploredFeatures: [] })
    }
  }, [storageKey])

  // Persistir cambios en localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state))
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
    window.dispatchEvent(new Event('restart-onboarding-tour'))
  }

  const resetOnboarding = () => {
    setState({
      hasCompletedTour: false,
      hasSeenModule: {},
      exploredFeatures: []
    })
    localStorage.removeItem(storageKey)
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
