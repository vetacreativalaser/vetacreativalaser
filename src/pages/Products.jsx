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
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const { user } = useAuth();

  const categoryId = searchParams.get('category_id'); // ⚠️ aquí leemos el ID numérico

  // 🛒 Obtener productos
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoadingProducts(true);

      let query = supabase
        .from('products')
        .select(`
          *,
          categorias:category_id ( title )
        `)
        .eq('visible', true)
        .order('created_at', { ascending: false });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Error cargando productos:", error);
        toast({ title: "Error", description: "No se pudieron cargar los productos.", variant: "destructive" });
      } else {
        setProducts(data || []);
      }

      setIsLoadingProducts(false);
    };

    fetchProducts();
  }, [categoryId]);

  // ❤️ Obtener favoritos del usuario
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) return setFavorites([]);
      setIsLoadingFavorites(true);

      const { data, error } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', user.id);

      if (error) console.error("Error fetching favorites:", error);
      else setFavorites(data.map(fav => fav.product_id));

      setIsLoadingFavorites(false);
    };

    fetchFavorites();
  }, [user]);

  // 🔁 Alternar favorito
  const toggleFavorite = async (productId) => {
    if (!user) {
      toast({ title: "Inicia sesión", description: "Debes iniciar sesión para añadir a favoritos.", variant: "destructive" });
      return;
    }

    setIsLoadingFavorites(true);
    const isFav = favorites.includes(productId);

    if (isFav) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);
      if (!error) setFavorites(prev => prev.filter(id => id !== productId));
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert([{ user_id: user.id, product_id: productId }]);
      if (!error) setFavorites(prev => [...prev, productId]);
    }

    toast({
      title: isFav ? "Eliminado de Favoritos" : "Añadido a Favoritos",
      description: products.find(p => p.id === productId)?.name,
    });

    setIsLoadingFavorites(false);
  };

  if (isLoadingProducts) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
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
            Mostrando {products.length} resultado(s)
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
    className="group relative transition-transform hover:scale-[1.015]"
  >
    <div className="w-full aspect-square bg-gray-100 overflow-hidden">
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

    {/* ZONA DE TEXTO CON HOVER COMPLETO */}
    <div className="transition-colors duration-300 group-hover:bg-gray-100 px-3 py-3">
      <p className="text-md font-medium text-black text-left leading-snug">
        <Link to={`/productos/${product.id}`}>
          {product.name}
        </Link>
      </p>
      <p className="mt-1 text-sm text-left text-gray-500">
        {(() => {
          try {
            const parsedPrice = typeof product.price === 'string' ? JSON.parse(product.price) : product.price;
            if (parsedPrice?.type === 'fixed') return `${parsedPrice.value || parsedPrice.fixedPrice} €`;
            return 'variable €';
          } catch {
            return 'variable €';
          }
        })()}
      </p>
    </div>
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
