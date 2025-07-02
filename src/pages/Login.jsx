import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const Login = ({ isAuthPageContext = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast({ title: "Faltan datos", description: "Completa todos los campos", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      // 🔐 Cerrar sesión previa para evitar errores 403
      await supabase.auth.signOut();

      const { error } = await login({ email, password });

      if (error) {
        throw new Error(error.message || 'Correo o contraseña incorrectos.');
      }

      toast({ title: "Inicio de sesión exitoso", description: "¡Bienvenido de nuevo!" });
      navigate('/perfil');

    } catch (error) {
      toast({
        title: "Error de inicio de sesión",
        description: error.message || "No se pudo iniciar sesión.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const containerClasses = isAuthPageContext
    ? "w-full space-y-8 p-8 sm:p-10 bg-white shadow-xl border border-gray-200"
    : "min-h-screen flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 bg-gray-50";

  const motionDivClasses = isAuthPageContext
    ? containerClasses
    : "max-w-md w-full space-y-8 p-8 sm:p-10 bg-white shadow-xl border border-gray-200";

  return (
    <div className={!isAuthPageContext ? containerClasses : ""}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={motionDivClasses}
      >
        <div>
          <LogIn className="mx-auto h-12 w-auto text-black" strokeWidth={1.5} />
          <h2 className="mt-6 text-center text-3xl font-semibold tracking-tight text-black">
            Inicia sesión en tu cuenta
          </h2>
          {!isAuthPageContext && (
            <p className="mt-2 text-center text-sm text-gray-600">
              O{' '}
              <Link to="/auth?mode=register" className="font-medium text-black hover:underline">
                crea una cuenta nueva
              </Link>
            </p>
          )}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email-address">Correo electrónico</Label>
              <Input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 border-gray-300 focus:border-black focus:ring-black"
                placeholder="tu.email@ejemplo.com"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 border-gray-300 focus:border-black focus:ring-black"
                placeholder="Tu contraseña"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex items-center justify-end text-sm">
            <Link to="/forgot-password" className="font-medium text-black hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full bg-black text-white hover:bg-gray-800"
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
