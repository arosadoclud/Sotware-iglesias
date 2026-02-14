import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SplashScreenProps {
  onComplete: () => void
  minimumDisplayTime?: number
}

const SplashScreen = ({ onComplete, minimumDisplayTime = 2800 }: SplashScreenProps) => {
  const [progress, setProgress] = useState(0)
  const [loadingText, setLoadingText] = useState('Iniciando sistema...')
  const [isExiting, setIsExiting] = useState(false)

  const loadingStages = [
    { progress: 15, text: 'Cargando componentes...' },
    { progress: 35, text: 'Conectando con el servidor...' },
    { progress: 55, text: 'Verificando autenticación...' },
    { progress: 75, text: 'Preparando interfaz...' },
    { progress: 90, text: 'Casi listo...' },
    { progress: 100, text: '¡Bienvenido!' },
  ]

  useEffect(() => {
    const startTime = Date.now()

    // Smooth progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const elapsed = Date.now() - startTime
        const targetProgress = Math.min((elapsed / minimumDisplayTime) * 100, 100)
        
        // Smooth easing
        const diff = targetProgress - prev
        const newProgress = prev + diff * 0.15
        
        // Update loading text based on progress
        const stage = loadingStages.find(s => newProgress < s.progress) || loadingStages[loadingStages.length - 1]
        setLoadingText(stage.text)
        
        return Math.min(newProgress, 100)
      })
    }, 50)

    // Complete after minimum time
    const completeTimeout = setTimeout(() => {
      clearInterval(progressInterval)
      setProgress(100)
      setLoadingText('¡Bienvenido!')
      
      setTimeout(() => {
        setIsExiting(true)
        setTimeout(onComplete, 600)
      }, 400)
    }, minimumDisplayTime)

    return () => {
      clearInterval(progressInterval)
      clearTimeout(completeTimeout)
    }
  }, [minimumDisplayTime, onComplete])

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1B2D5B 0%, #2A4080 50%, #1B2D5B 100%)',
          }}
        >
          {/* Animated background particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: Math.random() * 4 + 2,
                  height: Math.random() * 4 + 2,
                  background: 'rgba(200, 168, 75, 0.3)',
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [-20, 20, -20],
                  opacity: [0.2, 0.6, 0.2],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

          {/* Decorative rings */}
          <motion.div
            className="absolute w-[600px] h-[600px] rounded-full border border-white/5"
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute w-[450px] h-[450px] rounded-full border border-white/10"
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute w-[300px] h-[300px] rounded-full border-2 border-[#C8A84B]/20"
            animate={{ rotate: 360, scale: [1, 1.05, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          />

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Logo container with glow */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: 'spring', 
                stiffness: 200, 
                damping: 20,
                delay: 0.2 
              }}
              className="relative mb-8"
            >
              {/* Glow effect */}
              <motion.div
                className="absolute inset-0 rounded-full blur-2xl"
                style={{ background: 'radial-gradient(circle, rgba(200, 168, 75, 0.4) 0%, transparent 70%)' }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              
              {/* Logo circle */}
              <motion.div
                className="relative w-32 h-32 rounded-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl"
                animate={{ 
                  boxShadow: [
                    '0 0 30px rgba(200, 168, 75, 0.2)',
                    '0 0 60px rgba(200, 168, 75, 0.4)',
                    '0 0 30px rgba(200, 168, 75, 0.2)',
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <motion.img
                  src="/logo.png"
                  alt="Logo"
                  className="w-20 h-20 object-contain drop-shadow-lg"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  onError={(e) => {
                    // Fallback if logo doesn't exist
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
                {/* Fallback icon if no logo */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ display: 'none' }}
                >
                  <svg className="w-16 h-16 text-[#C8A84B]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* App name */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-center mb-10"
            >
              <h1 className="text-3xl font-bold text-white mb-2 tracking-wide">
                <span className="text-[#C8A84B]">Sistema</span> de Gestión
              </h1>
              <motion.p
                className="text-white/60 text-sm"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Administración de Iglesias
              </motion.p>
            </motion.div>

            {/* Progress bar container */}
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 280 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="relative"
            >
              {/* Background bar */}
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                {/* Progress fill */}
                <motion.div
                  className="h-full rounded-full relative"
                  style={{
                    background: 'linear-gradient(90deg, #C8A84B 0%, #E8C96A 50%, #C8A84B 100%)',
                    backgroundSize: '200% 100%',
                  }}
                  initial={{ width: '0%' }}
                  animate={{ 
                    width: `${progress}%`,
                    backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'],
                  }}
                  transition={{ 
                    width: { duration: 0.3, ease: 'easeOut' },
                    backgroundPosition: { duration: 2, repeat: Infinity, ease: 'linear' }
                  }}
                >
                  {/* Shine effect */}
                  <motion.div
                    className="absolute inset-0 opacity-50"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                    }}
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </motion.div>
              </div>

              {/* Progress percentage */}
              <motion.div
                className="flex items-center justify-between mt-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <motion.span 
                  className="text-white/70 text-xs font-medium"
                  key={loadingText}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {loadingText}
                </motion.span>
                <span className="text-[#C8A84B] text-xs font-bold tabular-nums">
                  {Math.round(progress)}%
                </span>
              </motion.div>
            </motion.div>

            {/* Loading dots */}
            <motion.div
              className="flex gap-1.5 mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-[#C8A84B]"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </motion.div>
          </div>

          {/* Bottom decorative line */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-1"
            style={{
              background: 'linear-gradient(90deg, transparent, #C8A84B, transparent)',
            }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: [0, 0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default SplashScreen
