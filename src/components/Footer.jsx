
import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Footer = () => {
  const { t, language, setLanguage } = useLanguage();

  return (
    <footer className="bg-black text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <span className="text-lg font-semibold mb-4 block">{t('footer.help')}</span>
            <ul className="space-y-2">
              <li>
                <Link to="/contacto" className="text-gray-400 hover:text-white hover:underline transition-colors">
                  {t('footer.contact')}
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-400 hover:text-white hover:underline transition-colors">
                  {t('footer.faq')}
                </Link>
              </li>
              <li>
                <Link to="/politica-de-privacidad" className="text-gray-400 hover:text-white hover:underline transition-colors cursor-pointer">
                  {t('footer.privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link to="/terminos-y-condiciones" className="text-gray-400 hover:text-white hover:underline transition-colors cursor-pointer">
                  {t('footer.terms')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <span className="text-lg font-semibold mb-4 block">{t('footer.shop')}</span>
            <ul className="space-y-2">
              <li>
                <Link to="/favoritos" className="text-gray-400 hover:text-white hover:underline transition-colors">
                  {t('footer.favorites')}
                </Link>
              </li>
              <li>
                <Link to="/guias-de-compra" className="text-gray-400 hover:text-white hover:underline transition-colors cursor-pointer">
                  {t('footer.buyingGuides')}
                </Link>
              </li>
              <li>
                <Link to="/productos" className="text-gray-400 hover:text-white hover:underline transition-colors cursor-pointer">
                  {t('footer.products')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <span className="text-lg font-semibold mb-4 block">{t('footer.about')}</span>
            <ul className="space-y-2">
              <li>
                <Link to="/sobre-nosotros" className="text-gray-400 hover:text-white hover:underline transition-colors">
                  {t('footer.companyInfo')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <span className="text-lg font-semibold mb-4 block">{t('footer.contactUs')}</span>
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
                <span className="text-gray-400">{t('footer.spain')}</span>
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <a
                href="https://www.facebook.com/profile.php?id=61574227811463"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook de Veta Creativa Láser"
              >
                <Facebook className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
              </a>

              <a
                href="https://www.instagram.com/vetacreativalaser"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram de Veta Creativa Láser"
              >
                <Instagram className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
              </a>

              <a
                href="https://www.tiktok.com/@vetacreativalaser"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Tiktok de Veta Creativa Láser"
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
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex space-x-6">
              <Link to="/terminos-y-condiciones" className="text-gray-400 hover:text-white hover:underline cursor-pointer transition-colors text-sm">
                {t('footer.terms')}
              </Link>
              <Link to="/politica-de-privacidad" className="text-gray-400 hover:text-white hover:underline cursor-pointer transition-colors text-sm">
                {t('footer.privacy')}
              </Link>
              <Link to="/politica-de-cookies" className="text-gray-400 hover:text-white hover:underline cursor-pointer transition-colors text-sm">
                {t('footer.cookies')}
              </Link>
            </div>

            {/* Selector de idioma */}
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">{t('footer.language')}:</span>
              <select
                value={language || 'es'}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-black text-gray-300 border border-gray-700 rounded px-3 py-1 text-sm focus:outline-none focus:border-gray-500 cursor-pointer"
              >
                <option value="es">Castellano</option>
                <option value="ca">Català</option>
              </select>
            </div>
          </div>

          <p className="text-gray-400 text-sm text-center mt-6">
            {t('footer.copyright')} {new Date().getFullYear()}, Veta Creativa Láser
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
