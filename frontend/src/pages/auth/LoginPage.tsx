import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { LogIn, Mail, Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import api, { BACKEND_URL } from '../../lib/api'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

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
          background: '#22c55e',
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
    <div className="min-h-screen flex">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0f2b46] relative overflow-hidden flex-col items-center justify-center p-12">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        
        {/* Glow effects */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 text-center max-w-md"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
            className="mb-8"
          >
            <img 
              src={LOGO_URL} 
              alt="Logo de la Iglesia" 
              className="w-36 h-36 mx-auto object-contain rounded-2xl shadow-2xl shadow-black/30 bg-white/10 p-2"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-extrabold text-white leading-tight mb-4 tracking-wide"
          >
            IGLESIA EVANGÉLICA<br />DIOS FUERTE ARCA EVANGÉLICA
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="w-16 h-0.5 bg-white/30 mx-auto mb-4"
          />

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-white/60 text-sm leading-relaxed"
          >
            C/ Principal No. 168, Manoguayabo<br />
            Santo Domingo Oeste, después del Mercado
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-10 pt-8 border-t border-white/10"
          >
            <p className="text-white/40 text-xs uppercase tracking-widest">Sistema de Gestión Eclesiástica</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-gray-50">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo (visible on small screens) */}
          <div className="lg:hidden text-center mb-8">
            <img 
              src={LOGO_URL} 
              alt="Logo de la Iglesia" 
              className="w-20 h-20 mx-auto object-contain rounded-xl shadow-lg mb-4"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
            <h2 className="text-lg font-bold text-[#0f2b46]">IGLESIA EVANGÉLICA DIOS FUERTE ARCA EVANGÉLICA</h2>
            <p className="text-xs text-gray-500 mt-1">C/ Principal No. 168, Manoguayabo, Santo Domingo Oeste</p>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Iniciar Sesión</h2>
            <p className="text-gray-500 mt-2">Ingresa tus credenciales para continuar</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  className="pl-10 h-12 bg-white border-gray-300 focus:border-[#0f2b46] focus:ring-[#0f2b46]/20 rounded-lg"
                  placeholder="correo@iglesia.com"
                  {...register('email')}
                />
                {errors.email && (
                  <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                )}
              </div>
              <AnimatePresence>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-red-600 flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {errors.email.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="pl-10 pr-12 h-12 bg-white border-gray-300 focus:border-[#0f2b46] focus:ring-[#0f2b46]/20 rounded-lg"
                  placeholder="••••••••"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <AnimatePresence>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-red-600 flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {errors.password.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Submit */}
            <motion.div whileTap={{ scale: 0.99 }}>
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-[#0f2b46] hover:bg-[#1a3d5c] shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Iniciar Sesión
                  </>
                )}
              </Button>
            </motion.div>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-10">
            © {new Date().getFullYear()} Sistema de Gestión Eclesiástica. Todos los derechos reservados.
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default LoginPage
