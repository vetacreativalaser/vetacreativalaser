import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { User, ShoppingBag, Mail, Star, LogOut, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Componentes modulares
import ProfileHeader from './components/ProfileHeader';
import FavoritesSection from './components/FavoritesSection';
import PersonalInfoTab from './components/PersonalInfoTab';
import ReviewsTab from './components/ReviewsTab';
import OrdersTab from './components/OrdersTab';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(true);

  const refreshReviews = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) console.error('Error cargando reseñas:', error.message);
    setReviews(data || []);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, phone')
        .eq('email', user.email)
        .single();

      if (profile) {
        setFormData({
          name: profile.name || user.user_metadata?.name || '',
          email: user.email || '',
          phone: profile.phone || user.user_metadata?.phone || ''
        });
      }

      const { data: favs } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id);
      setFavorites(favs || []);

      const { data: productList } = await supabase.from('products').select('id, name');
      setProducts(productList || []);



      await refreshReviews();
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isAdmin = user?.email === 'vetacreativalaser@gmail.com';

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfileHeader user={user} isAdmin={isAdmin} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <Tabs defaultValue="principal" className="space-y-6">
          <div className="flex justify-center sm:justify-start w-full overflow-x-auto">
            <TabsList className="inline-flex h-auto p-1 bg-white border border-gray-200 rounded-lg shadow-sm">
              <TabsTrigger
                value="principal"
                className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 rounded-md data-[state=active]:bg-black data-[state=active]:text-white transition-colors min-w-[44px]"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Principal</span>
              </TabsTrigger>
              <TabsTrigger
                value="info"
                className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 rounded-md data-[state=active]:bg-black data-[state=active]:text-white transition-colors min-w-[44px]"
              >
                <Mail className="w-4 h-4" />
                <span className="hidden sm:inline">Información</span>
              </TabsTrigger>
             
              <TabsTrigger
                value="pedidos"
                className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 rounded-md data-[state=active]:bg-black data-[state=active]:text-white transition-colors min-w-[44px]"
              >
                <Package className="w-4 h-4" />
                <span className="hidden sm:inline">Pedidos</span>
              </TabsTrigger>
              <TabsTrigger
                value="reseñas"
                className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 rounded-md data-[state=active]:bg-black data-[state=active]:text-white transition-colors min-w-[44px]"
              >
                <Star className="w-4 h-4" />
                <span className="hidden sm:inline">Reseñas</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="principal" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Estadísticas rápidas */}
              <div className="lg:col-span-3 grid grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-gray-900">{purchases.length}</div>
                  <div className="text-sm text-gray-600 mt-1">Compras</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-gray-900">{reviews.length}</div>
                  <div className="text-sm text-gray-600 mt-1">Reseñas</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-gray-900">{favorites.length}</div>
                  <div className="text-sm text-gray-600 mt-1">Favoritos</div>
                </div>
              </div>

              {/* Favoritos */}
              <div className="lg:col-span-2">
                <FavoritesSection favorites={favorites} products={products} />
              </div>

              {/* Información rápida */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Mi cuenta</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Nombre</p>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {formData.name || 'No especificado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                    <p className="text-sm text-gray-900 font-medium mt-1">{formData.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Teléfono</p>
                    <p className="text-sm text-gray-900 font-medium mt-1">
                      {formData.phone || 'No especificado'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="info">
            <PersonalInfoTab user={user} formData={formData} setFormData={setFormData} />
          </TabsContent>

 

          <TabsContent value="pedidos">
            <OrdersTab />
          </TabsContent>

          <TabsContent value="reseñas">
            <ReviewsTab reviews={reviews} user={user} refreshReviews={refreshReviews} />
          </TabsContent>
        </Tabs>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
