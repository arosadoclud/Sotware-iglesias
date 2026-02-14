import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { LogIn, Mail, Lock, Church, AlertCircle, Loader2, Info, Eye, EyeOff, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import api from '../../lib/api'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

// Floating particles animation
const FloatingParticle = ({ delay, duration, size, left, top }: any) => (
  <motion.div
    className="absolute rounded-full bg-primary-400/20"
    style={{ width: size, height: size, left: `${left}%`, top: `${top}%` }}
    animate={{
      y: [0, -30, 0],
      x: [0, 15, 0],
      opacity: [0.3, 0.6, 0.3],
      scale: [1, 1.2, 1],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  />
)

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600/10 rounded-full blur-3xl" />
        
        {/* Floating particles */}
        <FloatingParticle delay={0} duration={6} size={8} left={10} top={20} />
        <FloatingParticle delay={1} duration={7} size={6} left={80} top={15} />
        <FloatingParticle delay={2} duration={8} size={10} left={70} top={60} />
        <FloatingParticle delay={3} duration={6} size={5} left={20} top={70} />
        <FloatingParticle delay={4} duration={9} size={7} left={50} top={30} />
        <FloatingParticle delay={5} duration={7} size={9} left={30} top={85} />
        <FloatingParticle delay={1.5} duration={8} size={6} left={85} top={80} />
        <FloatingParticle delay={2.5} duration={6} size={8} left={15} top={45} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo grande centrado */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
            className="relative w-20 h-20 mx-auto mb-6"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl rotate-6 opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary-500/50">
              <Church className="w-10 h-10 text-white" />
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-1 border-2 border-dashed border-primary-400/30 rounded-2xl"
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-primary-500/20 rounded-full mb-4"
          >
            <Sparkles className="w-4 h-4 text-primary-300" />
            <span className="text-sm text-primary-200">Sistema de Gestión</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl font-bold text-white mb-2"
          >
            Bienvenido
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-primary-200"
          >
            Programa de Oportunidades
          </motion.p>
        </div>

        {/* Card con formulario */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", bounce: 0.3 }}
        >
          <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Iniciar Sesión</CardTitle>
              <CardDescription>Ingresa tus credenciales para continuar</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-10"
                      placeholder="pastor@iglesia.com"
                      {...register('email')}
                    />
                    {errors.email && (
                      <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-danger-500" />
                    )}
                  </div>
                  <AnimatePresence>
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-danger-600 flex items-center gap-2"
                      >
                        <AlertCircle className="w-4 h-4" />
                        {errors.email.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 z-10" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className="pl-10 pr-12"
                      placeholder="••••••••"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <AnimatePresence>
                    {errors.password && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-danger-600 flex items-center gap-2"
                      >
                        <AlertCircle className="w-4 h-4" />
                        {errors.password.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Submit Button */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transition-all duration-200"
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

              {/* Demo credentials */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-purple-50 border border-primary-200/50 rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Info className="h-4 w-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary-900 mb-2">
                      Credenciales de prueba
                    </p>
                    <div className="space-y-2 text-sm text-primary-700">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary-500" />
                        <code className="bg-white/80 px-2 py-1 rounded font-mono text-xs">
                          admin@iglesia.com
                        </code>
                      </div>
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-primary-500" />
                        <code className="bg-white/80 px-2 py-1 rounded font-mono text-xs">
                          password123
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="text-center text-sm text-primary-200/60 mt-8"
        >
          © 2024 Sistema de Gestión de Programas. Todos los derechos reservados.
        </motion.p>
      </motion.div>
    </div>
  )
}

export default LoginPage
