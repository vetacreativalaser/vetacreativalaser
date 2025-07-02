
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, Search as SearchIconPlain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(searchTerm.trim())}`);
      setIsSearchOpen(false);
      setSearchTerm('');
    } else {
      toast({
        title: "Búsqueda vacía",
        description: "Por favor, introduce un término para buscar.",
        variant: "destructive"
      });
    }
  };
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target) && isSearchOpen && !event.target.closest('.search-trigger-button')) {
        setIsSearchOpen(false);
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
                    h-24 w-[12rem]    
                    sm:h-24 sm:w-[12rem] 
                    md:h-22 md:w-[11rem] 
                    lg:h-22 lg:w-[11rem]     /* 64px alto → 144px ancho */
                    xl:h-22 xl:w-[11rem] /* 80px alto → 180px ancho */
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
                
                <Button variant="ghost" size="icon" className="hover:bg-transparent p-1" type="button" aria-label="Icono perfil" onClick={handleProfileIconClick}>
                  <User className="h-7 w-7 text-gray-600 hover:text-black" strokeWidth={1.5}/>
                </Button>
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
                className="max-w-xl mx-auto flex"
              >
                <Input
                  type="search"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-grow border-gray-300 focus:border-black focus:ring-black text-base"
                  autoFocus
                />
              </motion.form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
