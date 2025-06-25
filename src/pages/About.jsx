import React from 'react';
import { motion } from 'framer-motion';
import { Award, Users, Zap, Heart, UserCircle } from 'lucide-react';

const About = () => {
  const values = [
    {
      icon: <Award className="h-8 w-8 text-[hsl(var(--brand-brown-dark))]" />,
      title: 'Calidad Premium',
      description: 'Utilizamos solo los mejores materiales y tecnología de corte láser de última generación para garantizar productos de la más alta calidad.'
    },
    {
      icon: <Users className="h-8 w-8 text-[hsl(var(--brand-brown-dark))]" />,
      title: 'Atención Personalizada',
      description: 'Cada cliente es único para nosotros. Trabajamos de cerca contigo para crear productos que superen tus expectativas.'
    },
    {
      icon: <Zap className="h-8 w-8 text-[hsl(var(--brand-brown-dark))]" />,
      title: 'Innovación Constante',
      description: 'Siempre estamos explorando nuevas técnicas y diseños para ofrecerte productos únicos y creativos.'
    },
    {
      icon: <Heart className="h-8 w-8 text-[hsl(var(--brand-brown-dark))]" />,
      title: 'Pasión por el Arte',
      description: 'Cada pieza que creamos lleva nuestra pasión por el arte y la artesanía, convirtiendo ideas en realidad.'
    }
  ];

  return (
    <div className="min-h-screen py-12 bg-white text-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-semibold text-black mb-6">
            Sobre Nosotros
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Veta Creativa Laser: donde la pasión por el detalle se encuentra con la precisión del láser.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 mb-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-3 space-y-6"
          >
            <h2 className="text-3xl font-semibold text-black">
              De Hobby a Pasión por la Calidad
            </h2>
            <p className="text-gray-700 leading-relaxed text-justify">
              Lo que comenzó como un simple hobby, una chispa de curiosidad por las posibilidades creativas del corte láser, rápidamente se transformó en una dedicación total. En Veta Creativa Laser, esa pasión inicial es ahora el motor que impulsa nuestro compromiso inquebrantable con la calidad y la originalidad en cada producto que diseñamos.
            </p>
            <p className="text-gray-700 leading-relaxed text-justify">
              Cada pieza de madera es seleccionada con cuidado, cada diseño es meticulosamente planificado y cada corte láser se ejecuta con la máxima precisión. Creemos que los pequeños detalles marcan una gran diferencia, y es esta filosofía la que nos guía para ofrecerte no solo un producto, sino una experiencia artesanal única.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-2 rounded-lg overflow-hidden border border-gray-200"
          >
            <img-replace  
              className="w-full h-auto object-cover" 
              alt="Taller de Veta Creativa Laser con herramientas y madera"
             src="https://images.unsplash.com/photo-1615286922420-c6b348ffbd62" />
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20 text-center bg-gray-50 py-12 px-6 rounded-lg"
        >
          <UserCircle className="h-16 w-16 text-[hsl(var(--brand-brown-medium))] mx-auto mb-4" strokeWidth={1}/>
          <h2 className="text-3xl font-semibold text-black mb-4">
            El Equipo Detrás de la Magia
          </h2>
          <p className="text-xl text-gray-700 font-medium mb-2">Isaac Delfa Medina</p>
          <p className="text-gray-600 leading-relaxed max-w-xl mx-auto">
            Soy un joven emprendedor de 15 años, y soy la persona detrás de cada aspecto de Veta Creativa Laser. Desde el diseño inicial y la comunicación con los clientes, hasta la operación de la máquina láser y el empaquetado final de cada pedido. Esta empresa es mi proyecto personal, donde vuelco toda mi energía, creatividad y dedicación para asegurar que cada cliente reciba un producto excepcional y un servicio cercano.
          </p>
        </motion.div>


        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-semibold text-black text-center mb-10">
            Nuestros Valores Fundamentales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center p-6 rounded-lg bg-white border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[hsl(var(--brand-brown-light))] rounded-full mb-4">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold text-black mb-2">
                  {value.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-[hsl(var(--brand-brown-medium))] rounded-lg p-10 md:p-12 text-center text-white"
        >
          <h2 className="text-3xl font-semibold mb-6">
            Nuestra Misión
          </h2>
          <p className="text-lg md:text-xl max-w-4xl mx-auto leading-relaxed">
            Transformar ideas creativas en productos tangibles de alta calidad, utilizando tecnología 
            de corte láser de vanguardia y materiales premium. Nos comprometemos a superar las expectativas 
            de nuestros clientes, ofreciendo productos únicos que perduren en el tiempo y creen recuerdos inolvidables.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default About;