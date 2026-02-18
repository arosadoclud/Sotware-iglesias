import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { LogIn, Mail, Lock, AlertCircle, Loader2, Eye, EyeOff, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import api, { BACKEND_URL } from '../../lib/api'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

const LOGO_URL = `${BACKEND_URL}/uploads/logo.png`

// ========================================
// 🎨 LOGINCARD COMPONENT (SEPARADO)
// ========================================
interface LoginCardProps {
  onSubmit: (data: LoginForm) => void
  isLoading: boolean
  errors: any
  register: any
  showPassword: boolean
  setShowPassword: (show: boolean) => void
}

const LoginCard = ({ onSubmit, isLoading, errors, register, showPassword, setShowPassword }: LoginCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="relative"
    >
      {/* Glassmorphism Card */}
      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 p-8 sm:p-10">
        {/* Glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0f2b46] via-[#1a4d7a] to-[#2563eb] rounded-3xl opacity-20 blur-xl -z-10" />

        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2 mb-3"
          >
            <Sparkles className="w-6 h-6 text-[#0f2b46]" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-[#0f2b46] to-[#1a4d7a] bg-clip-text text-transparent">
              Bienvenido
            </h2>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 text-sm"
          >
            Ingresa tus credenciales para acceder al sistema
          </motion.p>
        </div>

        {/* Form */}
        <form className="space-y-6">
          {/* Email Field */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-2"
          >
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
              Correo Electrónico
            </label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#0f2b46] transition-colors duration-200" />
              <input
                id="email"
                type="email"
                {...register('email')}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-[#0f2b46] focus:ring-4 focus:ring-[#0f2b46]/10 transition-all duration-200 outline-none"
                placeholder="tu@email.com"
              />
              {errors.email && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </motion.div>
              )}
            </div>
            <AnimatePresence>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-red-600 flex items-center gap-1.5 ml-1"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errors.email.message}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Password Field */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-2"
          >
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
              Contraseña
            </label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#0f2b46] transition-colors duration-200 z-10" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                className="w-full pl-12 pr-14 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-[#0f2b46] focus:ring-4 focus:ring-[#0f2b46]/10 transition-all duration-200 outline-none"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0f2b46] transition-all duration-200 focus:outline-none hover:scale-110 active:scale-95"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <AnimatePresence>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-red-600 flex items-center gap-1.5 ml-1"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errors.password.message}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <motion.button
              type="button"
              onClick={onSubmit}
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative w-full py-4 rounded-xl font-semibold text-white text-base overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0f2b46] via-[#1a4d7a] to-[#2563eb] group-hover:scale-105 transition-transform duration-300" />
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#2563eb] to-[#0f2b46] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Button Content */}
              <span className="relative flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Iniciar Sesión
                  </>
                )}
              </span>

              {/* Shine Effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </motion.button>
          </motion.div>
        </form>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-xs text-gray-500 mt-8"
        >
          © {new Date().getFullYear()} Church Program Manager
        </motion.p>
      </div>
    </motion.div>
  )
}

// ========================================
// 🎯 MAIN LOGIN PAGE
// ========================================
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
      toast.success('¡Bienvenido!', {
        icon: '👋',
        style: {
          background: '#0f2b46',
          color: '#fff',
        },
      })
      navigate('/')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al iniciar sesión', {
        icon: '❌',
        style: {
          background: '#ef4444',
          color: '#fff',
        },
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1f38] via-[#0f2b46] to-[#1a4d7a]">
        {/* Animated blobs */}
        <div className="absolute top-0 -left-4 w-96 h-96 bg-[#2563eb]/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-[#1a4d7a]/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-[#0f2b46]/40 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Geometric Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      {/* Main Content Container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            
            {/* Left Panel - Branding */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              {/* Logo with Glass Effect */}
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", bounce: 0.5, duration: 1 }}
                className="inline-block mb-8"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 blur-xl" />
                  <img 
                    src={LOGO_URL} 
                    alt="Church Logo" 
                    className="relative w-32 h-32 lg:w-40 lg:h-40 object-contain rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-4 shadow-2xl"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                </div>
              </motion.div>

              {/* Church Name */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="space-y-4 mb-8"
              >
                <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white leading-tight">
                  IGLESIA EVANGÉLICA<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-white">
                    DIOS FUERTE ARCA EVANGÉLICA
                  </span>
                </h1>
                
                <div className="flex items-center justify-center lg:justify-start gap-3">
                  <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/50" />
                  <div className="h-1.5 w-1.5 rounded-full bg-white/50" />
                  <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/50" />
                </div>

                <p className="text-white/70 text-sm lg:text-base max-w-md mx-auto lg:mx-0">
                  C/ Principal No. 168, Manoguayabo<br />
                  Santo Domingo Oeste, después del Mercado
                </p>
              </motion.div>

              {/* Badge */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span className="text-white/90 text-sm font-medium">Sistema de Gestión Eclesiástica</span>
              </motion.div>
            </motion.div>

            {/* Right Panel - Login Form */}
            <div className="flex items-center justify-center lg:justify-end">
              <div className="w-full max-w-md">
                <LoginCard
                  onSubmit={handleSubmit(onSubmit)}
                  isLoading={isLoading}
                  errors={errors}
                  register={register}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Custom animations for blobs */}
      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}

export default LoginPage
