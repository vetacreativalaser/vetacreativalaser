import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqData = [
  {
    question: "¿Cuánto tiempo tarda un pedido personalizado?",
    answer: "Los pedidos personalizados suelen tardar entre 7 y 21 días laborables en producirse, dependiendo de la complejidad del diseño y nuestra carga de trabajo actual. Te informaremos del plazo estimado antes de confirmar tu pedido. En caso de retraso con la fecha de entrega por culpa de nuestra empresa se le realizará un descuento superior por las molestias, o incluso retorno total del dinero. De nuestra empresa excluye que la empresa de paquetería tarde más de lo esperado en enviar su paquete. Para mayor rapidez le recomendamos pedir en épocas de fiesta o fines de semana, recuerda que tengo 15 años y entre semana estudio, por lo que la disponibilidad es menor."
  },
  {
    question: "¿Qué tipos de madera utilizan?",
    answer: "Trabajamos principalmente con madera de abedul, pino y MDF de alta calidad, todos ellos seleccionados por su idoneidad para el corte láser y su acabado. Si tienes preferencia por un tipo de madera específico, consúltanos."
  },
  {
    question: "¿Hacen envíos a toda España?",
    answer: "Sí, realizamos envíos a toda la Península Ibérica y Baleares. Los gastos de envío se calculan en función del destino y el peso/volumen del pedido. Para envíos a Canarias, Ceuta o Melilla, por favor contáctanos previamente."
  },
  {
    question: "¿Puedo enviar mi propio diseño para cortar?",
    answer: "¡Claro! Estaremos encantados de revisar tu diseño. Preferimos archivos en formato vectorial (SVG, AI, DXF). Contáctanos para más detalles sobre los requisitos del archivo y para obtener un presupuesto."
  },
  {
    question: "¿Qué métodos de pago aceptan?",
    answer: "Actualmente, para pedidos personalizados, gestionamos los pagos a través de transferencia bancaria o Bizum. Te proporcionaremos los detalles al confirmar tu pedido."
  },
  {
    question: "¿Cuál es su política de devoluciones?",
    answer: "Para productos personalizados, solo aceptamos devoluciones si el producto llega dañado o hay un error por nuestra parte en la personalización. Para productos no personalizados, tienes 14 días para realizar una devolución. Consulta nuestros Términos y Condiciones para más detalles."
  }
];

const FAQ = () => {
  return (
    <div className="min-h-screen py-12 bg-white text-black">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <HelpCircle className="h-12 w-12 text-black mx-auto mb-4" strokeWidth={1.5}/>
          <h1 className="text-4xl font-semibold text-black mb-3">
            Preguntas Frecuentes
          </h1>
          <p className="text-lg text-gray-600">
            Encuentra respuestas a las dudas más comunes sobre nuestros productos y servicios.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqData.map((item, index) => (
              <AccordionItem value={`item-${index}`} key={index} className="border border-gray-200 bg-white transition-shadow hover:shadow-md">
                <AccordionTrigger className="px-6 py-4 text-left font-medium text-black hover:no-underline hover:bg-gray-50 text-md">
                  <span className="flex-1">{item.question}</span>
                  <ChevronDown className="h-5 w-5 shrink-0 transition-transform duration-200 text-gray-500" strokeWidth={1.5}/>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 pt-0 text-gray-600 leading-relaxed text-sm">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-gray-600 mb-2">¿No encuentras tu respuesta?</p>
          <Link to="/contacto" className="font-medium text-black hover:underline">
            Contáctanos directamente
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQ;