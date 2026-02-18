import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';
import { authApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

type VerificationState = 'loading' | 'success' | 'error';

const VerifyEmailPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [state, setState] = useState<VerificationState>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setState('error');
        setErrorMessage('Token de verificación no válido');
        return;
      }

      try {
        const response = await authApi.verifyEmail(token);

        if (response.data.success) {
          setState('success');
          
          // Si la respuesta incluye token de acceso, hacer login automático
          if (response.data.data.accessToken) {
            const { user, accessToken } = response.data.data;
            setAuth(user, accessToken);
            
            // Redirigir al dashboard después de 2 segundos
            setTimeout(() => {
              navigate('/dashboard');
            }, 2000);
          }
        }
      } catch (error: any) {
        setState('error');
        const message = error.response?.data?.message || 'Error al verificar el email';
        setErrorMessage(message);
      }
    };

    verifyEmail();
  }, [token, navigate, setAuth]);

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4"
          >
            <Loader2 className="w-12 h-12 text-blue-600" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Verificando Email...</h2>
          <p className="text-gray-600">Por favor espera un momento</p>
        </motion.div>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4"
          >
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Email Verificado!</h2>
          <p className="text-gray-600 mb-4">
            Tu cuenta ha sido activada exitosamente. Bienvenido a Church Program Manager.
          </p>
          <p className="text-sm text-gray-500">Redirigiendo al dashboard...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4"
        >
          <XCircle className="w-12 h-12 text-red-600" />
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Error de Verificación</h2>
        <p className="text-gray-600 mb-4">{errorMessage}</p>
        <p className="text-sm text-gray-500 mb-6">
          El enlace puede haber expirado o ya fue usado. Los enlaces de verificación expiran después de 24 horas.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            to="/login"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg transition-all inline-block"
          >
            Ir al Login
          </Link>
          <p className="text-sm text-gray-500">
            ¿Necesitas un nuevo enlace?{' '}
            <Link to="/register" className="text-blue-600 hover:underline font-semibold">
              Regístrate nuevamente
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage;
