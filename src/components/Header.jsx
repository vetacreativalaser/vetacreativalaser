
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, Search as SearchIconPlain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import CartTrigger from '@/components/commerce/cart/CartTrigger';
import { supabase } from '@/lib/supabaseClient';
import { formatPrice } from '@/lib/priceUtils';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const { user } = useAuth();

  const navigation = [
    { name: 'Inicio', href: '/' },
    { name: 'Productos', href: '/productos' },
    { name: 'Sobre nosotros', href: '/sobre-nosotros' },
    { name: 'Contáctanos', href: '/contacto' },
  ];

  const isActive = (path) => location.pathname === path;

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  }

  // Buscar productos mientras escribes (debounced)
  useEffect(() => {
    const searchProducts = async () => {
      if (!searchTerm.trim() || searchTerm.trim().length < 2) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }

      setIsSearching(true);
      const normalizedQuery = searchTerm.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const lowerQuery = `%${normalizedQuery}%`;

      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, price, images, image_urls, image_alts')
          .eq('status', 'active')
          .or(`name.ilike.${lowerQuery},full_description.ilike.${lowerQuery}`)
          .limit(5);

        if (error) throw error;
        setSearchResults(data || []);
        setShowDropdown(true);
      } catch (error) {
        console.error('Error buscando productos:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchProducts, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(searchTerm.trim())}`);
      setIsSearchOpen(false);
      setSearchTerm('');
      setShowDropdown(false);
    } else {
      toast({
        title: "Búsqueda vacía",
        description: "Por favor, introduce un término para buscar.",
        variant: "destructive"
      });
    }
  };

  const handleResultClick = (productId) => {
    navigate(`/productos/${productId}`);
    setIsSearchOpen(false);
    setSearchTerm('');
    setShowDropdown(false);
  };
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target) && isSearchOpen && !event.target.closest('.search-trigger-button')) {
        setIsSearchOpen(false);
        setShowDropdown(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && isMobileMenuOpen && !event.target.closest('.mobile-menu-trigger') && !event.target.closest('header')) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSearchOpen, isMobileMenuOpen]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    setShowDropdown(false);
  }, [location.pathname]);

  const handleProfileIconClick = () => {
    if (user) {
      navigate('/perfil');
    } else {
      navigate('/auth');
    }
  };


  return (
    <>
      <header className={`bg-white fixed top-0 left-0 right-0 z-50 h-28 ${isSearchOpen ? '' : 'border-b border-gray-200 '}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            <div className="md:hidden mobile-menu-trigger">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="hover:bg-transparent p-1"
                aria-label="Icono abrir menu"
                type="button"

              >
                {isMobileMenuOpen ? (
                  <X className="h-7 w-7 text-gray-600 hover:text-black" strokeWidth={1.5}/>
                ) : (
                  <Menu className="h-7 w-7 text-gray-600 hover:text-black" strokeWidth={1.5}/>
                )}
              </Button>
            </div>
            
            <div className="flex-grow flex justify-center md:flex-grow-0 md:flex-none md:justify-start">
              <Link to="/" className="flex items-center">
                <img
                  src="https://dspsrnprvrpjrkicxiso.supabase.co/storage/v1/object/public/imgadmins//Logo-esc.webp"
                  alt="Veta Creativa Laser Logo"
                  className="
                    h-22 w-[10.5rem]    
                    sm:h-22 sm:w-[10.5rem] 
                    md:h-22 md:w-[10.5rem] 
                    lg:h-22 lg:w-[10.5rem]     /* 64px alto → 144px ancho */
                    xl:h-22 xl:w-[10.5rem] /* 80px alto → 180px ancho */
                  "
                />
              </Link>
            </div>


            <div className="hidden md:flex items-center">
              <nav className="flex space-x-5 mr-4">
                {navigation.map((item) => (
                  <div key={item.name} className={`relative group nav-link-${isActive(item.href) ? 'active' : ''}`}>
                    <Link
                      to={item.href}
                      className={`text-[15px] font-normal normal-case tracking-normal py-2 ${
                        isActive(item.href)
                          ? 'text-black'
                          : 'text-gray-500 hover:text-black'
                      } ${item.name === 'Inicio' ? 'hover:bg-transparent' : ''}`}
                    >
                      {item.name}
                    </Link>
                    <span className="nav-link-underline"></span>
                  </div>
                ))}
              </nav>

              <div className="flex items-center space-x-2">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" size="icon" onClick={toggleSearch} className="hover:bg-transparent p-1 search-trigger-button" type="button" aria-label="Icono buscar">
                    <SearchIconPlain className="h-6 w-6 text-gray-600 hover:text-black" strokeWidth={2}/>
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <CartTrigger />
                </motion.div>

                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" size="icon" className="hover:bg-transparent p-1" type="button" aria-label="Boton acceder a perfil" onClick={handleProfileIconClick}>
                    <User className="h-7 w-7 text-gray-600 hover:text-black" strokeWidth={1.5}/>
                  </Button>
                </motion.div>
              </div>
            </div>
            
            <div className="md:hidden flex items-center space-x-0.5">
                <Button variant="ghost" size="icon" onClick={toggleSearch} className="hover:bg-transparent p-1 search-trigger-button" type="button" aria-label="Icono buscar">
                    <SearchIconPlain className="h-6 w-6 text-gray-600 hover:text-black" strokeWidth={2}/>
                </Button>

                <CartTrigger />
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div 
                className="fixed inset-0 bg-black/30 md:hidden"
                style={{ zIndex: 35, top: '7rem' }} 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <motion.div
                ref={mobileMenuRef}
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "tween", duration: 0.3 }}
                className="md:hidden fixed top-28 left-0 h-[calc(100vh-7rem)] w-3/4 max-w-sm bg-white shadow-xl" 
                style={{ zIndex: 40 }}
              >
                <div className="p-5 space-y-3">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`block px-3 py-2.5 text-base font-normal normal-case tracking-normal rounded-md ${
                        isActive(item.href)
                          ? 'text-black bg-gray-100'
                          : 'text-gray-600 hover:text-black hover:bg-gray-50'
                      } ${item.name === 'Inicio' ? 'hover:bg-transparent' : ''}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}

                  {/* Separador */}
                  <div className="border-t border-gray-200 my-3"></div>

                  {/* Opción de Perfil */}
                  <Link
                    to={user ? '/perfil' : '/auth'}
                    className={`flex items-center gap-3 px-3 py-2.5 text-base font-normal normal-case tracking-normal rounded-md ${
                      isActive('/perfil')
                        ? 'text-black bg-gray-100'
                        : 'text-gray-600 hover:text-black hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="h-5 w-5" strokeWidth={1.5} />
                    <span>{user ? 'Mi Perfil' : 'Iniciar Sesión'}</span>
                  </Link>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>
      
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            ref={searchRef}
            initial={{ opacity: 0, y: -70 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -70 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed top-28 left-0 right-0 bg-white z-40 border-b border-gray-200"
            style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <motion.form
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                onSubmit={handleSearchSubmit}
                className="max-w-xl mx-auto flex relative"
              >
                <Input
                  type="search"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-grow border-gray-300 focus:border-black focus:ring-black text-base"
                  autoFocus
                />

                {/* Dropdown de resultados */}
                <AnimatePresence>
                  {showDropdown && searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50"
                    >
                      {searchResults.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleResultClick(product.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 text-left"
                        >
                          {/* Imagen del producto */}
                          <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                            <img
                              src={(() => {
                                if (product.images?.[0]?.url) {
                                  return product.images[0].url;
                                }
                                try {
                                  const urls = typeof product.image_urls === 'string'
                                    ? JSON.parse(product.image_urls)
                                    : product.image_urls;
                                  return Array.isArray(urls) && urls.length > 0 ? urls[0] : '';
                                } catch {
                                  return '';
                                }
                              })()}
                              alt={product.images?.[0]?.alt || product.image_alts?.[0] || product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Info del producto */}
                          <div className="flex-grow min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(() => {
                                try {
                                  const parsed = typeof product.price === 'string'
                                    ? JSON.parse(product.price)
                                    : product.price;
                                  if (parsed?.type === 'fixed') {
                                    return formatPrice(parsed.value || parsed.fixedPrice);
                                  }
                                  return 'Precio variable';
                                } catch {
                                  return 'Precio variable';
                                }
                              })()}
                            </p>
                          </div>
                        </button>
                      ))}

                      {/* Ver todos los resultados */}
                      <button
                        type="submit"
                        className="w-full px-4 py-3 text-sm text-center text-black font-medium hover:bg-gray-50 transition-colors border-t border-gray-200"
                      >
                        Ver todos los resultados
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Indicador de carga */}
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  </div>
                )}
              </motion.form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
