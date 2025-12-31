
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const CookiePolicy = () => {
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
          <h1 className="text-3xl font-semibold text-black mb-6">Política de Cookies</h1>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">1. ¿Qué son las Cookies?</h2>
            <p className="text-gray-600 leading-relaxed">
              Las cookies son pequeños archivos de texto que los sitios web que visitas colocan en tu ordenador. Se utilizan ampliamente para que los sitios web funcionen, o funcionen de manera más eficiente, así como para proporcionar información a los propietarios del sitio.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">2. ¿Cómo Usamos las Cookies?</h2>
            <p className="text-gray-600 leading-relaxed">
              Utilizamos cookies para varios propósitos, incluyendo:
            </p>
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-1">
              <li><strong>Cookies Esenciales:</strong> Estas cookies son necesarias para que el sitio web funcione y no se pueden desactivar en nuestros sistemas. Generalmente solo se configuran en respuesta a acciones realizadas por ti que equivalen a una solicitud de servicios, como establecer tus preferencias de privacidad, iniciar sesión o completar formularios.</li>
              <li><strong>Cookies de Autenticación (Supabase):</strong> Utilizamos cookies proporcionadas por Supabase para gestionar las sesiones de usuario y mantenerte conectado de forma segura.</li>
              <li><strong>Cookies de Funcionalidad:</strong> Estas cookies permiten que el sitio web recuerde las elecciones que haces (como tu nombre de usuario, idioma o la región en la que te encuentras) y proporcionan características mejoradas y más personales. Por ejemplo, pueden usarse para recordar los detalles de tu inicio de sesión.</li>
              <li><strong>Cookies de Rendimiento/Análisis (si aplica):</strong> Podríamos usar cookies para recopilar información sobre cómo los visitantes usan nuestro sitio web, por ejemplo, qué páginas visitan con más frecuencia y si reciben mensajes de error de las páginas web. Estas cookies no recopilan información que identifique a un visitante. Toda la información que estas cookies recopilan es agregada y, por lo tanto, anónima. Solo se utiliza para mejorar el funcionamiento del sitio web. (Actualmente, no estamos utilizando cookies de análisis de terceros de forma explícita más allá de las que Supabase pueda usar para su funcionamiento).</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">3. Gestión de Cookies</h2>
            <p className="text-gray-600 leading-relaxed">
              Puedes controlar y/o eliminar las cookies como desees. Para más detalles, consulta aboutcookies.org. Puedes eliminar todas las cookies que ya están en tu ordenador y puedes configurar la mayoría de los navegadores para evitar que se coloquen. Sin embargo, si haces esto, es posible que tengas que ajustar manualmente algunas preferencias cada vez que visites un sitio y que algunos servicios y funcionalidades no funcionen.
            </p>
            <p className="text-gray-600 leading-relaxed mt-2">
              Ten en cuenta que si deshabilitas las cookies esenciales o de autenticación, es posible que no puedas acceder a ciertas áreas o características de nuestro sitio web, como el inicio de sesión.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">4. Cambios a esta Política</h2>
            <p className="text-gray-600 leading-relaxed">
              Podemos actualizar nuestra Política de Cookies de vez en cuando. Te notificaremos cualquier cambio publicando la nueva Política de Cookies en esta página.
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

export default CookiePolicy;
