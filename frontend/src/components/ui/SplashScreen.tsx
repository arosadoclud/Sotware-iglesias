import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { BrandLogo } from '../layout/BrandLogo'
import './splash.css'

export default function SplashScreen({
  onComplete,
  minimumDisplayTime = 3200
}: {
  onComplete: () => void
  minimumDisplayTime?: number
}) {
  const callback = useRef(onComplete)
  const completed = useRef(false)
  const reduced = useReducedMotion()
  const [progress, setProgress] = useState(0)
  const [assetsReady, setAssetsReady] = useState(false)
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
    let disposed = false
    let ready = false
    let exitTimer: number | undefined
    const started = performance.now()
    const logo = new Image()
    const logoReady = new Promise<void>((resolve) => {
      logo.onload = () => resolve()
      logo.onerror = () => resolve()
      logo.src = '/arca-logo.png'
      if (logo.complete) resolve()
    })
    // Prepare actual visual resources; the percentage also includes the welcome animation.
    const fallback = window.setTimeout(() => {
      ready = true
      if (!disposed) setAssetsReady(true)
    }, 4500)
    Promise.all([logoReady, document.fonts?.ready ?? Promise.resolve()]).then(
      () => {
        if (disposed) return
        clearTimeout(fallback)
        ready = true
        setAssetsReady(true)
      }
    )
    const ticker = window.setInterval(() => {
      const elapsed = performance.now() - started
      const next = Math.min(
        ready ? 100 : 90,
        Math.floor((elapsed / Math.max(minimumDisplayTime, 1)) * 100)
      )
      setProgress(next)
      if (next === 100) {
        clearInterval(ticker)
        exitTimer = window.setTimeout(finish, reduced ? 150 : 420)
      }
    }, 50)
    return () => {
      disposed = true
      clearInterval(ticker)
      clearTimeout(fallback)
      clearTimeout(exitTimer)
      logo.onload = null
      logo.onerror = null
    }
  }, [minimumDisplayTime, reduced])
  const status =
    progress === 100
      ? 'Tu bienvenida está lista'
      : !assetsReady
        ? 'Cargando la identidad de nuestra iglesia'
        : progress < 65
          ? 'Preparando tu bienvenida'
          : 'Abriendo tu espacio de comunidad'
  return (
    <motion.section
      className="premium-splash"
      aria-label="Bienvenida a Arca Evangélica Dios Fuerte"
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.3 }}
    >
      <div className="splash-ambient" aria-hidden="true" />
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
        <motion.div
          className="splash-logo-stage"
          initial={{
            scale: reduced ? 1 : 0.88,
            filter: reduced ? 'none' : 'blur(8px)'
          }}
          animate={{ scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: reduced ? 0 : 1.1, ease: 'easeOut' }}
        >
          <span className="splash-logo-halo" aria-hidden="true" />
          <BrandLogo />
        </motion.div>
        <span className="splash-rule" />
        <p>NUESTRA FE. NUESTRA COMUNIDAD.</p>
        <h1>Unidos para servir.</h1>
        <div className="splash-copy">
          Un espacio para cuidar, organizar y compartir
          <br />
          la vida de nuestra iglesia.
        </div>
        <div className="splash-loading">
          <div className="splash-loading-label">
            <span role="status">{status}</span>
            <strong aria-hidden="true">{progress}%</strong>
          </div>
          <div
            className="splash-progress-track"
            role="progressbar"
            aria-label="Progreso de bienvenida"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-valuetext={`${progress}% · ${status}`}
          >
            <span style={{ transform: `scaleX(${progress / 100})` }} />
          </div>
          <span className="splash-loading-caption">Bienvenido a casa</span>
        </div>
      </motion.div>
      <footer>
        <strong>DIOS FUERTE</strong>
        <span>FE · COMUNIDAD · PROPÓSITO</span>
      </footer>
    </motion.section>
  )
}
