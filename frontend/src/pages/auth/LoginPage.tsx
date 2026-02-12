import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { LogIn, Mail, Lock, Church, AlertCircle, Loader2, Info } from 'lucide-react'
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

const LoginPage = () => {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo grande centrado */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl"
          >
            <Church className="w-10 h-10 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-3xl font-bold text-neutral-900"
          >
            Bienvenido
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-neutral-600 mt-2"
          >
            Sistema de Gestión de Programas
          </motion.p>
        </div>

        {/* Card con formulario */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Card className="backdrop-blur-sm bg-white/90 border-neutral-200 shadow-2xl">
            <CardHeader>
              <CardTitle>Iniciar Sesión</CardTitle>
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
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <Input
                      id="password"
                      type="password"
                      className="pl-10"
                      placeholder="••••••••"
                      {...register('password')}
                    />
                    {errors.password && (
                      <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-danger-500" />
                    )}
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
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl"
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
              </form>

              {/* Demo credentials */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-lg"
              >
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-primary-900 mb-2">
                      Credenciales de prueba
                    </p>
                    <div className="space-y-1 text-sm text-primary-700">
                      <p>
                        📧 Email:{' '}
                        <code className="bg-primary-100 px-2 py-0.5 rounded font-mono">
                          admin@iglesia.com
                        </code>
                      </p>
                      <p>
                        🔑 Contraseña:{' '}
                        <code className="bg-primary-100 px-2 py-0.5 rounded font-mono">
                          password123
                        </code>
                      </p>
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
          className="text-center text-sm text-neutral-500 mt-6"
        >
          © 2024 Church Program Manager. Todos los derechos reservados.
        </motion.p>
      </motion.div>
    </div>
  )
}

export default LoginPage
