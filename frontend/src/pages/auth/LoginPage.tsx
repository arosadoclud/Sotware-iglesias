import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import api, { BACKEND_URL } from '../../lib/api'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

const LOGO_URL = `${BACKEND_URL}/uploads/logo.png`

const LoginPage = () => {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const response = await api.post('/auth/login', data)
      const { user, accessToken } = response.data.data
      setAuth(user, accessToken)
      toast.success('¡Bienvenido!')
      navigate('/')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Credenciales incorrectas')
    } finally {
      setIsLoading(false)
    }
  }

  // Memoize random values so they don't change on re-render
  const particles = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 8,
    duration: 6 + Math.random() * 8,
    size: 1.5 + Math.random() * 2.5,
    startOpacity: 0.15 + Math.random() * 0.35,
    drift: -30 + Math.random() * 60,
  })), [])

  const stars = useMemo(() => Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 1 + Math.random() * 1.5,
    delay: Math.random() * 5,
    duration: 3 + Math.random() * 4,
  })), [])

  const crosses = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    id: i,
    left: 5 + Math.random() * 90,
    top: 5 + Math.random() * 90,
    size: 12 + Math.random() * 16,
    delay: Math.random() * 10,
    duration: 12 + Math.random() * 10,
    rotate: Math.random() * 30 - 15,
  })), [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Playfair+Display+SC:wght@400;700&display=swap');

        /* Force dark on html/body so no white bleeds through */
        html, body, #root {
          background: #050a18 !important;
        }

        .login-root {
          min-height: 100vh;
          background: #050a18;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
          font-family: 'Playfair Display', Georgia, serif;
        }

        /* ── Animated Aurora / Nebula layer ── */
        .aurora-layer {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .aurora-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          mix-blend-mode: screen;
          will-change: transform;
        }

        .aurora-orb-1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(201, 168, 76, 0.12) 0%, transparent 70%);
          top: -15%; left: 50%;
          transform: translateX(-50%);
          animation: auroraFloat1 16s ease-in-out infinite;
        }

        .aurora-orb-2 {
          width: 500px; height: 400px;
          background: radial-gradient(circle, rgba(30, 60, 180, 0.18) 0%, transparent 70%);
          bottom: -10%; left: -5%;
          animation: auroraFloat2 20s ease-in-out infinite;
        }

        .aurora-orb-3 {
          width: 450px; height: 450px;
          background: radial-gradient(circle, rgba(20, 80, 200, 0.12) 0%, transparent 70%);
          top: 30%; right: -8%;
          animation: auroraFloat3 18s ease-in-out infinite;
        }

        .aurora-orb-4 {
          width: 350px; height: 350px;
          background: radial-gradient(circle, rgba(180, 140, 60, 0.08) 0%, transparent 70%);
          bottom: 20%; right: 20%;
          animation: auroraFloat4 14s ease-in-out infinite;
        }

        @keyframes auroraFloat1 {
          0%, 100% { transform: translateX(-50%) translateY(0) scale(1); }
          33% { transform: translateX(-40%) translateY(30px) scale(1.08); }
          66% { transform: translateX(-60%) translateY(-20px) scale(0.95); }
        }
        @keyframes auroraFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(60px, -40px) scale(1.12); }
        }
        @keyframes auroraFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(-40px, 30px) scale(1.06); }
          80% { transform: translate(20px, -20px) scale(0.94); }
        }
        @keyframes auroraFloat4 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, -30px) scale(1.1); }
        }

        /* ── Light rays from center ── */
        .light-rays {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .light-ray {
          position: absolute;
          top: 50%; left: 50%;
          width: 2px;
          height: 120vh;
          transform-origin: top center;
          background: linear-gradient(to bottom, rgba(201, 168, 76, 0.06), transparent 60%);
          animation: rayPulse 8s ease-in-out infinite;
        }

        @keyframes rayPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }

        /* ── Subtle grid ── */
        .grid-overlay {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
          z-index: 0;
        }

        /* ── Vignette ── */
        .vignette {
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse 70% 70% at 50% 50%, transparent 40%, rgba(3, 5, 15, 0.7) 100%);
          pointer-events: none;
          z-index: 1;
        }

        /* ── Floating particles (gold dust rising) ── */
        .particle-gold {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, #d4b86a, #c9a84c);
          z-index: 2;
          pointer-events: none;
          animation: goldRise linear infinite;
        }

        @keyframes goldRise {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          10% { opacity: var(--p-opacity); }
          70% { opacity: var(--p-opacity); }
          100% { transform: translateY(-200px) translateX(var(--p-drift)) scale(0.2); opacity: 0; }
        }

        /* ── Twinkling stars ── */
        .star {
          position: absolute;
          border-radius: 50%;
          background: rgba(220, 220, 255, 0.8);
          z-index: 1;
          pointer-events: none;
          animation: twinkle ease-in-out infinite;
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.1; transform: scale(0.8); }
          50% { opacity: 0.7; transform: scale(1.2); }
        }

        /* ── Floating crosses ── */
        .cross-float {
          position: absolute;
          z-index: 1;
          pointer-events: none;
          opacity: 0.04;
          animation: crossDrift linear infinite;
        }

        .cross-float::before,
        .cross-float::after {
          content: '';
          position: absolute;
          background: #c9a84c;
          border-radius: 1px;
        }

        .cross-float::before {
          width: 30%; height: 100%;
          left: 35%; top: 0;
        }

        .cross-float::after {
          width: 100%; height: 30%;
          left: 0; top: 22%;
        }

        @keyframes crossDrift {
          0% { transform: translateY(0) rotate(var(--cross-rotate)); opacity: 0; }
          15% { opacity: 0.05; }
          85% { opacity: 0.05; }
          100% { transform: translateY(-100px) rotate(calc(var(--cross-rotate) + 8deg)); opacity: 0; }
        }

        /* ── Noise texture overlay ── */
        .noise {
          position: fixed;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 256px 256px;
        }

        .login-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 420px;
          margin: 0 16px;
        }

        /* Decorative top ornament */
        .ornament {
          text-align: center;
          margin-bottom: 28px;
        }

        .ornament-line {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .ornament-line::before,
        .ornament-line::after {
          content: '';
          flex: 1;
          max-width: 80px;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(201, 168, 76, 0.6));
        }

        .ornament-line::after {
          background: linear-gradient(to left, transparent, rgba(201, 168, 76, 0.6));
        }

        .ornament-diamond {
          width: 8px;
          height: 8px;
          background: #c9a84c;
          transform: rotate(45deg);
          flex-shrink: 0;
        }

        .logo-ring {
          position: relative;
          width: 80px;
          height: 80px;
          margin: 0 auto 20px;
        }

        .logo-ring::before {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 1px solid rgba(201, 168, 76, 0.3);
          animation: pulse-ring 3s ease-in-out infinite;
        }

        .logo-ring::after {
          content: '';
          position: absolute;
          inset: -10px;
          border-radius: 50%;
          border: 1px solid rgba(201, 168, 76, 0.1);
          animation: pulse-ring 3s ease-in-out infinite 0.5s;
        }

        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.05); opacity: 1; }
        }

        .logo-img {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: contain;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(201, 168, 76, 0.25);
          padding: 8px;
        }

        .church-name {
          font-family: 'Playfair Display SC', serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.15em;
          color: #d4b86a;
          text-transform: uppercase;
          line-height: 1.5;
          margin-bottom: 6px;
        }

        .subtitle {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-weight: 300;
          font-size: 15px;
          color: rgba(255,255,255,0.52);
          letter-spacing: 0.05em;
        }

        /* Glass card */
        .form-card {
          background: rgba(20, 40, 100, 0.2);
          border: 1px solid rgba(201, 168, 76, 0.2);
          border-radius: 2px;
          padding: 32px 28px;
          box-shadow:
            0 0 0 1px rgba(0,0,20,0.6),
            0 24px 80px rgba(0,5,30,0.7),
            inset 0 1px 0 rgba(255,255,255,0.07);
          position: relative;
          overflow: hidden;
        }

        /* Corner accents */
        .form-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 20px; height: 20px;
          border-top: 2px solid rgba(201, 168, 76, 0.5);
          border-left: 2px solid rgba(201, 168, 76, 0.5);
        }

        .form-card::after {
          content: '';
          position: absolute;
          bottom: 0; right: 0;
          width: 20px; height: 20px;
          border-bottom: 2px solid rgba(201, 168, 76, 0.5);
          border-right: 2px solid rgba(201, 168, 76, 0.5);
        }

        .sign-in-label {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: 13px;
          letter-spacing: 0.08em;
          color: rgba(201, 168, 76, 0.7);
          text-align: center;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sign-in-label::before,
        .sign-in-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(201, 168, 76, 0.2);
        }

        .field-label {
          display: block;
          font-family: 'Playfair Display SC', serif;
          font-size: 10px;
          letter-spacing: 0.12em;
          color: rgba(255,255,255,0.45);
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .field-input {
          width: 100%;
          height: 46px;
          padding: 0 14px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 2px;
          color: rgba(255,255,255,0.92);
          font-family: 'Playfair Display', serif;
          font-size: 15px;
          outline: none;
          transition: all 0.25s;
          box-sizing: border-box;
        }

        .field-input::placeholder {
          color: rgba(255,255,255,0.25);
          font-style: italic;
        }

        .field-input:focus {
          border-color: rgba(201, 168, 76, 0.5);
          background: rgba(201, 168, 76, 0.04);
          box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.06), 0 0 20px rgba(201, 168, 76, 0.05);
        }

        .field-input.error {
          border-color: rgba(220, 80, 80, 0.5);
        }

        .field-input-wrapper {
          position: relative;
        }

        .field-input.has-icon {
          padding-right: 42px;
        }

        .input-icon-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255,255,255,0.25);
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }

        .input-icon-btn:hover {
          color: rgba(201, 168, 76, 0.7);
        }

        .error-msg {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #e07070;
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: 13px;
          margin-top: 6px;
        }

        .submit-btn {
          width: 100%;
          height: 48px;
          margin-top: 8px;
          background: linear-gradient(135deg, #b8922e 0%, #c9a84c 50%, #b8922e 100%);
          background-size: 200% 100%;
          border: none;
          border-radius: 2px;
          color: #06060e;
          font-family: 'Playfair Display SC', serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.35s;
          position: relative;
          overflow: hidden;
        }

        .submit-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%);
          transform: translateX(-100%);
          transition: transform 0.5s;
        }

        .submit-btn:hover::before {
          transform: translateX(100%);
        }

        .submit-btn:hover {
          background-position: right center;
          box-shadow: 0 0 30px rgba(201, 168, 76, 0.3), 0 4px 20px rgba(0,0,0,0.4);
          transform: translateY(-1px);
        }

        .submit-btn:active {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .submit-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .footer-text {
          text-align: center;
          margin-top: 24px;
          font-family: 'Playfair Display SC', serif;
          font-size: 10px;
          letter-spacing: 0.12em;
          color: rgba(255,255,255,0.2);
          text-transform: uppercase;
        }

        .space-y-5 > * + * { margin-top: 20px; }
      `}</style>

      <div className="login-root">
        {/* ── Background layers ── */}
        <div className="aurora-layer">
          <div className="aurora-orb aurora-orb-1" />
          <div className="aurora-orb aurora-orb-2" />
          <div className="aurora-orb aurora-orb-3" />
          <div className="aurora-orb aurora-orb-4" />
        </div>

        {/* Light rays emanating from center */}
        <div className="light-rays">
          {[0, 30, 60, 90, 120, 150].map((deg) => (
            <div
              key={deg}
              className="light-ray"
              style={{
                transform: `rotate(${deg}deg)`,
                animationDelay: `${deg * 0.04}s`,
              }}
            />
          ))}
        </div>

        <div className="grid-overlay" />
        <div className="noise" />
        <div className="vignette" />

        {/* Twinkling stars */}
        {stars.map((s) => (
          <div
            key={`star-${s.id}`}
            className="star"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          />
        ))}

        {/* Floating gold particles */}
        {particles.map((p) => (
          <div
            key={`p-${p.id}`}
            className="particle-gold"
            style={{
              left: `${p.left}%`,
              bottom: '-5%',
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              ['--p-opacity' as string]: p.startOpacity,
              ['--p-drift' as string]: `${p.drift}px`,
            }}
          />
        ))}

        {/* Floating crosses */}
        {crosses.map((c) => (
          <div
            key={`cross-${c.id}`}
            className="cross-float"
            style={{
              left: `${c.left}%`,
              top: `${c.top}%`,
              width: `${c.size}px`,
              height: `${c.size * 1.4}px`,
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`,
              ['--cross-rotate' as string]: `${c.rotate}deg`,
            }}
          />
        ))}

        <motion.div
          className="login-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Header */}
          <div className="ornament">
            <div className="ornament-line">
              <div className="ornament-diamond" />
              <div className="ornament-diamond" style={{ width: 5, height: 5, opacity: 0.5 }} />
              <div className="ornament-diamond" />
            </div>

            <div className="logo-ring">
              <img
                src={LOGO_URL}
                alt="Logo"
                className="logo-img"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="church-name">
                Iglesia Dios Fuerte<br />Arca Evangélica
              </div>
              <div className="subtitle">Sistema de Gestión de Programas</div>
            </motion.div>
          </div>

          {/* Form card */}
          <motion.div
            className="form-card"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="sign-in-label">Acceso</div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="field-label">
                  Correo electrónico
                </label>
                <div className="field-input-wrapper">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register('email')}
                    className={`field-input${errors.email ? ' error' : ''}`}
                    placeholder="nombre@ejemplo.com"
                  />
                </div>
                <AnimatePresence>
                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="error-msg"
                    >
                      <AlertCircle size={12} />
                      {errors.email.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="field-label">
                  Contraseña
                </label>
                <div className="field-input-wrapper">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    {...register('password')}
                    className={`field-input has-icon${errors.password ? ' error' : ''}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="input-icon-btn"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <AnimatePresence>
                  {errors.password && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="error-msg"
                    >
                      <AlertCircle size={12} />
                      {errors.password.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className="submit-btn"
                whileTap={{ scale: 0.99 }}
              >
                <span className="submit-inner">
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    'Continuar'
                  )}
                </span>
              </motion.button>
            </form>
          </motion.div>

          {/* Footer */}
          <div className="footer-text">
            © {new Date().getFullYear()} Church Program Manager
          </div>
        </motion.div>
      </div>
    </>
  )
}

export default LoginPage
