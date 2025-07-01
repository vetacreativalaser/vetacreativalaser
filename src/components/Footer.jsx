
import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-black text-white mt-auto"> {/* Ensure footer is at the bottom */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <span className="text-lg font-semibold mb-4 block">Ayuda</span>
            <ul className="space-y-2">
              <li>
                <Link to="/contacto" className="text-gray-400 hover:text-white hover:underline transition-colors">
                  Contáctanos
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-400 hover:text-white hover:underline transition-colors">
                  Preguntas frecuentes
                </Link>
              </li>
              <li>
                <Link to="/politica-de-privacidad" className="text-gray-400 hover:text-white hover:underline transition-colors cursor-pointer">
                  Política de privacidad
                </Link>
              </li>
              <li>
                <Link to="/terminos-y-condiciones" className="text-gray-400 hover:text-white hover:underline transition-colors cursor-pointer">
                  Términos y condiciones
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <span className="text-lg font-semibold mb-4 block">Compra</span>
            <ul className="space-y-2">
              <li>
                <Link to="/favoritos" className="text-gray-400 hover:text-white hover:underline transition-colors">
                  Lista de favoritos
                </Link>
              </li>
              <li>
                <Link to="/guias-de-compra" className="text-gray-400 hover:text-white hover:underline transition-colors cursor-pointer">
                  Guías de compra
                </Link>
              </li>
              <li>
                  <Link to="/productos" className="text-gray-400 hover:text-white hover:underline transition-colors cursor-pointer">
                    Productos                
                  </Link>
              </li>
            </ul>
          </div>

          <div>
            <span className="text-lg font-semibold mb-4 block">Sobre Nosotros</span>
            <ul className="space-y-2">
              <li>
                <Link to="/sobre-nosotros" className="text-gray-400 hover:text-white hover:underline transition-colors">
                  Información de la compañía
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <span className="text-lg font-semibold mb-4 block">Contacto</span>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-400">vetacreativalaser@gmail.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-400">642 571 133</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-400">España</span>
              </div>
            </div>
            
            <div className="flex space-x-4 mt-6">
              <a
  href="https://www.facebook.com/profile.php?id=61574227811463"
  target="_blank"
  rel="noopener noreferrer"
>
  <Facebook className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
</a>

<a
  href="https://www.instagram.com/vetacreativalaser"
  target="_blank"
  rel="noopener noreferrer"
>
  <Instagram className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
</a>

<a
  href="https://www.tiktok.com/@vetacreativalaser"
  target="_blank"
  rel="noopener noreferrer"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 24 24"
    className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer transition-colors"
  >
    <path d="M9.5 3.8v12.3c0 1.5-.7 2.2-1.7 2.2s-1.8-.7-1.8-2.1c0-1.3.7-2.1 1.8-2.1.4 0 .7.1 1 .3V11c-.3 0-.6-.1-1-.1-2.3 0-4 1.6-4 4.1 0 2.4 1.7 4.1 3.9 4.1 2.3 0 3.9-1.7 3.9-4.1V8.1c.9.6 2.1.9 3.1.9v-2c-.6 0-1.4-.3-2.1-.8-.6-.5-.9-1.1-.9-2.1H9.5z" />
  </svg>
</a>

            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex space-x-6 mb-4 md:mb-0">
              <Link to="/terminos-y-condiciones" className="text-gray-500 hover:text-white hover:underline cursor-pointer transition-colors text-sm">
                Términos y condiciones
              </Link>
              <Link to="/politica-de-privacidad" className="text-gray-500 hover:text-white hover:underline cursor-pointer transition-colors text-sm">
                Privacidad
              </Link>
              <Link to="/politica-de-cookies" className="text-gray-500 hover:text-white hover:underline cursor-pointer transition-colors text-sm">
                Cookies
              </Link>
            </div>
            <p className="text-gray-500 text-sm text-center">
              Copyright {new Date().getFullYear()}, Veta Creativa Laser
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
