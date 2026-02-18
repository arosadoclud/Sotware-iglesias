import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { AlertCircle, Loader2, Eye, EyeOff, Check, ShieldCheck, ArrowLeft, KeyRound } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { authApi } from '../../lib/api'
import { BACKEND_URL } from '../../lib/api'

const resetSchema = z.object({
  newPassword: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .regex(/[A-Z]/, 'Debe incluir al menos una letra mayúscula')
    .regex(/[0-9]/, 'Debe incluir al menos un número'),
  confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type ResetForm = z.infer<typeof resetSchema>

const LOGO_LOCAL = '/logo.png'
const LOGO_BACKEND = `${BACKEND_URL}/uploads/logo.png`

const ResetPasswordPage = () => {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [isTokenValid, setIsTokenValid] = useState(false)
  const [userName, setUserName] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  })

  const watchPassword = watch('newPassword', '')

  // Calculate password strength
  useEffect(() => {
    let strength = 0
    if (watchPassword.length >= 6) strength++
    if (watchPassword.length >= 10) strength++
    if (/[A-Z]/.test(watchPassword)) strength++
    if (/[0-9]/.test(watchPassword)) strength++
    if (/[^A-Za-z0-9]/.test(watchPassword)) strength++
    setPasswordStrength(strength)
  }, [watchPassword])

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsVerifying(false)
        return
      }
      try {
        const res = await authApi.verifyResetToken(token)
        if (res.data.success) {
          setIsTokenValid(true)
          setUserName(res.data.data.fullName || '')
        }
      } catch {
        setIsTokenValid(false)
      } finally {
        setIsVerifying(false)
      }
    }
    verifyToken()
  }, [token])

  const onSubmit = async (data: ResetForm) => {
    if (!token) return
    setIsLoading(true)
    try {
      const res = await authApi.resetPassword(token, data.newPassword)
      if (res.data.success) {
        setIsSuccess(true)
        toast.success('¡Contraseña restablecida exitosamente!')
        setTimeout(() => navigate('/login'), 4000)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al restablecer la contraseña')
    } finally {
      setIsLoading(false)
    }
  }

  const strengthColors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e']
  const strengthLabels = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Excelente']

  // Memoize random values for background effects
  const particles = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 8,
    duration: 6 + Math.random() * 8,
    size: 1.5 + Math.random() * 2.5,
    startOpacity: 0.15 + Math.random() * 0.35,
    drift: -30 + Math.random() * 60,
  })), [])

  const stars = useMemo(() => Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 1 + Math.random() * 1.5,
    delay: Math.random() * 5,
    duration: 3 + Math.random() * 4,
  })), [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Playfair+Display+SC:wght@400;700&display=swap');

        html, body, #root {
          background: #0b1529 !important;
        }

        .reset-root {
          min-height: 100vh;
          background: linear-gradient(170deg, #0e1b33 0%, #0b1529 40%, #091225 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
          font-family: 'Playfair Display', Georgia, serif;
        }

        .reset-aurora-layer {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .reset-aurora-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          mix-blend-mode: screen;
          will-change: transform;
        }

        .reset-aurora-orb-1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(201, 168, 76, 0.15) 0%, transparent 65%);
          top: -15%; left: 50%;
          transform: translateX(-50%);
          animation: resetAuroraFloat1 16s ease-in-out infinite;
        }

        .reset-aurora-orb-2 {
          width: 450px; height: 400px;
          background: radial-gradient(circle, rgba(40, 80, 200, 0.18) 0%, transparent 65%);
          bottom: -10%; left: -5%;
          animation: resetAuroraFloat2 20s ease-in-out infinite;
        }

        .reset-aurora-orb-3 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(30, 90, 220, 0.14) 0%, transparent 65%);
          top: 30%; right: -8%;
          animation: resetAuroraFloat3 18s ease-in-out infinite;
        }

        @keyframes resetAuroraFloat1 {
          0%, 100% { transform: translateX(-50%) translateY(0) scale(1); }
          33% { transform: translateX(-40%) translateY(30px) scale(1.08); }
          66% { transform: translateX(-60%) translateY(-20px) scale(0.95); }
        }
        @keyframes resetAuroraFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(60px, -40px) scale(1.12); }
        }
        @keyframes resetAuroraFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(-40px, 30px) scale(1.06); }
          80% { transform: translate(20px, -20px) scale(0.94); }
        }

        .reset-vignette {
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse 80% 80% at 50% 45%, transparent 50%, rgba(5, 10, 25, 0.55) 100%);
          pointer-events: none;
          z-index: 1;
        }

        .reset-noise {
          position: fixed;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 256px 256px;
        }

        .reset-particle-gold {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, #d4b86a, #c9a84c);
          z-index: 2;
          pointer-events: none;
          animation: resetGoldRise linear infinite;
        }

        @keyframes resetGoldRise {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          10% { opacity: var(--p-opacity); }
          70% { opacity: var(--p-opacity); }
          100% { transform: translateY(-200px) translateX(var(--p-drift)) scale(0.2); opacity: 0; }
        }

        .reset-star {
          position: absolute;
          border-radius: 50%;
          background: rgba(220, 220, 255, 0.8);
          z-index: 1;
          pointer-events: none;
          animation: resetTwinkle ease-in-out infinite;
        }

        @keyframes resetTwinkle {
          0%, 100% { opacity: 0.1; transform: scale(0.8); }
          50% { opacity: 0.7; transform: scale(1.2); }
        }

        .reset-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          margin: 0 16px;
        }

        .reset-ornament {
          text-align: center;
          margin-bottom: 24px;
        }

        .reset-ornament-line {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .reset-ornament-line::before,
        .reset-ornament-line::after {
          content: '';
          flex: 1;
          max-width: 80px;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(212, 184, 106, 0.5));
        }

        .reset-ornament-line::after {
          background: linear-gradient(to left, transparent, rgba(212, 184, 106, 0.5));
        }

        .reset-ornament-diamond {
          width: 7px;
          height: 7px;
          background: rgba(212, 184, 106, 0.7);
          transform: rotate(45deg);
          flex-shrink: 0;
          box-shadow: 0 0 6px rgba(212, 184, 106, 0.3);
        }

        .reset-icon-ring {
          position: relative;
          width: 72px;
          height: 72px;
          margin: 0 auto 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .reset-icon-ring::before {
          content: '';
          position: absolute;
          inset: -5px;
          border-radius: 50%;
          border: 1px solid rgba(212, 184, 106, 0.35);
          animation: resetPulseRing 3s ease-in-out infinite;
        }

        .reset-icon-ring::after {
          content: '';
          position: absolute;
          inset: -12px;
          border-radius: 50%;
          border: 1px solid rgba(212, 184, 106, 0.12);
          animation: resetPulseRing 3s ease-in-out infinite 0.5s;
        }

        @keyframes resetPulseRing {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.05); opacity: 1; }
        }

        .reset-icon-circle {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: rgba(212, 184, 106, 0.08);
          border: 1px solid rgba(212, 184, 106, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #dcc47a;
        }

        .reset-title {
          font-family: 'Playfair Display SC', serif;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.14em;
          color: #dcc47a;
          text-transform: uppercase;
          margin-bottom: 6px;
          text-shadow: 0 0 20px rgba(212, 184, 106, 0.15);
        }

        .reset-subtitle {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-weight: 400;
          font-size: 13.5px;
          color: rgba(255,255,255,0.5);
          letter-spacing: 0.03em;
        }

        .reset-form-card {
          background: rgba(15, 25, 60, 0.35);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(212, 184, 106, 0.18);
          border-radius: 4px;
          padding: 30px 28px;
          box-shadow:
            0 0 0 1px rgba(0,0,30,0.4),
            0 20px 60px rgba(0,5,30,0.5),
            0 0 40px rgba(201, 168, 76, 0.03),
            inset 0 1px 0 rgba(255,255,255,0.08);
          position: relative;
          overflow: hidden;
        }

        .reset-form-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 22px; height: 22px;
          border-top: 1.5px solid rgba(212, 184, 106, 0.45);
          border-left: 1.5px solid rgba(212, 184, 106, 0.45);
        }

        .reset-form-card::after {
          content: '';
          position: absolute;
          bottom: 0; right: 0;
          width: 22px; height: 22px;
          border-bottom: 1.5px solid rgba(212, 184, 106, 0.45);
          border-right: 1.5px solid rgba(212, 184, 106, 0.45);
        }

        .reset-field-label {
          display: block;
          font-family: 'Playfair Display SC', serif;
          font-size: 10.5px;
          letter-spacing: 0.12em;
          color: rgba(255,255,255,0.55);
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .reset-field-input {
          width: 100%;
          height: 46px;
          padding: 0 14px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.16);
          border-radius: 3px;
          color: rgba(255,255,255,0.95);
          font-family: 'Playfair Display', serif;
          font-size: 15px;
          outline: none;
          transition: all 0.25s;
          box-sizing: border-box;
        }

        .reset-field-input::placeholder {
          color: rgba(255,255,255,0.3);
          font-style: italic;
        }

        .reset-field-input:focus {
          border-color: rgba(212, 184, 106, 0.5);
          background: rgba(212, 184, 106, 0.06);
          box-shadow: 0 0 0 3px rgba(212, 184, 106, 0.08), 0 0 16px rgba(212, 184, 106, 0.04);
        }

        .reset-field-input.error {
          border-color: rgba(220, 80, 80, 0.5);
        }

        .reset-field-input.has-icon {
          padding-right: 42px;
        }

        .reset-input-wrapper {
          position: relative;
        }

        .reset-input-icon-btn {
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

        .reset-input-icon-btn:hover {
          color: rgba(201, 168, 76, 0.7);
        }

        .reset-error-msg {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #e07070;
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: 13px;
          margin-top: 6px;
        }

        .reset-submit-btn {
          width: 100%;
          height: 48px;
          margin-top: 8px;
          background: linear-gradient(135deg, #c49a30 0%, #dbb854 50%, #c49a30 100%);
          background-size: 200% 100%;
          border: none;
          border-radius: 3px;
          color: #0a0e1a;
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

        .reset-submit-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%);
          transform: translateX(-100%);
          transition: transform 0.5s;
        }

        .reset-submit-btn:hover::before {
          transform: translateX(100%);
        }

        .reset-submit-btn:hover {
          background-position: right center;
          box-shadow: 0 0 30px rgba(201, 168, 76, 0.3), 0 4px 20px rgba(0,0,0,0.4);
          transform: translateY(-1px);
        }

        .reset-submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .reset-submit-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .reset-back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 20px;
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: 13px;
          color: rgba(212, 184, 106, 0.6);
          text-decoration: none;
          transition: color 0.2s;
        }

        .reset-back-link:hover {
          color: rgba(212, 184, 106, 0.9);
        }

        .strength-bar-container {
          display: flex;
          gap: 4px;
          margin-top: 8px;
        }

        .strength-bar-segment {
          flex: 1;
          height: 3px;
          border-radius: 2px;
          background: rgba(255,255,255,0.1);
          transition: background 0.3s;
        }

        .strength-label {
          font-family: 'Playfair Display', serif;
          font-size: 11px;
          margin-top: 4px;
          transition: color 0.3s;
        }

        .reset-requirements {
          display: flex;
          flex-wrap: wrap;
          gap: 6px 12px;
          margin-top: 10px;
        }

        .reset-req-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-family: 'Playfair Display', serif;
          font-size: 11px;
          transition: color 0.3s;
        }

        .reset-req-check {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
        }

        .reset-footer-text {
          text-align: center;
          margin-top: 24px;
          font-family: 'Playfair Display SC', serif;
          font-size: 10px;
          letter-spacing: 0.12em;
          color: rgba(255,255,255,0.28);
          text-transform: uppercase;
        }

        .reset-space-y > * + * { margin-top: 18px; }

        /* Success animation */
        .success-checkmark {
          width: 80px;
          height: 80px;
          margin: 0 auto 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05));
          border: 2px solid rgba(34, 197, 94, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #22c55e;
        }

        @keyframes successPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.3); }
          50% { box-shadow: 0 0 0 12px rgba(34, 197, 94, 0); }
        }

        .success-text {
          font-family: 'Playfair Display', serif;
          font-size: 15px;
          color: rgba(255,255,255,0.8);
          text-align: center;
          line-height: 1.6;
        }

        .success-redirect {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: 12px;
          color: rgba(255,255,255,0.4);
          text-align: center;
          margin-top: 16px;
        }

        /* Loading spinner */
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(212, 184, 106, 0.15);
          border-top-color: #dcc47a;
          border-radius: 50%;
          animation: resetSpin 0.8s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes resetSpin {
          to { transform: rotate(360deg); }
        }

        .loading-text {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: 14px;
          color: rgba(255,255,255,0.5);
          text-align: center;
        }

        .invalid-token-icon {
          width: 72px;
          height: 72px;
          margin: 0 auto 16px;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ef4444;
        }

        .invalid-title {
          font-family: 'Playfair Display SC', serif;
          font-size: 13px;
          letter-spacing: 0.1em;
          color: #ef4444;
          text-align: center;
          margin-bottom: 8px;
        }

        .invalid-text {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: 13px;
          color: rgba(255,255,255,0.45);
          text-align: center;
          line-height: 1.5;
        }
      `}</style>

      <div className="reset-root">
        {/* Background layers */}
        <div className="reset-aurora-layer">
          <div className="reset-aurora-orb reset-aurora-orb-1" />
          <div className="reset-aurora-orb reset-aurora-orb-2" />
          <div className="reset-aurora-orb reset-aurora-orb-3" />
        </div>

        <div className="reset-vignette" />
        <div className="reset-noise" />

        {stars.map((s) => (
          <div
            key={`star-${s.id}`}
            className="reset-star"
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

        {particles.map((p) => (
          <div
            key={`p-${p.id}`}
            className="reset-particle-gold"
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

        <motion.div
          className="reset-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Header */}
          <div className="reset-ornament">
            <div className="reset-ornament-line">
              <div className="reset-ornament-diamond" />
              <div className="reset-ornament-diamond" style={{ width: 5, height: 5, opacity: 0.5 }} />
              <div className="reset-ornament-diamond" />
            </div>

            <div className="reset-icon-ring">
              <div className="reset-icon-circle">
                <KeyRound size={28} strokeWidth={1.5} />
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="reset-title">Restablecer Contraseña</div>
              <div className="reset-subtitle">
                {isVerifying ? 'Verificando enlace...' : 
                 isTokenValid && userName ? `Hola, ${userName}` : 
                 'Crea una nueva contraseña segura'}
              </div>
            </motion.div>
          </div>

          {/* Main card */}
          <motion.div
            className="reset-form-card"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <AnimatePresence mode="wait">
              {/* Loading state */}
              {isVerifying && (
                <motion.div
                  key="verifying"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ padding: '20px 0', textAlign: 'center' }}
                >
                  <div className="loading-spinner" />
                  <div className="loading-text">Verificando enlace de recuperación...</div>
                </motion.div>
              )}

              {/* Invalid token */}
              {!isVerifying && !isTokenValid && !isSuccess && (
                <motion.div
                  key="invalid"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ padding: '16px 0', textAlign: 'center' }}
                >
                  <div className="invalid-token-icon">
                    <AlertCircle size={30} />
                  </div>
                  <div className="invalid-title">Enlace Inválido</div>
                  <div className="invalid-text">
                    Este enlace ha expirado o ya fue utilizado.<br />
                    Solicita uno nuevo desde la página de inicio de sesión.
                  </div>
                  <Link to="/login" className="reset-back-link" style={{ justifyContent: 'center', display: 'flex' }}>
                    <ArrowLeft size={14} />
                    Volver al inicio de sesión
                  </Link>
                </motion.div>
              )}

              {/* Success state */}
              {isSuccess && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ padding: '16px 0', textAlign: 'center' }}
                >
                  <motion.div
                    className="success-checkmark"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    style={{ animation: 'successPulse 2s ease-in-out infinite' }}
                  >
                    <ShieldCheck size={36} />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="success-text">
                      ¡Tu contraseña ha sido<br />
                      <span style={{ color: '#22c55e', fontWeight: 600 }}>restablecida exitosamente</span>!
                    </div>
                    <div className="success-redirect">
                      Redirigiendo al inicio de sesión...
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* Reset form */}
              {!isVerifying && isTokenValid && !isSuccess && (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <form onSubmit={handleSubmit(onSubmit)} className="reset-space-y">
                    {/* New Password */}
                    <div>
                      <label htmlFor="newPassword" className="reset-field-label">
                        Nueva Contraseña
                      </label>
                      <div className="reset-input-wrapper">
                        <input
                          id="newPassword"
                          type={showPassword ? 'text' : 'password'}
                          {...register('newPassword')}
                          className={`reset-field-input has-icon${errors.newPassword ? ' error' : ''}`}
                          placeholder="••••••••"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="reset-input-icon-btn"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <AnimatePresence>
                        {errors.newPassword && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="reset-error-msg"
                          >
                            <AlertCircle size={12} />
                            {errors.newPassword.message}
                          </motion.p>
                        )}
                      </AnimatePresence>

                      {/* Strength indicator */}
                      {watchPassword.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <div className="strength-bar-container">
                            {[0, 1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className="strength-bar-segment"
                                style={{
                                  background: i < passwordStrength
                                    ? strengthColors[passwordStrength - 1]
                                    : 'rgba(255,255,255,0.1)',
                                }}
                              />
                            ))}
                          </div>
                          <div
                            className="strength-label"
                            style={{ color: strengthColors[passwordStrength - 1] || 'rgba(255,255,255,0.3)' }}
                          >
                            {passwordStrength > 0 ? strengthLabels[passwordStrength - 1] : 'Muy débil'}
                          </div>
                        </motion.div>
                      )}

                      {/* Requirements checklist */}
                      <div className="reset-requirements">
                        {[
                          { label: '6+ caracteres', met: watchPassword.length >= 6 },
                          { label: 'Mayúscula', met: /[A-Z]/.test(watchPassword) },
                          { label: 'Número', met: /[0-9]/.test(watchPassword) },
                        ].map((req) => (
                          <div
                            key={req.label}
                            className="reset-req-item"
                            style={{ color: req.met ? 'rgba(34, 197, 94, 0.8)' : 'rgba(255,255,255,0.3)' }}
                          >
                            <div
                              className="reset-req-check"
                              style={{
                                background: req.met ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.05)',
                                border: `1px solid ${req.met ? 'rgba(34, 197, 94, 0.4)' : 'rgba(255,255,255,0.1)'}`,
                              }}
                            >
                              {req.met && <Check size={9} />}
                            </div>
                            {req.label}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label htmlFor="confirmPassword" className="reset-field-label">
                        Confirmar Contraseña
                      </label>
                      <div className="reset-input-wrapper">
                        <input
                          id="confirmPassword"
                          type={showConfirm ? 'text' : 'password'}
                          {...register('confirmPassword')}
                          className={`reset-field-input has-icon${errors.confirmPassword ? ' error' : ''}`}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="reset-input-icon-btn"
                          tabIndex={-1}
                        >
                          {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <AnimatePresence>
                        {errors.confirmPassword && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="reset-error-msg"
                          >
                            <AlertCircle size={12} />
                            {errors.confirmPassword.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Submit */}
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      className="reset-submit-btn"
                      whileTap={{ scale: 0.99 }}
                    >
                      <span className="reset-submit-inner">
                        {isLoading ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Restableciendo...
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={15} />
                            Restablecer Contraseña
                          </>
                        )}
                      </span>
                    </motion.button>
                  </form>

                  <div style={{ textAlign: 'center' }}>
                    <Link to="/login" className="reset-back-link">
                      <ArrowLeft size={14} />
                      Volver al inicio de sesión
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Footer */}
          <div className="reset-footer-text">
            © {new Date().getFullYear()} Church Program Manager
          </div>
        </motion.div>
      </div>
    </>
  )
}

export default ResetPasswordPage
