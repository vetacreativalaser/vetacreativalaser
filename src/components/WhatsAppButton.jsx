import React from 'react';
import { MessageSquare } from 'lucide-react'; 
import { motion } from 'framer-motion';

const WhatsAppButton = () => {
  const handleWhatsAppClick = () => {
    const phoneNumber = '642571133';
    const message = encodeURIComponent('¡Hola! Me interesa conocer más sobre sus productos de corte láser.');
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="whatsapp-float"
      onClick={handleWhatsAppClick}
      aria-label="Contactar por WhatsApp"
    >
      <MessageSquare className="w-6 h-6" strokeWidth={2}/>
    </motion.button>
  );
};

export default WhatsAppButton;