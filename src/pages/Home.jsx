
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const Home = () => {
  const categories = [
    {
      id: 'temporada',
      title: 'Temporada - San Valentín',
      description: 'Productos especiales para fechas especiales',
      filter: 'temporada',
      imageAlt: 'Decoración de San Valentín en madera',
      imageText: 'Madera cortada con láser para San Valentín'
    },
    {
      id: 'natalicio',
      title: 'Natalicio',
      description: 'Marcos y decoraciones para celebrar',
      filter: 'natalicio',
      imageAlt: 'Marco de natalicio de madera personalizado',
      imageText: 'Recuerdo de nacimiento en madera'
    },
    {
      id: 'kits',
      title: 'Kits Veta Creativa Laser',
      description: 'Kits completos para proyectos creativos',
      filter: 'kits',
      imageAlt: 'Kit de manualidades de madera Veta Creativa',
      imageText: 'Kit creativo con piezas de madera'
    },
    {
      id: 'album',
      title: 'Álbum',
      description: 'Álbumes personalizados de madera',
      filter: 'album',
      imageAlt: 'Álbum de fotos de madera personalizado',
      imageText: 'Álbum de madera grabado con láser'
    },
    {
      id: 'nombres',
      title: 'Nombres',
      description: 'Letras y nombres personalizados',
      filter: 'nombres',
      imageAlt: 'Nombre de madera personalizado para decoración',
      imageText: 'Letras de madera cortadas con láser'
    },
    {
      id: 'cajas',
      title: 'Cajas',
      description: 'Cajas decorativas y funcionales',
      filter: 'cajas',
      imageAlt: 'Caja de madera decorativa cortada con láser',
      imageText: 'Caja de madera con diseño personalizado'
    }
  ];

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img-replace 
            className="w-full h-full object-cover opacity-80" 
            alt="Banner de Veta Creativa Laser con productos de madera"
            src="https://images.unsplash.com/photo-1698749507072-b3839bae0eaf" 
          />
          <div className="absolute inset-0 bg-black/30"></div> {/* Subtle overlay */}
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-4"
        >
          <Link to="/productos" className="mt-6 inline-block">
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

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl md:text-4xl font-semibold text-black mb-3">
              ¿Qué hacemos?
            </h1>
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
                  <img-replace 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    alt={category.imageAlt}
                   src="https://images.unsplash.com/photo-1595872018818-97555653a011" />
                </div>
                <div className="p-4 text-center">
                  <h3 className="text-xl font-semibold text-black mb-1">
                    {category.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {category.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-50"> {/* Using a very light beige/gray from theme */}
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl md:text-4xl font-semibold text-black mb-5">
              ¿Tienes una idea creativa?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Trabajamos contigo para crear productos únicos y personalizados. ¡Contacta con nosotros!
            </p>
            <Link to="/contacto">
              <Button size="lg" variant="default" className="bg-black text-white hover:bg-gray-800 text-md px-10 py-3 uppercase tracking-wider font-semibold">
                Contactar Ahora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
