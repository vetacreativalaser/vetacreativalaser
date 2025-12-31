
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Gift, Ruler, Palette, MessageSquare as MessageSquareIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BuyingGuides = () => {
  const guides = [
    {
      icon: <Gift className="h-8 w-8 text-black mb-3" />,
      title: "Elegir el Regalo Perfecto",
      description: "Considera los gustos e intereses de la persona. Un regalo personalizado siempre es una excelente opción. Piensa en la ocasión: ¿es un cumpleaños, aniversario, o simplemente un detalle? Nuestros kits y marcos personalizados son ideales para muchas ocasiones.",
    },
    {
      icon: <Ruler className="h-8 w-8 text-black mb-3" />,
      title: "Tamaños y Dimensiones",
      description: "Revisa siempre las dimensiones de los productos indicadas en la descripción. Si es para un espacio específico, mide el lugar antes de comprar. Para marcos de fotos, asegúrate de que el tamaño de la foto que quieres usar coincide con el especificado.",
    },
    {
      icon: <Palette className="h-8 w-8 text-black mb-3" />,
      title: "Personalización y Acabados",
      description: "Muchos de nuestros productos son personalizables. Piensa en nombres, fechas o frases especiales. Si tienes dudas sobre las opciones de personalización o acabados (natural, pintado, barnizado), no dudes en contactarnos. Te asesoraremos para que tu producto sea único.",
    },
    {
      icon: <MessageSquareIcon className="h-8 w-8 text-black mb-3" />,
      title: "Proceso de Compra Simplificado",
      description: "Como somos una empresa pequeña y artesanal, gestionamos los pedidos de forma personalizada. Simplemente contáctanos por WhatsApp o email con el producto que te interesa. Te guiaremos en el proceso, confirmaremos detalles y el pago se realiza de forma segura por Bizum o transferencia.",
    },
  ];

  return (
    <div className="min-h-screen py-12 bg-white text-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link to="/" className="flex items-center text-gray-500 hover:text-black transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" strokeWidth={1.5}/>
            Volver a Inicio
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-semibold text-black mb-3">Guías de Compra</h1>
          <p className="text-lg text-gray-600">Consejos útiles para ayudarte a elegir y comprar nuestros productos artesanales.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {guides.map((guide, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-white p-6 shadow border border-gray-200 flex flex-col items-center text-center"
            >
              {guide.icon}
              <h2 className="text-xl font-semibold text-black mb-2">{guide.title}</h2>
              <p className="text-gray-600 leading-relaxed text-sm">{guide.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + guides.length * 0.1 }}
            className="mt-12 text-center p-6 bg-gray-50 border border-gray-200"
        >
            <h2 className="text-xl font-semibold text-black mb-3">¿Tienes más preguntas?</h2>
            <p className="text-gray-600 mb-4">
                Si necesitas más ayuda o tienes alguna consulta específica sobre un producto, no dudes en contactarnos. ¡Estaremos encantados de ayudarte!
            </p>
            <Link to="/contacto">
                <Button variant="outline" className="border-black text-black hover:bg-black hover:text-white">
                    Contactar Ahora
                </Button>
            </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default BuyingGuides;
