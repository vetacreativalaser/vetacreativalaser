
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { MailQuestion } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const { sendPasswordResetEmail } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await fetch('https://dspsrnprvrpjrkicxiso.functions.supabase.co/send-password-recovery-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      toast({ 
        title: "Correo de recuperación enviado", 
        description: `Si existe una cuenta asociada a ${email}, recibirás un correo con instrucciones para restablecer tu contraseña.` 
      });
      setEmail('');
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 p-8 sm:p-10 bg-white shadow-xl border border-gray-200"
      >
        <div>
          <MailQuestion className="mx-auto h-12 w-auto text-black" strokeWidth={1.5}/>
          <h2 className="mt-6 text-center text-3xl font-semibold tracking-tight text-black">
            ¿Olvidaste tu contraseña?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingresa tu correo electrónico y te enviaremos un enlace para restablecerla.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-1">
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
            <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800" disabled={isLoading}>
              {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </Button>
          </div>
        </form>
        <div className="mt-4 text-center text-sm">
          <Link to="/auth" className="font-medium text-black hover:underline">
            Volver a Iniciar Sesión
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
