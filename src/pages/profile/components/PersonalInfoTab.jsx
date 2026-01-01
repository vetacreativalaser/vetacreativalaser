import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit3, Save, Mail, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Link } from 'react-router-dom';

const PersonalInfoTab = ({ user, formData, setFormData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditToggle = () => {
    if (isEditing) handleSaveProfile();
    else setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!currentPassword) return alert('Introduce tu contraseña para confirmar.');

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    });
    if (authError) return alert('Contraseña incorrecta.');

    await supabase.auth.updateUser({
      data: { name: formData.name, phone: formData.phone }
    });
    await supabase
      .from('profiles')
      .update({ name: formData.name, phone: formData.phone })
      .eq('email', user.email);

    setIsEditing(false);
    setCurrentPassword('');
    alert('Perfil actualizado correctamente');
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) {
      return alert('Verifica las contraseñas.');
    }

    setIsUpdatingPassword(true);
    setPasswordUpdated(false);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    setIsUpdatingPassword(false);

    if (!error) {
      setPasswordUpdated(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordUpdated(false), 3000);
    } else {
      alert('Error al actualizar la contraseña.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Datos de contacto */}
      <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl space-y-4 hover:shadow-md transition-shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Datos de contacto</h2>

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
            className="mt-1 bg-gray-50"
          />
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
          />
        </div>

        {isEditing && (
          <div>
            <Label htmlFor="currentPasswordEdit" className="text-sm font-medium text-gray-700">
              Contraseña actual
            </Label>
            <Input
              id="currentPasswordEdit"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1"
            />
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
      <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl space-y-4 hover:shadow-md transition-shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Cambiar contraseña</h2>

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
          />
        </div>

        <div>
          <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
            Contraseña actual
          </Label>
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="mt-1"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            onClick={handlePasswordChange}
            variant="default"
            disabled={isUpdatingPassword}
            className="flex-1"
          >
            {isUpdatingPassword ? 'Actualizando...' : 'Actualizar contraseña'}
          </Button>

          {isUpdatingPassword && (
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          )}

          {passwordUpdated && (
            <div className="text-green-600 flex items-center gap-1">
              <Check className="w-5 h-5" />
            </div>
          )}
        </div>
      </div>

      {/* Contacto */}
      <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl space-y-4 hover:shadow-md transition-shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Soporte</h2>
        <p className="text-sm text-gray-600">
          ¿Tienes alguna duda o problema? Estamos aquí para ayudarte.
        </p>
        <a
          href="https://mail.google.com/mail/?view=cm&to=vetacreativalaser@gmail.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
        >
          <Mail className="w-4 h-4" />
          vetacreativalaser@gmail.com
        </a>
      </div>
    </div>
  );
};

export default PersonalInfoTab;
