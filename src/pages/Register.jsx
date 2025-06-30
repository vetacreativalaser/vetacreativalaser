
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus } from 'lucide-react';
console.log('🚪 Entrando en register');

const Register = ({ isAuthPageContext = false }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Error de registro", description: "Las contraseñas no coinciden.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await register({ name, email, phone, password });
      toast({ title: "Registro exitoso", description: `¡Bienvenido, ${name}! Revisa tu correo para confirmar tu cuenta.` });
      navigate('/perfil');
    } catch (error) {
      toast({ title: "Error de registro", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const containerClasses = isAuthPageContext 
    ? "w-full space-y-8 p-8 sm:p-10 bg-white shadow-xl border border-gray-200"
    : "min-h-screen flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 bg-gray-50";
  
  const motionDivClasses = isAuthPageContext ? "" : "max-w-md w-full space-y-8 p-8 sm:p-10 bg-white shadow-xl border border-gray-200";

  return (
    <div className={!isAuthPageContext ? containerClasses : ""}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={isAuthPageContext ? containerClasses : motionDivClasses}
      >
        <div>
          <UserPlus className="mx-auto h-12 w-auto text-black" strokeWidth={1.5}/>
          <h2 className="mt-6 text-center text-3xl font-semibold tracking-tight text-black">
            Crea tu cuenta
          </h2>
          {!isAuthPageContext && (
            <p className="mt-2 text-center text-sm text-gray-600">
              ¿Ya tienes una?{' '}
              <Link to="/auth?mode=login" className="font-medium text-black hover:underline">
                Inicia sesión aquí
              </Link>
            </p>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre completo</Label>
              <Input id="name" name="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 border-gray-300 focus:border-black focus:ring-black" placeholder="Tu nombre completo" disabled={isLoading}/>
            </div>
            <div>
              <Label htmlFor="email-address">Correo electrónico</Label>
              <Input id="email-address" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 border-gray-300 focus:border-black focus:ring-black" placeholder="tu.email@ejemplo.com" disabled={isLoading}/>
            </div>
            <div>
              <Label htmlFor="phone">Número de teléfono (Opcional)</Label>
              <Input id="phone" name="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 border-gray-300 focus:border-black focus:ring-black" placeholder="Tu número de teléfono" disabled={isLoading}/>
            </div>
            <div>
              <Label htmlFor="password">Contraseña (mín. 6 caracteres)</Label>
              <Input id="password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 border-gray-300 focus:border-black focus:ring-black" placeholder="Crea una contraseña" disabled={isLoading}/>
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirmar contraseña</Label>
              <Input id="confirm-password" name="confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 border-gray-300 focus:border-black focus:ring-black" placeholder="Confirma tu contraseña" disabled={isLoading}/>
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800" disabled={isLoading}>
              {isLoading ? 'Registrando...' : 'Registrarse'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Register;
