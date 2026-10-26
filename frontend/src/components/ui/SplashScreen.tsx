import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { BrandLogo } from '../layout/BrandLogo'
import './splash.css'
export default function SplashScreen({
  onComplete,
  minimumDisplayTime = 1800
}: {
  onComplete: () => void
  minimumDisplayTime?: number
}) {
  const callback = useRef(onComplete)
  const completed = useRef(false)
  const reduced = useReducedMotion()
  useEffect(() => {
    callback.current = onComplete
  }, [onComplete])
  const finish = () => {
    if (!completed.current) {
      completed.current = true
      callback.current()
    }
  }
  useEffect(() => {
    const timer = window.setTimeout(finish, minimumDisplayTime)
    return () => clearTimeout(timer)
  }, [minimumDisplayTime])
  return (
    <section
      className="premium-splash"
      aria-label="Bienvenida a Arca Evangélica Dios Fuerte"
    >
      <header>
        <span>ARCA EVANGÉLICA</span>
        <button onClick={finish}>Entrar →</button>
      </header>
      <motion.div
        className="splash-center"
        initial={{ opacity: 0, y: reduced ? 0 : 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.65 }}
      >
        <BrandLogo />
        <span className="splash-rule" />
        <p>NUESTRA FE. NUESTRA COMUNIDAD.</p>
        <h1>Unidos para servir.</h1>
        <div>
          Un espacio para cuidar, organizar y compartir
          <br />
          la vida de nuestra iglesia.
        </div>
        <span className="splash-welcome">Bienvenido a casa</span>
      </motion.div>
      <footer>
        <strong>DIOS FUERTE</strong>
        <span>FE · COMUNIDAD · PROPÓSITO</span>
      </footer>
    </section>
  )
}
