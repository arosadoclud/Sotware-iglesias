import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import './registration.css'
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import { authApi } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { BrandLogo } from '../../components/layout/BrandLogo'

// Lista de contraseñas comunes que deben ser rechazadas (todas en minúsculas)
const COMMON_PASSWORDS = [
  '12345678',
  'password',
  'password123',
  'qwerty123',
  '123456789',
  'abc123',
  'admin123',
  'password1',
  'welcome',
  'qwerty',
  'letmein',
  'monkey',
  '1234567',
  'dragon',
  'master',
  'iloveyou',
  'sunshine',
  'princess',
  'football',
  'shadow',
  'superman',
  'baseball',
  'trustno1',
  'freedom',
  'whatever',
  'starwars',
  'hello',
  'batman',
  'passw0rd',
  'killer',
  'password!',
  'pass1234',
  'iglesia1',
  'iglesia123',
  'pastor123',
  'admin1234',
  'administrador',
  'usuario123',
  'password1',
  'qwerty123',
  'admin123',
  'user1234',
  '12345678a'
]

const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .transform((val) => val.trim()),
    email: z
      .string()
      .email('Email inválido')
      .transform((val) => val.trim().toLowerCase()),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string().min(8, 'Confirma tu contraseña')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword']
  })

type RegisterForm = z.infer<typeof registerSchema>

const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [serverError, setServerError] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  })

  const password = watch('password')
  const email = watch('email')
  const name = watch('name')
  const confirmPassword = watch('confirmPassword')

  // Limpiar error del servidor cuando el usuario empiece a escribir
  useEffect(() => {
    if (serverError) {
      setServerError('')
    }
  }, [email, password, name])

  // Validaciones de contraseña en tiempo real
  const passwordRequirements = [
    { label: 'Mínimo 8 caracteres', valid: password?.length >= 8 },
    { label: 'Contiene mayúscula', valid: /[A-Z]/.test(password || '') },
    { label: 'Contiene minúscula', valid: /[a-z]/.test(password || '') },
    { label: 'Contiene un número', valid: /[0-9]/.test(password || '') },
    {
      label: 'No es contraseña común',
      valid: password
        ? !COMMON_PASSWORDS.includes(password.toLowerCase())
        : false
    }
  ]

  // Verificar si todos los requisitos se cumplen
  const allPasswordRequirementsValid = passwordRequirements.every(
    (req) => req.valid
  )

  // Verificar si el formulario puede ser enviado
  const canSubmit =
    allPasswordRequirementsValid &&
    email &&
    name &&
    confirmPassword &&
    password === confirmPassword &&
    !isLoading

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    setServerError('') // Limpiar error anterior
    try {
      const response = await authApi.register({
        email: data.email,
        password: data.password,
        name: data.name
      })

      if (response.data.success) {
        // Si tiene emailSent, es registro público que requiere verificación
        if (response.data.data.emailSent) {
          setRegisteredEmail(data.email)
          setSuccessMessage(true)
          toast.success('¡Registro exitoso! Verifica tu email')
        } else {
          // Si tiene accessToken, es registro por admin (login automático)
          const { user, accessToken } = response.data.data
          setAuth(user, accessToken)
          toast.success('¡Registro exitoso! Bienvenido')
          setTimeout(() => {
            navigate('/')
          }, 1500)
        }
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Error al registrar usuario'
      setServerError(message) // Mostrar error en el formulario
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="registration-page">
      <aside className="registration-story">
        <BrandLogo />
        <div>
          <span className="registration-eyebrow">
            ARCA EVANGÉLICA · DIOS FUERTE
          </span>
          <h1>
            Una comunidad.
            <br />
            Un mismo propósito.
          </h1>
          <p>
            Un espacio para conectar, servir y compartir la vida de nuestra
            iglesia.
          </p>
        </div>
        <footer>Fe que nos une. Amor que nos mueve.</footer>
      </aside>
      <section className="registration-panel">
        <Link to="/login" className="registration-back">
          ← Volver a iniciar sesión
        </Link>
        {successMessage ? (
          <div className="registration-success" role="status">
            <Mail size={42} />
            <span className="registration-eyebrow">UN PASO MÁS</span>
            <h2>Revisa tu correo</h2>
            <p>
              Enviamos un enlace de confirmación a{' '}
              <strong>{registeredEmail}</strong>.
            </p>
            <p>
              Ábrelo para activar tu cuenta. Está disponible durante 72 horas.
              Revisa también la carpeta de correo no deseado.
            </p>
            <Link to="/login" className="registration-submit">
              Ir a iniciar sesión
            </Link>
          </div>
        ) : (
          <>
            <header>
              <span className="registration-eyebrow">
                BIENVENIDO A NUESTRA IGLESIA
              </span>
              <h2>Crea tu cuenta</h2>
              <p>Nos alegra que formes parte de nuestra comunidad.</p>
            </header>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <label htmlFor="register-name">Nombre completo</label>
              <div className="registration-input">
                <User size={18} />
                <input
                  id="register-name"
                  autoComplete="name"
                  placeholder="Tu nombre y apellido"
                  {...register('name')}
                  aria-invalid={!!errors.name}
                />
              </div>
              {errors.name && (
                <p className="registration-error">{errors.name.message}</p>
              )}
              <label htmlFor="register-email">Correo electrónico</label>
              <div className="registration-input">
                <Mail size={18} />
                <input
                  id="register-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="nombre@correo.com"
                  {...register('email')}
                  aria-invalid={!!errors.email}
                />
              </div>
              {errors.email && (
                <p className="registration-error">{errors.email.message}</p>
              )}
              <label htmlFor="register-password">Contraseña</label>
              <div className="registration-input">
                <Lock size={18} />
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('password')}
                  aria-describedby="password-requirements"
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
              <ul
                id="password-requirements"
                className="registration-requirements"
              >
                {passwordRequirements.map((requirement) => (
                  <li
                    key={requirement.label}
                    className={requirement.valid ? 'valid' : ''}
                  >
                    <CheckCircle2 size={14} />
                    {requirement.label}
                  </li>
                ))}
              </ul>
              <label htmlFor="register-confirm">Confirmar contraseña</label>
              <div className="registration-input">
                <Lock size={18} />
                <input
                  id="register-confirm"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  aria-invalid={!!errors.confirmPassword}
                />
                <button
                  type="button"
                  aria-label="Mostrar u ocultar confirmación"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="registration-error">
                  {errors.confirmPassword.message}
                </p>
              )}
              {serverError && (
                <div role="alert" className="registration-server-error">
                  <XCircle size={20} />
                  <div>
                    <strong>No pudimos completar el registro</strong>
                    <p>{serverError}</p>
                  </div>
                </div>
              )}
              <button
                className="registration-submit"
                type="submit"
                disabled={!canSubmit}
              >
                <UserPlus size={19} />
                {isLoading ? 'Creando tu cuenta…' : 'Crear mi cuenta'}
              </button>
              <p className="registration-note">
                Al registrarte, recibirás un correo para confirmar tu cuenta.
              </p>
            </form>
            <p className="registration-login">
              ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
            </p>
          </>
        )}
      </section>
    </main>
  )
}
export default RegisterPage
