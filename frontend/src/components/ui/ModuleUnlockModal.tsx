import { useState, useEffect, useRef } from 'react'
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './dialog'
import { Button } from './button'
import { BrandLogo } from '../layout/BrandLogo'
import {
  useProtectedModulesStore,
  MODULE_NAMES,
  type ProtectedModule
} from '../../store/protectedModulesStore'
import './module-unlock.css'
interface ModuleUnlockModalProps {
  isOpen: boolean
  module: ProtectedModule
  onClose: () => void
  onUnlock: () => void
}
export function ModuleUnlockModal({
  isOpen,
  module,
  onClose,
  onUnlock
}: ModuleUnlockModalProps) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const timer = useRef<number>()
  const { verifyPassword, unlockAll } = useProtectedModulesStore()
  useEffect(() => {
    if (isOpen) {
      setPassword('')
      setError('')
      setSuccess(false)
      setShowPassword(false)
    }
    return () => clearTimeout(timer.current)
  }, [isOpen])
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      setError('Ingresa la contraseña de acceso.')
      inputRef.current?.focus()
      return
    }
    if (verifyPassword(password)) {
      setSuccess(true)
      setError('')
      unlockAll()
      timer.current = window.setTimeout(onUnlock, 150)
    } else {
      setError('La contraseña no es correcta. Inténtalo nuevamente.')
      setPassword('')
      inputRef.current?.focus()
    }
  }
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        className="module-unlock-dialog"
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          inputRef.current?.focus()
        }}
      >
        <div className="module-unlock-brand">
          <BrandLogo />
          <span>ARCA EVANGÉLICA · DIOS FUERTE</span>
        </div>
        <div className="module-unlock-body">
          <div className="module-unlock-symbol">
            {success ? <CheckCircle2 size={25} /> : <ShieldCheck size={25} />}
          </div>
          <span className="module-unlock-eyebrow">UN ESPACIO DE CONFIANZA</span>
          <DialogTitle>
            {success ? 'Acceso listo' : 'Acceso a ' + MODULE_NAMES[module]}
          </DialogTitle>
          <DialogDescription>
            {success
              ? 'Los módulos protegidos están desbloqueados en esta sesión.'
              : 'Confirma la contraseña para continuar a este espacio de la iglesia.'}
          </DialogDescription>
          {!success && (
            <form onSubmit={handleSubmit}>
              <label htmlFor="module-password">Contraseña de acceso</label>
              <div
                className={
                  'module-password-field' + (error ? ' has-error' : '')
                }
              >
                <Lock size={18} />
                <input
                  id="module-password"
                  ref={inputRef}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  placeholder="Ingresa tu contraseña"
                  aria-invalid={!!error}
                  aria-describedby={error ? 'module-password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {error && (
                <p
                  className="module-unlock-error"
                  role="alert"
                  id="module-password-error"
                >
                  <AlertCircle size={16} />
                  {error}
                </p>
              )}
              <div className="module-unlock-actions">
                <Button variant="outline" type="button" onClick={onClose}>
                  Volver
                </Button>
                <Button type="submit">
                  <Lock size={15} />
                  Desbloquear
                </Button>
              </div>
            </form>
          )}
          <p className="module-unlock-note">
            Accede con cuidado a la información de nuestra comunidad.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
export default ModuleUnlockModal
