
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Heart, Search as SearchIconPlain, ArrowLeft } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

const allProductsData = [ 
    { id: 1, name: 'Kit San Valentín Romántico', category: 'temporada', price: '25,99 €', imageAlt: 'Kit romántico de San Valentín en madera', imageText: 'Kit de madera para San Valentín con corazones' },
    { id: 2, name: 'Marco Natalicio Personalizado', category: 'natalicio', price: '18,50 €', imageAlt: 'Marco de madera personalizado para nacimiento de bebé', imageText: 'Marco de nacimiento con detalles de bebé en madera' },
    { id: 3, name: 'Kit Creativo Completo', category: 'kits', price: '35,00 €', imageAlt: 'Kit de manualidades completo con piezas de madera', imageText: 'Kit creativo Veta Laser con varias piezas' },
    { id: 4, name: 'Álbum de Recuerdos', category: 'album', price: '22,75 €', imageAlt: 'Álbum de fotos de madera con cubierta grabada', imageText: 'Álbum de madera personalizado para recuerdos' },
    { id: 5, name: 'Letras Personalizadas', category: 'nombres', price: '12,99 €', imageAlt: 'Letras de madera personalizadas para decoración del hogar', imageText: 'Nombre decorativo en madera cortado con láser' },
    { id: 6, name: 'Caja Decorativa Premium', category: 'cajas', price: '28,00 €', imageAlt: 'Caja de madera premium con patrones cortados a láser', imageText: 'Caja de madera elegante con diseño intrincado' },
    { id: 7, name: 'Set Corazones San Valentín', category: 'temporada', price: '15,99 €', imageAlt: 'Conjunto de corazones de madera para decoración de San Valentín', imageText: 'Corazones de madera para manualidades de San Valentín' },
    { id: 8, name: 'Marco Foto Bebé', category: 'natalicio', price: '16,50 €', imageAlt: 'Marco de fotos de bebé de madera con motivos de animales', imageText: 'Marco de madera para primera foto de bebé' },
    { id: 9, name: 'Bola personalizada navideña para animales', category: 'temporada', price: '4,50 €', imageAlt: 'Adorno navideño de madera personalizado para mascotas', imageText: 'Bola de Navidad de madera para perro o gato' },
    { id: 10, name: 'Cajas 25*15*9', category: 'cajas', price: '25,00 €', imageAlt: 'Caja de madera de tamaño 25x15x9 cm', imageText: 'Caja de almacenamiento de madera simple' },
    { id: 11, name: 'Cajas con forma de corazón', category: 'cajas', price: '15,00 €', imageAlt: 'Caja de madera con forma de corazón para regalos', imageText: 'Caja de madera en forma de corazón' },
    { id: 12, name: 'Cajas de 20*10*6cm', category: 'cajas', price: '25,00 €', imageAlt: 'Caja de madera de tamaño 20x10x6 cm', imageText: 'Caja de madera rectangular pequeña' }
];


const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q');
  const [results, setResults] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const { user } = useAuth();
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);

  useEffect(() => {
    if (query) {
      const lowerCaseQuery = query.toLowerCase();
      const filteredProducts = allProductsData.filter(product =>
        product.name.toLowerCase().includes(lowerCaseQuery) ||
        product.category.toLowerCase().includes(lowerCaseQuery) ||
        (product.description && product.description.toLowerCase().includes(lowerCaseQuery))
      );
      setResults(filteredProducts);
    } else {
      setResults([]);
    }
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
          <SearchIconPlain className="h-10 w-10 mx-auto mb-3 text-black" strokeWidth={2}/>
          <h1 className="text-3xl font-semibold mb-2">Resultados de Búsqueda para "{query}"</h1>
          <p className="text-gray-500">
            {results.length} producto(s) encontrado(s).
          </p>
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
                <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
                  <Link to={`/productos/${product.id}`}>
                    <img-replace 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      alt={product.imageAlt}
                     src="https://images.unsplash.com/photo-1635865165118-917ed9e20936" />
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-white/70 hover:bg-white text-black rounded-full h-8 w-8"
                    onClick={() => toggleFavorite(product.id)}
                    disabled={isLoadingFavorites}
                  >
                    {isLoadingFavorites && favorites.includes(product.id) ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500"></div> : <Heart className={`h-4 w-4 ${favorites.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} strokeWidth={1.5} />}
                  </Button>
                </div>
                <div className="mt-3 text-center">
                  <h3 className="text-md font-medium text-black">
                    <Link to={`/productos/${product.id}`}>
                      {product.name}
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{product.price}</p>
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