import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { KeyRound } from 'lucide-react';

const ResetPasswordPage = () => {
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [tokenValid, setTokenValid] = useState(null); // null: checking, true: valid, false: invalid
  const [token, setToken] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');

    if (!tokenFromUrl) {
      setTokenValid(false);
      return;
    }

    setToken(tokenFromUrl);

    // Validar token con función Supabase
    fetch('https://dspsrnprvrpjrkicxiso.functions.supabase.co/verify-reset-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: tokenFromUrl })
    })
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
        }
      })
      .catch(() => setTokenValid(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Las contraseñas no coinciden.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "La contraseña debe tener al menos 6 caracteres.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('https://dspsrnprvrpjrkicxiso.functions.supabase.co/reset-password-from-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });

      const result = await res.json();

      if (res.ok && result.success) {
        toast({ 
          title: "Contraseña restablecida", 
          description: "Tu contraseña ha sido actualizada exitosamente." 
        });
        navigate('/auth?mode=login');
      } else {
        throw new Error(result.error || "No se pudo restablecer la contraseña.");
      }
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
          <KeyRound className="mx-auto h-12 w-auto text-black" strokeWidth={1.5}/>
          <h2 className="mt-6 text-center text-3xl font-semibold tracking-tight text-black">
            Restablecer Contraseña
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Crea una nueva contraseña para tu cuenta.
          </p>
        </div>

        {tokenValid === false ? (
          <p className="text-red-500 text-sm text-center">
            El enlace ya fue usado o ha caducado. Solicita uno nuevo.
          </p>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-password">Nueva contraseña</Label>
                <Input
                  id="new-password"
                  name="newPassword"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 border-gray-300 focus:border-black focus:ring-black"
                  placeholder="Nueva contraseña"
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirmar nueva contraseña</Label>
                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 border-gray-300 focus:border-black focus:ring-black"
                  placeholder="Confirmar contraseña"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800" disabled={isLoading || tokenValid !== true}>
                {isLoading ? 'Restableciendo...' : 'Restablecer Contraseña'}
              </Button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
