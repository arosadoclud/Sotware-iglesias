import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, Mail, Send } from 'lucide-react';
import { authApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';

type VerificationState = 'loading' | 'success' | 'error' | 'resending';

const VerifyEmailPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [state, setState] = useState<VerificationState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [redirectCountdown, setRedirectCountdown] = useState(3);

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
            
            // Countdown de 3 segundos
            let countdown = 3;
            setRedirectCountdown(countdown);
            
            const interval = setInterval(() => {
              countdown--;
              setRedirectCountdown(countdown);
              if (countdown === 0) {
                clearInterval(interval);
                navigate('/dashboard');
              }
            }, 1000);
            
            return () => clearInterval(interval);
          }
        }
      } catch (error: any) {
        setState('error');
        const message = error.response?.data?.message || 'Error al verificar el email';
        const code = error.response?.data?.error || '';
        const email = error.response?.data?.data?.email || '';
        
        setErrorMessage(message);
        setErrorCode(code);
        setUserEmail(email);
        
        // Si el token expiró, reenviar automáticamente
        if (code === 'TOKEN_EXPIRED' && email) {
          toast.info('Reenviando correo de verificación...');
          setTimeout(() => handleResendEmail(email), 1500);
        }
      }
    };

    verifyEmail();
  }, [token, navigate, setAuth]);

  const handleResendEmail = async (email?: string) => {
    const emailToUse = email || userEmail;
    
    if (!emailToUse) {
      toast.error('No se pudo obtener el email');
      return;
    }

    setState('resending');
    try {
      const response = await authApi.resendVerification(emailToUse);
      if (response.data.success) {
        toast.success('¡Correo reenviado! Revisa tu bandeja de entrada.');
        setState('error'); // Volver a estado error pero con mensaje de éxito
        setErrorMessage('Te hemos enviado un nuevo correo de verificación. Por favor revisa tu bandeja de entrada.');
      }
    } catch (error: any) {
      toast.error('Error al reenviar el correo');
      setState('error');
    }
  };

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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center px-4">
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">✅ ¡Email Verificado Correctamente!</h2>
          <p className="text-gray-600 mb-4">
            Tu cuenta ha sido activada exitosamente. ¡Bienvenido!
          </p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4"
          >
            <p className="text-blue-800 font-semibold mb-2">
              🚀 Ahora serás redirigido a tu cuenta
            </p>
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-blue-600 font-bold text-lg">{redirectCountdown}s</span>
            </div>
          </motion.div>
          <p className="text-sm text-gray-500">
            Si no eres redirigido automáticamente,{' '}
            <button 
              onClick={() => navigate('/dashboard')}
              className="text-blue-600 hover:underline font-semibold"
            >
              haz clic aquí
            </button>
          </p>
        </motion.div>
      </div>
    );
  }

  // Resending state
  if (state === 'resending') {
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
            <Send className="w-12 h-12 text-blue-600" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Reenviando Email...</h2>
          <p className="text-gray-600">Espera un momento</p>
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
          className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
            errorCode === 'TOKEN_EXPIRED' ? 'bg-amber-100' : 'bg-red-100'
          }`}
        >
          {errorCode === 'TOKEN_EXPIRED' ? (
            <Mail className="w-12 h-12 text-amber-600" />
          ) : (
            <XCircle className="w-12 h-12 text-red-600" />
          )}
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {errorCode === 'TOKEN_EXPIRED' ? 'Enlace Expirado' : 'Error de Verificación'}
        </h2>
        <p className="text-gray-600 mb-4">{errorMessage}</p>
        
        {errorCode !== 'TOKEN_EXPIRED' && (
          <p className="text-sm text-gray-500 mb-6">
            El enlace puede haber expirado o ya fue usado. Los enlaces de verificación expiran después de 72 horas (3 días).
          </p>
        )}
        
        <div className="flex flex-col gap-3">
          {userEmail && errorCode === 'TOKEN_EXPIRED' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleResendEmail()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Reenviar Correo de Verificación
            </motion.button>
          )}
          
          <Link
            to="/login"
            className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-50 hover:shadow-md transition-all inline-block"
          >
            Ir al Login
          </Link>
          
          <p className="text-sm text-gray-500 mt-2">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-blue-600 hover:underline font-semibold">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage;
