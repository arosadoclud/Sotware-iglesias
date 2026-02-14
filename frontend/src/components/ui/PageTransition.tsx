import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'

interface PageTransitionProps {
  children: ReactNode
}

// Different animation variants for variety
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94], // Smooth easeOut
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.99,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

// Slide variant for horizontal transitions
const slideVariants = {
  initial: {
    opacity: 0,
    x: 30,
  },
  enter: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    x: -30,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

// Fade with blur variant
const fadeBlurVariants = {
  initial: {
    opacity: 0,
    filter: 'blur(10px)',
  },
  enter: {
    opacity: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    filter: 'blur(5px)',
    transition: {
      duration: 0.3,
      ease: 'easeIn',
    },
  },
}

// Map routes to variant styles
const getVariantForRoute = (pathname: string) => {
  // Detail pages use slide
  if (pathname.includes('/persons/') || pathname.includes('/programs/')) {
    return slideVariants
  }
  // Wizard pages use fade blur
  if (pathname.includes('/letters') || pathname.includes('/share-whatsapp')) {
    return fadeBlurVariants
  }
  // Default pages use standard
  return pageVariants
}

const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation()
  const variants = getVariantForRoute(location.pathname)

  return (
    <motion.div
      key={location.pathname}
      initial="initial"
      animate="enter"
      exit="exit"
      variants={variants}
      className="w-full"
    >
      {/* Top loading bar animation */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600 z-50 origin-left"
        initial={{ scaleX: 0, opacity: 1 }}
        animate={{ 
          scaleX: [0, 1],
          opacity: [1, 0],
        }}
        transition={{ 
          scaleX: { duration: 0.5, ease: 'easeOut' },
          opacity: { duration: 0.3, delay: 0.5 },
        }}
      />
      
      {children}
    </motion.div>
  )
}

export default PageTransition
