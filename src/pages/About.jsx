// pages/About.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Award, Users, Zap, Heart } from 'lucide-react';

const About = () => {
  const values = [
    {
      icon: <Award className="h-8 w-8 text-gray-800" />,
      title: 'Calidad Premium',
      description: 'Utilizamos los mejores materiales y tecnología de corte láser de última generación.'
    },
    {
      icon: <Users className="h-8 w-8 text-gray-800" />,
      title: 'Atención Personalizada',
      description: 'Trabajamos de cerca contigo para crear productos que superen tus expectativas.'
    },
    {
      icon: <Zap className="h-8 w-8 text-gray-800" />,
      title: 'Innovación Constante',
      description: 'Exploramos nuevas técnicas para ofrecerte productos únicos y creativos.'
    },
    {
      icon: <Heart className="h-8 w-8 text-gray-800" />,
      title: 'Pasión por el Arte',
      description: 'Cada pieza refleja nuestra dedicación artesanal y amor por los detalles.'
    }
  ];

  return (
    <div className="min-h-screen py-12 bg-white text-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Encabezado */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-semibold mb-6">Sobre Nosotros</h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Veta Creativa Laser: donde la pasión por el detalle se encuentra con la precisión del láser.
          </p>
        </motion.div>

        {/* Historia */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 mb-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-3 space-y-6"
          >
            <h2 className="text-3xl font-semibold">De Hobby a Pasión</h2>
            <p className="text-gray-700 leading-relaxed text-justify">
              Lo que comenzó como una chispa de curiosidad por las posibilidades del corte láser, rápidamente se transformó en una dedicación total.
            </p>
            <p className="text-gray-700 leading-relaxed text-justify">
              Cada pieza de madera es seleccionada con cuidado, cada diseño es meticulosamente planificado y cada corte se ejecuta con la máxima precisión. Creemos que los pequeños detalles marcan una gran diferencia.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-2 rounded-lg overflow-hidden border border-gray-200 shadow-md"
          >
            <img  
              className="w-full h-auto object-cover" 
              alt="Taller de Veta Creativa Laser"
              src="https://dspsrnprvrpjrkicxiso.supabase.co/storage/v1/object/public/productos//about-background.JPG" 
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-24 bg-gray-100 rounded-xl p-10 text-center"
        >
          <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-md mx-auto">
            <img
              src='https://dspsrnprvrpjrkicxiso.supabase.co/storage/v1/object/public/productos//Edicion%2010%20normal.jpg'
              alt="Isaac Delfa"
              className="w-full h-full object-cover"
            />
          </div>          
          <h2 className="text-3xl font-semibold mb-2 mt-6">Isaac Delfa Medina</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Soy un joven emprendedor de 15 años. Desde el diseño hasta el empaquetado, cada paso en Veta Creativa Laser lleva mi sello personal.
            Este proyecto es la fusión entre mi creatividad, mis ganas de aprender y mi deseo de ofrecer calidad excepcional.
          </p>
        </motion.div>

        {/* Valores */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-semibold text-center mb-10">Nuestros Valores Fundamentales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center p-6 rounded-lg bg-white border border-gray-200 hover:shadow-md"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-4">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-gray-600 text-sm">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Misión */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-24 bg-gray-200 rounded-xl p-10 text-center"
        >
          <h2 className="text-3xl font-semibold mb-6">Nuestra Misión</h2>
          <p className="text-gray-700 max-w-2xl mx-auto leading-relaxed">
            Transformar ideas creativas en productos tangibles de alta calidad, utilizando tecnología de corte láser de vanguardia y materiales premium.
            Nos comprometemos a superar las expectativas de nuestros clientes, ofreciendo productos únicos que perduren en el tiempo.
          </p>
        </motion.div>

      </div>
    </div>
  );
};

export default About;
