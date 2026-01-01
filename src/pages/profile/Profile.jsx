import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { User, ShoppingBag, Mail, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Componentes modulares
import ProfileHeader from './components/ProfileHeader';
import FavoritesSection from './components/FavoritesSection';
import PersonalInfoTab from './components/PersonalInfoTab';
import PurchasesTab from './components/PurchasesTab';
import ReviewsTab from './components/ReviewsTab';

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

      const { data: purchaseData } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setPurchases(purchaseData || []);

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <ProfileHeader user={user} isAdmin={isAdmin} />

      <Tabs defaultValue="principal" className="space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full bg-white border border-gray-200 p-2 rounded-xl shadow-sm">
          <TabsTrigger
            value="principal"
            className="flex flex-col items-center gap-1 text-xs sm:text-sm py-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg transition-all"
          >
            <User className="w-5 h-5" />
            Principal
          </TabsTrigger>
          <TabsTrigger
            value="info"
            className="flex flex-col items-center gap-1 text-xs sm:text-sm py-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg transition-all"
          >
            <Mail className="w-5 h-5" />
            Información
          </TabsTrigger>
          <TabsTrigger
            value="compras"
            className="flex flex-col items-center gap-1 text-xs sm:text-sm py-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg transition-all"
          >
            <ShoppingBag className="w-5 h-5" />
            Compras
          </TabsTrigger>
          <TabsTrigger
            value="reseñas"
            className="flex flex-col items-center gap-1 text-xs sm:text-sm py-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg transition-all"
          >
            <Star className="w-5 h-5" />
            Reseñas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="principal" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FavoritesSection favorites={favorites} products={products} />

            <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 shadow-sm rounded-2xl">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                Bienvenido de vuelta
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Gracias por ser parte de nuestra comunidad. Aquí puedes gestionar tus
                compras, reseñas y favoritos.
              </p>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {purchases.length}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Compras</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {reviews.length}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Reseñas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-600">
                    {favorites.length}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Favoritos</div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="info">
          <PersonalInfoTab user={user} formData={formData} setFormData={setFormData} />
        </TabsContent>

        <TabsContent value="compras">
          <PurchasesTab purchases={purchases} />
        </TabsContent>

        <TabsContent value="reseñas">
          <ReviewsTab reviews={reviews} user={user} refreshReviews={refreshReviews} />
        </TabsContent>
      </Tabs>

      <div className="mt-8 flex justify-center">
        <Button
          variant="outline"
          className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 px-8"
          onClick={handleLogout}
        >
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
};

export default Profile;
