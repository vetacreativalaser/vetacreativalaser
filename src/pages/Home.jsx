import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const Home = () => {
  const [categories, setCategories] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
       .order('fijada', { ascending: false }) // primero fijadas
      .order('title', { ascending: true })   // luego alfabéticamente
      .eq('visible', true); // solo visibles
    setCategories(data);

  };
  
    fetchData();
  }, []);



  return (
    <main className="min-h-screen bg-white text-black">
      <section className="relative h-[60vh] md:h-[70vh] flex items-center justify-center overflow-hidden" aria-label="Sección principal con banner">
        <img className="absolute inset-0 w-full h-full object-cover opacity-80" alt="Banner de productos en madera" src="https://dspsrnprvrpjrkicxiso.supabase.co/storage/v1/object/public/portadacategorias/banner.webp" />
        <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10 text-center px-4"><Link to="/productos"><Button aria-label="Ir a productos" variant="outline" size="lg"className="border-2 border-white text-white bg-transparent hover:border-white hover:border-[3px] hover:text-white hover:bg-transparent px-12 py-4 uppercase tracking-wider font-semibold transition-all duration-150 ease-in-out"
        >Ver Productos</Button></Link></motion.div>
      </section>

      <section className="py-16 bg-white" aria-labelledby="titulo-categorias">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.header
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12"
          >
            <h1 id="titulo-categorias" className="text-3xl md:text-4xl font-semibold text-black mb-3">
              ¿Qué hacemos?
            </h1>
          </motion.header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 px-6 sm:px-0" >
            {categories.map(({ id, title = 'Sin categoría', description, image_url }, index) => (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link
                  to={`/productos?category_id=${id}`}
                  className="block group outline-none focus:ring-2 focus:ring-brown-700 rounded"
                  aria-label={`Ver productos de la categoría ${title}`}
                >
                  <article className="cursor-pointer">
                    <div className="w-full aspect-square bg-gray-100 overflow-hidden">
                      <img
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        src={image_url || '/fallback-category.jpg'}
                        alt={`Imagen de la categoría ${title}`}
                        loading="lazy"
                        width="400"
                        height="400"
                      />
                    </div>
                    <div className="p-4 text-center group-hover:bg-gray-100 transition-colors">
                      <h2 className="text-xl font-semibold text-black mb-1">{title}</h2>
                      <p className="text-sm text-gray-600">{description}</p>
                    </div>
                  </article>
                </Link>
              </motion.div>
            ))}

          </div>
        </div>
      </section>

    </main>
  );
};

export default Home;
