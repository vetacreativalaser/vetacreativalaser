import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Heart, Search as SearchIconPlain, ArrowLeft } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

// TODO: Reemplaza esta lista por una llamada real a Supabase si hace falta.
const allProductsData = [
  // ...
];

const normalizeText = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const renderProductPrice = (price) => {
  try {
    const parsed = typeof price === 'string' ? JSON.parse(price) : price;
    if (parsed?.type === 'fixed') return `${parsed.value || parsed.fixedPrice} €`;
    return 'var';
  } catch (e) {
    return 'var';
  }
};

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const { user } = useAuth();
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);

  useEffect(() => {
    const lowerQuery = normalizeText(query);
    const filtered = allProductsData.filter(product => {
      const name = normalizeText(product.name);
      const category = normalizeText(product.category || '');
      const description = normalizeText(product.description || '');
      return name.includes(lowerQuery) || category.includes(lowerQuery) || description.includes(lowerQuery);
    });
    setResults(filtered);
  }, [query]);

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
    const isFav = favorites.includes(productId);

    if (isFav) {
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
      title: isFav ? "Eliminado de Favoritos" : "Añadido a Favoritos",
      description: allProductsData.find(p => p.id === productId)?.name,
    });
    setIsLoadingFavorites(false);
  };

  return (
    <div className="min-h-screen py-12 bg-white text-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <SearchIconPlain className="h-10 w-10 mx-auto mb-3 text-black" strokeWidth={2} />
          <h1 className="text-3xl font-semibold mb-2">Resultados de Búsqueda para "{query}"</h1>
          <p className="text-gray-500">{results.length} producto(s) encontrado(s).</p>
          <Button
            variant="outline"
            onClick={() => navigate('/productos')}
            className="mt-4 border-black text-black hover:bg-black hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Productos
          </Button>
        </motion.div>

        {results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {results.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative"
              >
                <div className="relative w-full aspect-square bg-gray-100 overflow-hidden rounded">
                  <Link to={`/productos/${product.id}`}>
                    <img
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      alt={product.imageAlt || product.name}
                      src={product.image_urls?.[0] || "https://images.unsplash.com/photo-1635865165118-917ed9e20936"}
                    />
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-white/70 hover:bg-white text-black rounded-full h-8 w-8"
                    onClick={() => toggleFavorite(product.id)}
                    disabled={isLoadingFavorites}
                  >
                    {isLoadingFavorites && favorites.includes(product.id) ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500"></div>
                    ) : (
                      <Heart className={`h-4 w-4 ${favorites.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} strokeWidth={1.5} />
                    )}
                  </Button>
                </div>
                <div className="mt-3 text-center">
                  <h3 className="text-md font-medium text-black">
                    <Link to={`/productos/${product.id}`}>
                      {product.name}
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{renderProductPrice(product.price)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-gray-500">
              No se encontraron productos que coincidan con tu búsqueda. Intenta con otros términos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
