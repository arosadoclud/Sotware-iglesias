import { useEffect, useRef, useState } from 'react'
import { LogOut, CheckCircle } from 'lucide-react'

interface LogoutSplashProps {
  userName?: string
  onComplete?: () => void
}

const LogoutSplash = ({ userName, onComplete }: LogoutSplashProps) => {
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState<'logout' | 'success' | 'redirect'>('logout')
  // Ref para evitar que cambios en onComplete reinicien la secuencia
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    let cancelled = false

    // Animación de progreso
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 2
      })
    }, 30)

    // Secuencia de animación (NO ejecuta logout, solo animación)
    const sequence = async () => {
      // Etapa 1: Animación de cierre
      await new Promise(resolve => setTimeout(resolve, 1000))
      if (cancelled) return
      
      // Etapa 2: Éxito
      setStage('success')
      await new Promise(resolve => setTimeout(resolve, 1500))
      if (cancelled) return
      
      // Etapa 3: Redirigir
      setStage('redirect')
      await new Promise(resolve => setTimeout(resolve, 800))
      if (cancelled) return
      
      // Notificar que la animación terminó
      onCompleteRef.current?.()
    }

    sequence()

    return () => {
      cancelled = true
      clearInterval(progressInterval)
    }
  }, []) // Sin dependencias - se ejecuta solo una vez

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900">
      {/* Fondo animado */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-700/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Contenido */}
      <div className="relative z-10 text-center space-y-8 px-8">
        {/* Icono animado */}
        <div className="flex justify-center">
          <div className={`
            relative w-32 h-32 rounded-full bg-white/10 backdrop-blur-sm
            flex items-center justify-center
            transition-all duration-500
            ${stage === 'success' ? 'scale-110 bg-success-500/20' : ''}
          `}>
            {stage === 'logout' && (
              <LogOut className="w-16 h-16 text-white animate-spin-slow" />
            )}
            {stage === 'success' && (
              <CheckCircle className="w-16 h-16 text-success-400 animate-bounce-in" />
            )}
            {stage === 'redirect' && (
              <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            )}
          </div>
        </div>

        {/* Mensaje */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white">
            {stage === 'logout' && 'Cerrando sesión'}
            {stage === 'success' && '¡Hasta pronto!'}
            {stage === 'redirect' && 'Redirigiendo...'}
          </h1>
          
          {userName && stage !== 'redirect' && (
            <p className="text-xl text-primary-100">
              {stage === 'logout' && `${userName}`}
              {stage === 'success' && `Gracias por usar el sistema, ${userName}`}
            </p>
          )}

          {stage === 'logout' && (
            <p className="text-sm text-primary-200">
              Guardando cambios y limpiando sesión...
            </p>
          )}
          
          {stage === 'success' && (
            <p className="text-sm text-success-300">
              Sesión cerrada correctamente
            </p>
          )}

          {stage === 'redirect' && (
            <p className="text-sm text-primary-200">
              Te estamos redirigiendo al inicio de sesión
            </p>
          )}
        </div>

        {/* Barra de progreso */}
        <div className="max-w-md mx-auto">
          <div className="h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
            <div 
              className={`
                h-full transition-all duration-300 rounded-full
                ${stage === 'success' ? 'bg-success-400' : 'bg-primary-400'}
              `}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Información adicional */}
        <div className="text-xs text-primary-300 space-y-1">
          <p>✓ Datos guardados de forma segura</p>
          <p>✓ Sesión cerrada correctamente</p>
          <p>✓ Accede nuevamente cuando quieras</p>
        </div>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes bounce-in {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        
        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  )
}

export default LogoutSplash
