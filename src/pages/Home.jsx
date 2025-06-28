import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import ImageCropDialog from '@/components/ui/ImageCropDialog';

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [bannerUrl, setBannerUrl] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
  const fetchData = async () => {
    const { data: catData, error: catError } = await supabase
      .from('categorias')
      .select('*')
      .eq('visible', true)
      .order('fijada', { ascending: false })
      .order('created_at', { ascending: false });

    console.log('Categorías:', catData);
    console.error('Error categorías:', catError);

    setCategories(catData || []);

    const { data: bannerData, error: bannerError } = await supabase
      .from('banner_principal')
      .select('*')
      .limit(1)
      .single();

    console.log('Banner:', bannerData);
    console.error('Error banner:', bannerError);

    if (bannerData?.url) {
      setBannerUrl(bannerData.url);
      setBannerFile(bannerData.filename);
    }
  };

  fetchData();
}, []);


  const handleBannerUpload = async (publicUrl) => {
  // Guardar en base de datos
  const newName = publicUrl.split('/').pop();

  const { error } = await supabase
    .from('banner_principal')
    .upsert({ id: 1, url: publicUrl, filename: newName });

  if (!error) {
    setBannerUrl(publicUrl);
    setBannerFile(newName);
  }
};


console.log('Todas las categorías:', catData);

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Hero */}
      <section className="relative h-[60vh] md:h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover opacity-80"
            alt="Banner de Veta Creativa Laser con productos de madera"
            src={bannerUrl || '/fallback-banner.jpg'}
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Botón de editar imagen */}
        {user?.email === "vetacreativalaser@gmail.com" && (
          <>
            <button
              onClick={() => setEditOpen(true)}
              className="absolute top-4 right-4 z-20 text-sm text-black bg-white px-3 py-1 rounded shadow hover:text-[#6b3e26]"
            >
              Editar
            </button>
            <ImageCropDialog
              open={editOpen}
              onClose={() => setEditOpen(false)}
              onConfirm={handleBannerUpload}
            />
          </>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-4"
        >
          <Link to="/productos">
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-white text-white bg-transparent hover:border-[3px] hover:bg-transparent text-lg px-12 py-4 uppercase tracking-wider font-semibold transition-all duration-150 ease-in-out"
            >
              Ver Productos
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Categorías */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl md:text-4xl font-semibold text-black mb-3">¿Qué hacemos?</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Descubre nuestras categorías de productos únicos, cada uno diseñado con precisión y creatividad.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group category-card cursor-pointer"
                onClick={() => window.location.href = `/productos?categoria=${category.filter}`}
              >
                <div className="w-full aspect-square bg-gray-100 overflow-hidden">
                  <img
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    alt={category.title}
                    src={category.image_url || '/fallback-category.jpg'}
                  />
                </div>
                <div className="p-4 text-center">
                  <h3 className="text-xl font-semibold text-black mb-1">{category.title || 'Sin categoría'}</h3>
                  <p className="text-sm text-gray-500">{category.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
