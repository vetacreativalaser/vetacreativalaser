/**
 * CART TRIGGER - Veta Creativa Láser
 *
 * Botón para abrir el carrito con badge de cantidad
 * Típicamente colocado en el Header/Navbar
 */

import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore, useCartItemCount } from '@/store/useCartStore';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

/**
 * CartTrigger Component
 *
 * Botón flotante con badge que muestra la cantidad de items
 * En móvil: redirige a /carrito
 * En desktop/tablet: abre el drawer del carrito
 */
export default function CartTrigger() {
  const openCart = useCartStore((state) => state.openCart);
  const itemCount = useCartItemCount();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si estamos en móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint de Tailwind
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleClick = () => {
    if (isMobile) {
      // En móvil: ir directamente a la página del carrito
      navigate('/carrito');
    } else {
      // En desktop/tablet: abrir el drawer
      openCart();
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative hover:bg-transparent p-1"
      onClick={handleClick}
      aria-label={`Carrito de compras (${itemCount} items)`}
      type="button"
    >
      <ShoppingCart className="h-6 w-6 text-gray-600 hover:text-black" strokeWidth={2} />

      {/* Badge con cantidad */}
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center pointer-events-none">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Button>
  );
}
