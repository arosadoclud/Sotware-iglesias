import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { LogIn } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import api from '../../lib/api'

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
      console.log('Respuesta login:', response)
      const { user, accessToken } = response.data.data

      setAuth(user, accessToken)
      toast.success('¡Bienvenido!')
      navigate('/')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Iniciar Sesión</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            {...register('email')}
            className="input"
            placeholder="tu@email.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contraseña
          </label>
          <input
            type="password"
            {...register('password')}
            className="input"
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn btn-primary flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Iniciando sesión...
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              Iniciar Sesión
            </>
          )}
        </button>
      </form>

      {/* Demo credentials */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-900 font-medium mb-2">
          Credenciales de prueba:
        </p>
        <p className="text-xs text-blue-700">Email: admin@iglesia.com</p>
        <p className="text-xs text-blue-700">Contraseña: password123</p>
      </div>
    </div>
  )
}

export default LoginPage
