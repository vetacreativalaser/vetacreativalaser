import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const AuthPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialMode = searchParams.get('mode') || 'login';
  const [mode, setMode] = useState(initialMode); // 'login' or 'register'

  useEffect(() => {
    setMode(searchParams.get('mode') || 'login');
  }, [searchParams]);

  const toggleMode = (newMode) => {
    setMode(newMode);
    setSearchParams({ mode: newMode });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-8 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {mode === 'login' ? <Login isAuthPageContext={true} /> : <Register isAuthPageContext={true} />}
        
        <div className="mt-6 text-center">
          {mode === 'login' ? (
            <p className="text-sm text-gray-600">
              ¿No tienes una cuenta?{' '}
              <Button variant="link" onClick={() => toggleMode('register')} className="font-medium text-black p-0 h-auto hover:underline">
                Regístrate aquí
              </Button>
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <Button variant="link" onClick={() => toggleMode('login')} className="font-medium text-black p-0 h-auto hover:underline">
                Inicia sesión aquí
              </Button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;