import React from 'react';
import { User, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const ProfileHeader = ({ user, isAdmin }) => {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6 md:p-8 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-4 ring-white/30">
            <User className="w-12 h-12 text-white" />
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold text-white mb-1">
              {user?.user_metadata?.name || user?.name || 'Usuario'}
            </h1>
            <p className="text-white/90 text-sm">{user?.email}</p>
          </div>
        </div>

        {isAdmin && (
          <Link to="/admin/dashboard">
            <Button
              variant="secondary"
              className="bg-white text-purple-600 hover:bg-gray-100 shadow-md w-full sm:w-auto"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Panel de Administrador
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;
