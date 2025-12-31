/**
 * CART TRIGGER - Veta Creativa Láser
 *
 * Botón para abrir el carrito con badge de cantidad
 * Típicamente colocado en el Header/Navbar
 */

import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore, useCartItemCount } from '@/store/useCartStore';

/**
 * CartTrigger Component
 *
 * Botón flotante con badge que muestra la cantidad de items
 * y abre el drawer del carrito al hacer click
 */
export default function CartTrigger() {
  const openCart = useCartStore((state) => state.openCart);
  const itemCount = useCartItemCount();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative hover:bg-transparent p-1"
      onClick={openCart}
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
