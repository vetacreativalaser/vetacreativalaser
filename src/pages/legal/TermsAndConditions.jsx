
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen py-12 bg-white text-black">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
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
          className="bg-white p-8 shadow border border-gray-200"
        >
          <h1 className="text-3xl font-semibold text-black mb-6">Términos y Condiciones</h1>
          
          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">1. Introducción</h2>
            <p className="text-gray-600 leading-relaxed">
              Bienvenido a Veta Creativa Laser. Estos términos y condiciones describen las reglas y regulaciones para el uso del sitio web de Veta Creativa Laser, ubicado en vetacreativalaser.es.
              Al acceder a este sitio web, asumimos que aceptas estos términos y condiciones. No continúes usando Veta Creativa Laser si no estás de acuerdo con todos los términos y condiciones establecidos en esta página.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">2. Propiedad Intelectual</h2>
            <p className="text-gray-600 leading-relaxed">
              A menos que se indique lo contrario, Veta Creativa Laser y/o sus licenciantes poseen los derechos de propiedad intelectual de todo el material en Veta Creativa Laser. Todos los derechos de propiedad intelectual están reservados. Puedes acceder a esto desde Veta Creativa Laser para tu propio uso personal sujeto a las restricciones establecidas en estos términos y condiciones.
            </p>
            <p className="text-gray-600 leading-relaxed mt-2">
              No debes:
            </p>
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-1">
              <li>Republicar material de Veta Creativa Laser</li>
              <li>Vender, alquilar o sublicenciar material de Veta Creativa Laser</li>
              <li>Reproducir, duplicar o copiar material de Veta Creativa Laser</li>
              <li>Redistribuir contenido de Veta Creativa Laser</li>
              <li>Copiar/robar código del diseño de la página</li>

            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">3. Uso Aceptable</h2>
            <p className="text-gray-600 leading-relaxed">
              No debes usar este sitio web de ninguna manera que cause, o pueda causar, daño al sitio web o deterioro de la disponibilidad o accesibilidad de Veta Creativa Laser; o de cualquier manera que sea ilegal, fraudulenta o dañina, o en conexión con cualquier propósito o actividad ilegal, fraudulenta o dañina.
            </p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">4. Productos y Pedidos</h2>
            <p className="text-gray-600 leading-relaxed">
              Todos los productos están sujetos a disponibilidad. Nos reservamos el derecho de limitar las cantidades de cualquier producto o servicio que ofrecemos. Todas las descripciones de productos o precios de productos están sujetas a cambios en cualquier momento sin previo aviso, a nuestra entera discreción.
              Para realizar un pedido, por favor contacta a través de los medios indicados en la web. El pago se realiza mediante Bizum o transferencia bancaria o enlace de pago.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">5. Envíos y Devoluciones</h2>
            <p className="text-gray-600 leading-relaxed">
              Los costos de envío se calcularán y comunicarán durante el proceso de pedido. 
              Debido a la naturaleza personalizada de muchos de nuestros productos, las devoluciones solo se aceptarán en caso de productos defectuosos o errores por nuestra parte. Por favor, contáctanos si tienes algún problema con tu pedido.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">6. Limitación de Responsabilidad</h2>
            <p className="text-gray-600 leading-relaxed">
              En la medida máxima permitida por la ley aplicable, excluimos todas las representaciones, garantías y condiciones relacionadas con nuestro sitio web y el uso de este sitio web. Nada en este descargo de responsabilidad limitará o excluirá nuestra o tu responsabilidad por muerte o lesiones personales; limitará o excluirá nuestra o tu responsabilidad por fraude o tergiversación fraudulenta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">7. Cambios a los Términos</h2>
            <p className="text-gray-600 leading-relaxed">
              Nos reservamos el derecho de revisar estos términos y condiciones en cualquier momento. Al usar este sitio web, se espera que revises estos términos de forma regular.
            </p>
            <p className="text-gray-600 leading-relaxed mt-4">
              Última actualización: 27/6/2025
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
