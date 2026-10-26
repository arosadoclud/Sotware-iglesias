import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import {
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Mail,
  ArrowLeft,
  KeyRound,
  CheckCircle2
} from 'lucide-react'
import { BrandLogo } from '../../components/layout/BrandLogo'
import './registration.css'
import './login.css'
import { useAuthStore } from '../../store/authStore'
import api, { authApi } from '../../lib/api'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo es requerido')
    .email('Ingresa un correo electrónico válido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
})

const forgotSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo es requerido')
    .email('Ingresa un correo electrónico válido')
})

type ForgotForm = z.infer<typeof forgotSchema>

type LoginForm = z.infer<typeof loginSchema>

const LoginPage = () => {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [emailNotVerified, setEmailNotVerified] = useState(false)
  const [unverifiedEmail, setUnverifiedEmail] = useState('')
  const [resendingVerification, setResendingVerification] = useState(false)
  const [loginError, setLoginError] = useState('')

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  })

  const {
    register: registerForgot,
    handleSubmit: handleForgotSubmit,
    formState: { errors: forgotErrors },
    reset: resetForgot
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema)
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setLoginError('')
    try {
      const response = await api.post('/auth/login', data)
      const { user, accessToken } = response.data.data
      setAuth(user, accessToken)
      toast.success('¡Bienvenido!')
      navigate('/')
    } catch (error: any) {
      const data = error.response?.data
      if (data?.emailNotVerified) {
        setEmailNotVerified(true)
        setUnverifiedEmail(data.email)
      } else if (data?.field === 'email') {
        setError('email', {
          message: data.message || 'Este correo no está registrado'
        })
      } else if (data?.field === 'password') {
        setError('password', {
          message: data.message || 'Contraseña incorrecta'
        })
      } else {
        const msg = data?.message || 'Correo o contraseña incorrectos'
        setLoginError(msg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setResendingVerification(true)
    try {
      await authApi.resendVerification(unverifiedEmail)
      toast.success(
        'Email de verificación reenviado. Revisa tu bandeja de entrada.'
      )
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al reenviar el email'
      toast.error(msg)
    } finally {
      setResendingVerification(false)
    }
  }

  const onForgotSubmit = async (data: ForgotForm) => {
    setForgotLoading(true)
    try {
      await authApi.forgotPassword(data.email)
      setForgotSent(true)
      setForgotEmail(data.email)
    } catch {
      toast.error('Error al enviar la solicitud. Intenta de nuevo.')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleBackToLogin = () => {
    setShowForgot(false)
    setForgotSent(false)
    setForgotEmail('')
    resetForgot()
  }

  return (
    <main className="registration-page login-page">
      <aside className="registration-story">
        <BrandLogo />
        <div>
          <span className="registration-eyebrow">
            ARCA EVANGÉLICA · DIOS FUERTE
          </span>
          <h1>
            La fe nos une.
            <br />
            El propósito nos guía.
          </h1>
          <p>
            Bienvenido al espacio de nuestra iglesia. Aquí nos organizamos para
            servir mejor, juntos.
          </p>
        </div>
        <footer>Una comunidad que camina contigo.</footer>
      </aside>
      <section className="registration-panel">
        <span className="registration-eyebrow">BIENVENIDO A CASA</span>
        {!showForgot ? (
          <>
            <header>
              <h2>Qué bueno verte</h2>
              <p>Inicia sesión y conecta con tu comunidad.</p>
            </header>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <label htmlFor="login-email">Correo electrónico</label>
              <div className="registration-input">
                <Mail size={18} />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  placeholder="nombre@correo.com"
                  {...register('email')}
                  aria-invalid={!!errors.email}
                />
              </div>
              {errors.email && (
                <p className="registration-error">{errors.email.message}</p>
              )}
              <label htmlFor="login-password">Contraseña</label>
              <div className="registration-input">
                <KeyRound size={18} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                  {...register('password')}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  aria-label={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="registration-error">{errors.password.message}</p>
              )}
              <button
                type="button"
                className="login-forgot"
                onClick={() => setShowForgot(true)}
              >
                ¿Olvidaste tu contraseña?
              </button>
              {loginError && (
                <p role="alert" className="registration-server-error">
                  <AlertCircle size={18} />
                  {loginError}
                </p>
              )}
              {emailNotVerified && (
                <div role="alert" className="login-verification">
                  <strong>Confirma tu correo para continuar</strong>
                  <p>Revisa tu bandeja de entrada o solicita otro enlace.</p>
                  <button
                    type="button"
                    disabled={resendingVerification}
                    onClick={handleResendVerification}
                  >
                    {resendingVerification
                      ? 'Enviando…'
                      : 'Reenviar correo de verificación'}
                  </button>
                </div>
              )}
              <button
                type="submit"
                className="registration-submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Entrando…
                  </>
                ) : (
                  'Entrar a mi comunidad'
                )}
              </button>
            </form>
            <p className="registration-login">
              ¿Primera vez aquí? <Link to="/register">Crea tu cuenta</Link>
            </p>
          </>
        ) : (
          <>
            <button className="registration-back" onClick={handleBackToLogin}>
              <ArrowLeft size={14} /> Volver al acceso
            </button>
            <header>
              <h2>{forgotSent ? 'Revisa tu correo' : 'Recupera tu acceso'}</h2>
              <p>
                {forgotSent
                  ? 'Si existe una cuenta con ese correo, recibirás las instrucciones para crear una nueva contraseña.'
                  : 'Escribe el correo de tu cuenta y te ayudaremos a volver.'}
              </p>
            </header>
            {forgotSent ? (
              <div className="login-recovery-success" role="status">
                <CheckCircle2 size={32} />
                <strong>{forgotEmail}</strong>
                <p>Revisa también la carpeta de correo no deseado.</p>
                <button
                  className="registration-submit"
                  onClick={handleBackToLogin}
                >
                  Volver a iniciar sesión
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit(onForgotSubmit)} noValidate>
                <label htmlFor="recovery-email">Correo electrónico</label>
                <div className="registration-input">
                  <Mail size={18} />
                  <input
                    id="recovery-email"
                    type="email"
                    autoComplete="email"
                    {...registerForgot('email')}
                  />
                </div>
                {forgotErrors.email && (
                  <p className="registration-error">
                    {forgotErrors.email.message}
                  </p>
                )}
                <button
                  className="registration-submit"
                  disabled={forgotLoading}
                >
                  {forgotLoading ? 'Enviando…' : 'Enviar instrucciones'}
                </button>
              </form>
            )}
          </>
        )}
        <p className="login-signature">
          ARCA EVANGÉLICA <span>·</span> DIOS FUERTE
        </p>
      </section>
    </main>
  )
}
export default LoginPage
