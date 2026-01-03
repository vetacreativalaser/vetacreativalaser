import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit3, Save, Mail, Check, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Link } from 'react-router-dom';

const PersonalInfoTab = ({ user, formData, setFormData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditToggle = () => {
    if (isEditing) handleSaveProfile();
    else {
      setIsEditing(true);
      setErrorMessage('');
    }
  };

  const handleSaveProfile = async () => {
    setErrorMessage('');

    if (!currentPassword) {
      setErrorMessage('Por favor, introduce tu contraseña actual para confirmar los cambios.');
      return;
    }

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (authError) {
        setErrorMessage('Contraseña incorrecta. Por favor, verifica tu contraseña.');
        return;
      }

      await supabase.auth.updateUser({
        data: { name: formData.name, phone: formData.phone }
      });

      await supabase
        .from('profiles')
        .update({ name: formData.name, phone: formData.phone })
        .eq('email', user.email);

      setIsEditing(false);
      setCurrentPassword('');
      setErrorMessage('');
      alert('Perfil actualizado correctamente');
    } catch (error) {
      setErrorMessage('Error al actualizar el perfil. Inténtalo de nuevo.');
    }
  };

  const handlePasswordChange = async () => {
    setErrorMessage('');
    setPasswordUpdated(false);

    // Validaciones
    if (!newPassword || !confirmPassword) {
      setErrorMessage('Por favor, completa todos los campos de contraseña.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden. Verifica e inténtalo de nuevo.');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        setErrorMessage('Error al actualizar la contraseña. Inténtalo más tarde.');
        setIsUpdatingPassword(false);
        return;
      }

      setPasswordUpdated(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordUpdated(false), 3000);
    } catch (error) {
      setErrorMessage('Error al actualizar la contraseña. Inténtalo de nuevo.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{errorMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Datos de contacto */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Datos de contacto</h2>

          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Nombre completo
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Correo electrónico
            </Label>
            <Input
              id="email"
              name="email"
              value={formData.email}
              disabled
              className="mt-1 bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              El correo electrónico no se puede modificar
            </p>
          </div>

          <div>
            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
              Teléfono
            </Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="mt-1"
              placeholder="Ej: +34 600 000 000"
            />
          </div>

          {isEditing && (
            <div>
              <Label htmlFor="currentPasswordEdit" className="text-sm font-medium text-gray-700">
                Contraseña actual *
              </Label>
              <Input
                id="currentPasswordEdit"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1"
                placeholder="Introduce tu contraseña"
              />
              <p className="text-xs text-gray-500 mt-1">
                Requerida para confirmar los cambios
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleEditToggle}
              variant={isEditing ? 'default' : 'outline'}
              className="flex-1"
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar cambios
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Editar perfil
                </>
              )}
            </Button>
            {isEditing && (
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setCurrentPassword('');
                  setErrorMessage('');
                }}
                variant="ghost"
              >
                Cancelar
              </Button>
            )}
          </div>

          {!isEditing && (
            <Link to="/forgot-password">
              <Button variant="link" className="text-sm text-gray-600 hover:text-gray-900 p-0 h-auto">
                ¿Olvidaste tu contraseña?
              </Button>
            </Link>
          )}
        </div>

        {/* Cambiar contraseña */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Cambiar contraseña</h2>
          <p className="text-sm text-gray-600">
            La contraseña debe tener al menos 6 caracteres
          </p>

          <div>
            <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
              Nueva contraseña
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              Confirmar nueva contraseña
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1"
              placeholder="Repite la contraseña"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handlePasswordChange}
              variant="default"
              disabled={isUpdatingPassword}
              className="flex-1"
            >
              {isUpdatingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Actualizando...
                </>
              ) : (
                'Actualizar contraseña'
              )}
            </Button>

            {passwordUpdated && (
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                <span className="text-sm font-medium">Actualizada</span>
              </div>
            )}
          </div>
        </div>

        {/* Contacto */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Soporte</h2>
          <p className="text-sm text-gray-600">
            ¿Tienes alguna duda o problema? Estamos aquí para ayudarte.
          </p>
          <a
            href="https://mail.google.com/mail/?view=cm&to=vetacreativalaser@gmail.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-gray-900 hover:text-gray-700 font-medium"
          >
            <Mail className="w-4 h-4" />
            vetacreativalaser@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoTab;
