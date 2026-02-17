import { Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

interface BadgeNewProps {
  show?: boolean
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  pulse?: boolean
  size?: 'sm' | 'md'
}

const positionClasses = {
  'top-right': '-top-1 -right-1',
  'top-left': '-top-1 -left-1',
  'bottom-right': '-bottom-1 -right-1',
  'bottom-left': '-bottom-1 -left-1',
}

const sizeClasses = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-1',
}

export const BadgeNew = ({ 
  show = true, 
  position = 'top-right',
  pulse = true,
  size = 'sm'
}: BadgeNewProps) => {
  if (!show) return null

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      className={`absolute ${positionClasses[position]} z-10`}
    >
      <div 
        className={`
          ${sizeClasses[size]}
          bg-gradient-to-r from-amber-500 to-orange-500 
          text-white font-bold rounded-full
          flex items-center gap-1
          shadow-lg
          ${pulse ? 'animate-pulse' : ''}
        `}
      >
        <Sparkles className="w-3 h-3" />
        <span>NUEVO</span>
      </div>
    </motion.div>
  )
}

// Badge para indicar que hay múltiples novedades en una sección
export const BadgeCount = ({ 
  count, 
  position = 'top-right' 
}: { 
  count: number
  position?: 'top-right' | 'top-left'
}) => {
  if (count === 0) return null

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`absolute ${positionClasses[position]} z-10`}
    >
      <div className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
        {count > 9 ? '9+' : count}
      </div>
    </motion.div>
  )
}
