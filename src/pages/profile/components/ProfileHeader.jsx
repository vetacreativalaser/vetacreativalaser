import React from 'react';
import { User, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const ProfileHeader = ({ user, isAdmin }) => {
  return (
    <div className="bg-white border-b border-gray-200 mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
              <User className="w-8 h-8 text-gray-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {user?.user_metadata?.name || user?.name || 'Usuario'}
              </h1>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>

          {isAdmin && (
            <Link to="/admin/dashboard">
              <Button variant="outline" className="w-full sm:w-auto">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Panel de Administrador
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
