import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleUnlockModal } from './ModuleUnlockModal'
import { useProtectedModulesStore, type ProtectedModule } from '../../store/protectedModulesStore'

interface ProtectedModuleRouteProps {
  module: ProtectedModule
  children: React.ReactNode
}

/**
 * Wrapper component that protects routes requiring password authentication.
 * Shows the unlock modal when trying to access a protected module.
 */
export function ProtectedModuleRoute({ module, children }: ProtectedModuleRouteProps) {
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const { isModuleUnlocked, isModuleProtected, checkAutoLock } = useProtectedModulesStore()
  
  // Check auto-lock on mount and periodically
  useEffect(() => {
    checkAutoLock()
    const interval = setInterval(checkAutoLock, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [checkAutoLock])
  
  // Check if module needs unlocking
  const needsUnlock = isModuleProtected(module) && !isModuleUnlocked(module)
  
  // Show modal if module is protected and locked
  useEffect(() => {
    if (needsUnlock) {
      setShowModal(true)
    }
  }, [needsUnlock])
  
  const handleClose = () => {
    setShowModal(false)
    // Navigate back to dashboard if closed without unlocking
    navigate('/', { replace: true })
  }
  
  const handleUnlock = () => {
    setShowModal(false)
    // Module is now unlocked, children will render
  }
  
  // If module needs unlock, show modal
  // Always render children to avoid re-mounting when unlocking
  return (
    <>
      {needsUnlock && (
        <ModuleUnlockModal
          isOpen={showModal}
          module={module}
          onClose={handleClose}
          onUnlock={handleUnlock}
        />
      )}
      {/* Solo mostrar contenido cuando está desbloqueado */}
      {!needsUnlock && children}
    </>
  )
}

export default ProtectedModuleRoute
