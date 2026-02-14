import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Eye, EyeOff, Shield, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from './button'
import { Input } from './input'
import { useProtectedModulesStore, MODULE_NAMES, type ProtectedModule } from '../../store/protectedModulesStore'

interface ModuleUnlockModalProps {
  isOpen: boolean
  module: ProtectedModule
  onClose: () => void
  onUnlock: () => void
}

export function ModuleUnlockModal({ isOpen, module, onClose, onUnlock }: ModuleUnlockModalProps) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const { verifyPassword, unlockAll } = useProtectedModulesStore()
  
  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setPassword('')
      setError('')
      setSuccess(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password.trim()) {
      setError('Ingresa la contraseña')
      return
    }
    
    if (verifyPassword(password)) {
      setSuccess(true)
      setError('')
      // Desbloquear todos los módulos protegidos
      unlockAll()
      
      // Pequeño delay para mostrar el éxito
      setTimeout(() => {
        onUnlock()
      }, 500)
    } else {
      setAttempts(prev => prev + 1)
      setError('Contraseña incorrecta')
      setPassword('')
      inputRef.current?.focus()
      
      // Vibración del input
      inputRef.current?.classList.add('animate-shake')
      setTimeout(() => {
        inputRef.current?.classList.remove('animate-shake')
      }, 500)
    }
  }
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header con gradiente */}
            <div className="bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 px-6 py-8 text-center relative overflow-hidden">
              {/* Patrón de fondo */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                  backgroundSize: '24px 24px'
                }} />
              </div>
              
              {/* Icono animado */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="relative z-10"
              >
                <div className="w-20 h-20 mx-auto bg-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm border border-white/20">
                  {success ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring' }}
                    >
                      <CheckCircle2 className="w-10 h-10 text-green-400" />
                    </motion.div>
                  ) : (
                    <Shield className="w-10 h-10 text-white" />
                  )}
                </div>
              </motion.div>
              
              <h2 className="text-xl font-bold text-white relative z-10">
                {success ? '¡Acceso Concedido!' : 'Módulo Protegido'}
              </h2>
              <p className="text-slate-300 text-sm mt-1 relative z-10">
                {success 
                  ? 'Todos los módulos han sido desbloqueados'
                  : `Ingresa la contraseña para acceder a ${MODULE_NAMES[module]}`
                }
              </p>
              
              {/* Botón cerrar */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Contenido */}
            <div className="p-6">
              {!success && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Campo de contraseña */}
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      ref={inputRef}
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setError('')
                      }}
                      placeholder="Contraseña de acceso"
                      className={`pl-12 pr-12 h-14 text-lg rounded-xl border-2 transition-all ${
                        error 
                          ? 'border-red-400 bg-red-50 focus:border-red-500' 
                          : 'border-slate-200 focus:border-slate-500'
                      }`}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {/* Error message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-xl"
                      >
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-medium">{error}</span>
                        {attempts >= 3 && (
                          <span className="text-xs text-red-400 ml-auto">
                            Intento {attempts}
                          </span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Botones */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      className="flex-1 h-12 rounded-xl"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 h-12 rounded-xl bg-slate-800 hover:bg-slate-900 gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      Desbloquear
                    </Button>
                  </div>
                </form>
              )}
              
              {/* Hint */}
              <p className="text-xs text-center text-slate-400 mt-4">
                La contraseña protege el acceso a módulos sensibles
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Estilos CSS adicionales para la animación de shake
const shakeStyles = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}
.animate-shake {
  animation: shake 0.5s ease-in-out;
}
`

// Inyectar estilos
if (typeof document !== 'undefined') {
  const styleId = 'module-unlock-modal-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = shakeStyles
    document.head.appendChild(style)
  }
}

export default ModuleUnlockModal
