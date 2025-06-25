
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
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
          <h1 className="text-3xl font-semibold text-black mb-6">Política de Privacidad</h1>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">1. Información que Recopilamos</h2>
            <p className="text-gray-600 leading-relaxed">
              Recopilamos información personal que nos proporcionas directamente cuando te registras en nuestro sitio, realizas un pedido, te suscribes a nuestro boletín o te comunicas con nosotros. Esta información puede incluir:
            </p>
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-1">
              <li>Nombre completo</li>
              <li>Dirección de correo electrónico</li>
              <li>Número de teléfono</li>
              <li>Dirección de envío (si aplica)</li>
              <li>Información de pago (gestionada de forma segura por nuestros procesadores de pago)</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-2">
              También podemos recopilar información automáticamente cuando visitas nuestro sitio web, como tu dirección IP, tipo de navegador, páginas visitadas y tiempos de acceso, a través de cookies y tecnologías similares.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">2. Cómo Usamos tu Información</h2>
            <p className="text-gray-600 leading-relaxed">
              Utilizamos la información que recopilamos para:
            </p>
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-1">
              <li>Procesar tus pedidos y gestionar tu cuenta.</li>
              <li>Comunicarnos contigo sobre tus pedidos, productos y servicios.</li>
              <li>Personalizar tu experiencia en nuestro sitio web.</li>
              <li>Enviar correos electrónicos promocionales y boletines informativos (si has optado por recibirlos).</li>
              <li>Mejorar nuestro sitio web, productos y servicios.</li>
              <li>Cumplir con nuestras obligaciones legales.</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">3. Compartir tu Información</h2>
            <p className="text-gray-600 leading-relaxed">
              No vendemos, comercializamos ni transferimos de otro modo a terceros tu información de identificación personal sin tu consentimiento, excepto en los siguientes casos:
            </p>
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-1">
              <li>Proveedores de servicios de confianza que nos asisten en la operación de nuestro sitio web, la conducciónde nuestro negocio o la prestación de servicios, siempre que dichas partes acuerden mantener esta información confidencial.</li>
              <li>Cuando creamos que la divulgación es apropiada para cumplir con la ley, hacer cumplir las políticas de nuestro sitio o proteger nuestros derechos, propiedad o seguridad, o los de otros.</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">4. Seguridad de tu Información</h2>
            <p className="text-gray-600 leading-relaxed">
              Implementamos una variedad de medidas de seguridad para mantener la seguridad de tu información personal. Utilizamos Supabase para la gestión de usuarios y autenticación, que proporciona robustas medidas de seguridad.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">5. Cookies</h2>
            <p className="text-gray-600 leading-relaxed">
              Utilizamos cookies para mejorar tu experiencia en nuestro sitio. Puedes consultar nuestra <Link to="/politica-de-cookies" className="text-blue-600 hover:underline">Política de Cookies</Link> para obtener más información.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">6. Tus Derechos</h2>
            <p className="text-gray-600 leading-relaxed">
              Tienes derecho a acceder, corregir, actualizar o solicitar la eliminación de tu información personal. Puedes hacerlo contactándonos directamente o, si eres un usuario registrado, a través de la configuración de tu perfil.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">7. Cambios a esta Política</h2>
            <p className="text-gray-600 leading-relaxed">
              Nos reservamos el derecho de modificar esta política de privacidad en cualquier momento. Cualquier cambio será publicado en esta página.
            </p>
            <p className="text-gray-600 leading-relaxed mt-4">
              Última actualización: {new Date().toLocaleDateString()}
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
