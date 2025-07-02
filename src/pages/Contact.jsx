import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Mail, Phone, MapPin, Clock, MessageSquare } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('https://dspsrnprvrpjrkicxiso.supabase.co/functions/v1/send-email-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Mensaje Enviado",
          description: "Gracias por contactarnos. Te responderemos pronto.",
        });
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        throw new Error(result.error || 'Error al enviar el mensaje.');
      }
    } catch (error) {
      toast({
        title: "Error al Enviar",
        description: error.message || "Hubo un problema al enviar tu mensaje. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppClick = () => {
    const phoneNumber = '642571133';
    const message = encodeURIComponent('¡Hola! Me gustaría obtener más información sobre sus productos de corte láser.');
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  const contactInfo = [
    {
      icon: <Mail className="h-5 w-5" strokeWidth={1.5}/>,
      title: 'Email',
      info: 'vetacreativalaser@gmail.com',
    },
    {
      icon: <Phone className="h-5 w-5" strokeWidth={1.5}/>,
      title: 'Teléfono',
      info: '642 571 133',
    },
    {
      icon: <MapPin className="h-5 w-5" strokeWidth={1.5}/>,
      title: 'Ubicación',
      info: 'España',
    },
    {
      icon: <Clock className="h-5 w-5" strokeWidth={1.5}/>,
      title: 'Horario',
      info: 'Lun - Vie: 16:00 - 20:00',
    }
  ];

  return (
    <div className="min-h-screen py-12 bg-white text-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-semibold text-black mb-3">Contáctanos</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            ¿Tienes una idea creativa o necesitas un producto personalizado? Estamos aquí para ayudarte.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="bg-white p-8 border border-gray-200"
          >
            <h2 className="text-2xl font-semibold text-black mb-6">Envíanos un Mensaje</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <Input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Tu nombre completo" className="border-gray-300 focus:border-black focus:ring-black" disabled={isSubmitting}/>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="tu.email@ejemplo.com" className="border-gray-300 focus:border-black focus:ring-black" disabled={isSubmitting}/>
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono (Opcional)</label>
                <Input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Tu número de teléfono" className="border-gray-300 focus:border-black focus:ring-black" disabled={isSubmitting}/>
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
                <Input type="text" id="subject" name="subject" value={formData.subject} onChange={handleInputChange} required placeholder="Asunto de tu mensaje" className="border-gray-300 focus:border-black focus:ring-black" disabled={isSubmitting}/>
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
                <Textarea id="message" name="message" value={formData.message} onChange={handleInputChange} required rows={5} placeholder="Escribe tu mensaje aquí..." className="border-gray-300 focus:border-black focus:ring-black" disabled={isSubmitting}/>
              </div>
              <Button type="submit" size="lg" className="w-full bg-black text-white hover:bg-gray-800 py-3 uppercase tracking-wider text-sm font-semibold" disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
              </Button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="space-y-8"
          >
            <div className="bg-gray-50 p-8 border border-gray-200">
              <h2 className="text-2xl font-semibold text-black mb-6">Información de Contacto</h2>
              <div className="space-y-5">
                {contactInfo.map((item, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 text-black mt-1">{item.icon}</div>
                    <div>
                      <h3 className="font-semibold text-black">{item.title}</h3>
                      <p className="text-gray-600 text-sm">{item.info}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-green-50 p-6 border border-green-200 text-center">
              <MessageSquare className="h-8 w-8 text-green-600 mx-auto mb-3" strokeWidth={1.5} />
              <h3 className="text-lg font-semibold text-green-800 mb-2">¿Prefieres WhatsApp?</h3>
              <p className="text-green-700 text-sm mb-4">Contacta directamente para una respuesta más rápida y personalizada.</p>
              <Button 
                onClick={handleWhatsAppClick}
                className="bg-green-600 text-white transform transition-transform duration-200 hover:scale-105 hover:bg-green-700"
              >
                Chatear por WhatsApp
              </Button>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
