import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { Mail, Lock, AlertCircle, Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import api, { BACKEND_URL } from '../../lib/api'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

const LOGO_URL = `${BACKEND_URL}/uploads/logo.png`

const LoginPage = () => {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

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

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Left Panel - Visual */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] bg-[#0f2b46] relative overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f2b46] via-[#132f4c] to-[#0a1f35]" />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />

        {/* Accent circles */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-48 h-48 bg-blue-400/8 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Top: Logo + Brand */}
          <div className="flex items-center gap-3">
            <img
              src={LOGO_URL}
              alt="Logo"
              className="w-10 h-10 rounded-lg object-contain bg-white/10 p-1"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <span className="text-white/90 font-semibold text-sm tracking-wide">
              Church Program Manager
            </span>
          </div>

          {/* Center: Main message */}
          <div className="space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl xl:text-5xl font-bold text-white leading-[1.15] tracking-tight"
            >
              Gestión integral
              <br />
              <span className="text-blue-300">para tu iglesia.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="text-white/50 text-base leading-relaxed max-w-sm"
            >
              Administra miembros, programas, finanzas y actividades
              desde un solo lugar.
            </motion.p>

            {/* Feature pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap gap-2 pt-2"
            >
              {['Miembros', 'Finanzas', 'Programas', 'Reportes'].map((item) => (
                <span
                  key={item}
                  className="px-3 py-1.5 text-xs font-medium text-white/70 bg-white/[0.06] rounded-full border border-white/[0.08]"
                >
                  {item}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Bottom: Footer */}
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} Church Program Manager
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full max-w-[400px]"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <img
              src={LOGO_URL}
              alt="Logo"
              className="w-10 h-10 rounded-lg object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <span className="font-semibold text-[#0f2b46] text-sm">Church Program Manager</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#0f2b46] tracking-tight">
              Iniciar sesión
            </h2>
            <p className="text-gray-500 text-sm mt-1.5">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <div className="relative">
                <div className={`absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none transition-colors duration-150 ${focusedField === 'email' ? 'text-[#0f2b46]' : 'text-gray-400'}`}>
                  <Mail className="w-[18px] h-[18px]" />
                </div>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full h-11 pl-10 pr-4 text-sm bg-white border rounded-lg outline-none transition-all duration-150 ${
                    errors.email
                      ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                      : 'border-gray-200 hover:border-gray-300 focus:border-[#0f2b46] focus:ring-2 focus:ring-[#0f2b46]/10'
                  }`}
                  placeholder="nombre@ejemplo.com"
                />
              </div>
              <AnimatePresence>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-xs text-red-500 flex items-center gap-1 pt-0.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.email.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="relative">
                <div className={`absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none transition-colors duration-150 ${focusedField === 'password' ? 'text-[#0f2b46]' : 'text-gray-400'}`}>
                  <Lock className="w-[18px] h-[18px]" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full h-11 pl-10 pr-11 text-sm bg-white border rounded-lg outline-none transition-all duration-150 ${
                    errors.password
                      ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                      : 'border-gray-200 hover:border-gray-300 focus:border-[#0f2b46] focus:ring-2 focus:ring-[#0f2b46]/10'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 bottom-0 w-11 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
              <AnimatePresence>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-xs text-red-500 flex items-center gap-1 pt-0.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.password.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#0f2b46] hover:bg-[#163a5e] text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  Continuar
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-8 lg:hidden">
            © {new Date().getFullYear()} Church Program Manager
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default LoginPage
