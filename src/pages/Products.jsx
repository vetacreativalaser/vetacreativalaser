import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

const Products = () => {
  const [searchParams] = useSearchParams();
  const [favorites, setFavorites] = useState([]);
  const { user } = useAuth();
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const selectedCategory = searchParams.get('categoria') || 'todos';

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoadingProducts(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching products:", error);
        toast({ title: "Error", description: "No se pudieron cargar los productos.", variant: "destructive" });
      } else {
        setAllProducts(data || []);
      }
      setIsLoadingProducts(false);
    };
    fetchProducts();
  }, []);

  const products = selectedCategory === 'todos'
    ? allProducts
    : allProducts.filter(product => product.category === selectedCategory);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (user) {
        setIsLoadingFavorites(true);
        const { data, error } = await supabase
          .from('favorites')
          .select('product_id')
          .eq('user_id', user.id);
        if (error) console.error("Error fetching favorites:", error);
        else setFavorites(data.map(fav => fav.product_id));
        setIsLoadingFavorites(false);
      } else {
        setFavorites([]); 
      }
    };
    fetchFavorites();
  }, [user]);

  const toggleFavorite = async (productId) => {
    if (!user) {
      toast({ title: "Inicia sesión", description: "Debes iniciar sesión para añadir a favoritos.", variant: "destructive" });
      return;
    }
    setIsLoadingFavorites(true);
    const isCurrentlyFavorite = favorites.includes(productId);
    if (isCurrentlyFavorite) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else setFavorites(prev => prev.filter(id => id !== productId));
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert([{ user_id: user.id, product_id: productId }]);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else setFavorites(prev => [...prev, productId]);
    }
    toast({
      title: !isCurrentlyFavorite ? "Añadido a Favoritos" : "Eliminado de Favoritos",
      description: products.find(p => p.id === productId)?.name,
    });
    setIsLoadingFavorites(false);
  };

  if (isLoadingProducts) {
    return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div></div>;
  }

  return (
    <div className="min-h-screen py-12 bg-white text-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-semibold mb-2">PRODUCTOS</h1>
          <p className="text-gray-500">
            Mostrando {products.length} resultados
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: index * 0.05, duration: 0.4, ease: 'easeOut' }}
              className="group relative hover:shadow-lg hover:scale-[1.015] transition-transform"
            >
              <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
                <Link to={`/productos/${product.id}`}>
                  <img 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    alt={product.image_alts?.[0] || product.name}
                    src={(() => {
                      try {
                        const urls = typeof product.image_urls === 'string' ? JSON.parse(product.image_urls) : product.image_urls;
                        return Array.isArray(urls) && urls.length > 0 ? urls[0] : '';
                      } catch {
                        return '';
                      }
                    })()}
                  />
                </Link>
                {user && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-white/70 hover:bg-white text-black rounded-full h-8 w-8"
                    onClick={() => toggleFavorite(product.id)}
                    disabled={isLoadingFavorites}
                  >
                    {isLoadingFavorites && favorites.includes(product.id)
                      ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500"></div>
                      : <Heart className={`h-4 w-4 ${favorites.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} strokeWidth={1.5} />}
                  </Button>
                )}
              </div>
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                transition={{ delay: index * 0.05 + 0.1, duration: 0.4, ease: 'easeOut' }}
                className="mt-3 text-center py-2 px-1 rounded group-hover:bg-gray-100 transition-colors"
              >
                <h3 className="text-md font-medium text-black text-left">
                  <Link to={`/productos/${product.id}`}>
                    {product.name}
                  </Link>
                </h3>
                <p className="mt-1 text-sm text-left text-gray-500">
                  {(() => {
                    try {
                      const parsedPrice = typeof product.price === 'string' ? JSON.parse(product.price) : product.price;
                      if (parsedPrice?.type === 'fixed') return `${parsedPrice.value || parsedPrice.fixedPrice} €`;
                      return 'variable €';
                    } catch (error) {
                      return 'variable €';
                    }
                  })()}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {products.length === 0 && !isLoadingProducts && (
          <div className="text-center py-12">
            <p className="text-lg text-gray-500">
              No se encontraron productos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
