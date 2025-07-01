import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Heart, Trash2, ShoppingBag, MessageCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

const Wishlist = () => {
  const [favoriteItemsDetails, setFavoriteItemsDetails] = useState([]);
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFavoriteDetails = async () => {
      if (user) {
        setIsLoading(true);
        const { data: favoriteProductIds, error: favError } = await supabase
          .from('favorites')
          .select('product_id')
          .eq('user_id', user.id);

        if (favError) {
          console.error("Error fetching favorite IDs:", favError);
          toast({ title: "Error", description: "No se pudieron cargar los favoritos.", variant: "destructive" });
          setIsLoading(false);
          return;
        }

        if (favoriteProductIds && favoriteProductIds.length > 0) {
          const productIds = favoriteProductIds.map(f => f.product_id);
          const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select('*')
            .in('id', productIds);

          if (productsError) {
            console.error("Error fetching product details:", productsError);
            toast({ title: "Error", description: "No se pudieron cargar los detalles de los productos favoritos.", variant: "destructive" });
          } else {
            setFavoriteItemsDetails(productsData || []);
          }
        } else {
          setFavoriteItemsDetails([]);
        }
        setIsLoading(false);
      } else {
        setFavoriteItemsDetails([]);
        setIsLoading(false);
      }
    };
    fetchFavoriteDetails();
  }, [user]);

  const removeFromFavorites = async (productId) => {
    if (!user) return;
    setIsLoading(true);
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);

    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar el favorito.", variant: "destructive" });
    } else {
      const removedProduct = favoriteItemsDetails.find(p => p.id === productId);
      setFavoriteItemsDetails(prevItems => prevItems.filter(item => item.id !== productId));
      toast({
        title: "Eliminado de Favoritos",
        description: removedProduct?.name,
      });
    }
    setIsLoading(false);
  };

  const handleContactAboutProduct = (productName) => {
    const phoneNumber = '642571133';
    const message = encodeURIComponent(`¡Hola! Estoy interesado/a en el producto "${productName}" de mis favoritos.`);
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  const renderProductPrice = (price) => {
    try {
      const parsed = typeof price === 'string' ? JSON.parse(price) : price;
      if (parsed?.type === 'fixed') return parsed.value || parsed.fixedPrice;
      return 'var';
    } catch (e) {
      return 'var';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 bg-white text-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <Heart className="h-12 w-12 text-black mx-auto mb-4" strokeWidth={1.5} />
          <h1 className="text-4xl font-semibold text-black mb-3">Mis Favoritos</h1>
          <p className="text-lg text-gray-600">Tus productos preferidos guardados en un solo lugar.</p>
        </motion.div>

        {favoriteItemsDetails.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-6" strokeWidth={1} />
            <p className="text-xl text-gray-500 mb-4">Tu lista de favoritos está vacía.</p>
            <p className="text-gray-500 mb-6">Añade productos que te gusten para verlos aquí.</p>
            <Link to="/productos">
              <Button variant="outline" className="border-black text-black hover:bg-black hover:text-white">
                Explorar Productos
              </Button>
            </Link>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {favoriteItemsDetails.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col sm:flex-row items-center justify-between p-4 border border-gray-200 bg-white hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-4 w-full sm:w-auto mb-4 sm:mb-0">
                  <Link to={`/productos/${item.id}`} className="block w-20 h-20 bg-gray-100 overflow-hidden shrink-0 rounded">
                    <img
                      className="w-full h-full object-cover"
                      alt={item.image_alts?.[0] || item.name}
                      src={(() => {
                        try {
                          const urls = typeof item.image_urls === 'string' ? JSON.parse(item.image_urls) : item.image_urls;
                          return Array.isArray(urls) && urls.length > 0 ? urls[0] : "https://images.unsplash.com/photo-1598020856638-cbc3b47bbada";
                        } catch {
                          return "https://images.unsplash.com/photo-1598020856638-cbc3b47bbada";
                        }
                      })()}
                    />
                  </Link>
                  <div className="flex-grow">
                    <Link to={`/productos/${item.id}`}>
                      <h2 className="text-lg font-medium text-black hover:underline">{item.name}</h2>
                    </Link>
                    <p className="text-gray-500 text-sm">{renderProductPrice(item.price)} €</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-300 hover:border-black text-xs w-full sm:w-auto"
                    onClick={() => handleContactAboutProduct(item.name)}
                  >
                    <MessageCircle className="mr-2 h-3 w-3 sm:hidden md:inline-block" /> Contactar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-red-500 w-full sm:w-auto"
                    onClick={() => removeFromFavorites(item.id)}
                  >
                    <Trash2 className="mr-2 h-3 w-3 sm:hidden md:inline-block" /> Eliminar
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
