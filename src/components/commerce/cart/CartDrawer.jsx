/**
 * CART DRAWER - Veta Creativa Láser
 *
 * Panel lateral deslizante que muestra el carrito de compras
 * Usa animaciones y overlay para mejor UX
 */

import { X, ShoppingBag, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore, useCart } from '@/store/useCartStore';
import CartItem from './CartItem';
import { formatPrice } from '@/lib/priceUtils';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartPriceUpdate } from '@/hooks/useCartPriceUpdate';
import { useCheckout } from '@/hooks/useCheckout';
import { useShopPauseStatus } from '@/hooks/useShopPauseStatus';

/**
 * CartDrawer Component
 *
 * Panel lateral que se abre desde la derecha
 * Conectado automáticamente al store de Zustand
 */
export default function CartDrawer() {
  const navigate = useNavigate();
  const { items, isOpen, closeCart, updateQuantity, removeItem, clearCart, updateItemPrice, cleanupInvalidItems } = useCartStore();
  const { total } = useCart();

  // Custom hooks
  const { handleCheckout, isProcessing: isProcessingCheckout } = useCheckout(items);
  useCartPriceUpdate(items, updateItemPrice);
  const { isPaused, pauseMessage } = useShopPauseStatus();

  // Limpiar items inválidos al abrir el carrito
  useEffect(() => {
    if (isOpen && cleanupInvalidItems) {
      cleanupInvalidItems();
    }
  }, [isOpen, cleanupInvalidItems]);

  // Prevenir scroll del body cuando el drawer está abierto
  // Y compensar el ancho del scrollbar para evitar layout shift
  useEffect(() => {
    if (isOpen) {
      // Calcular el ancho del scrollbar antes de ocultarlo
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      // Aplicar overflow hidden y compensar con padding
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;

        // También aplicar padding al header para evitar que se mueva
        const header = document.querySelector('header');
        if (header) {
          header.style.paddingRight = `${scrollbarWidth}px`;
        }
      }
    } else {
      // Restaurar estado original
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';

      const header = document.querySelector('header');
      if (header) {
        header.style.paddingRight = '';
      }
    }

    return () => {
      // Cleanup: siempre restaurar
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';

      const header = document.querySelector('header');
      if (header) {
        header.style.paddingRight = '';
      }
    };
  }, [isOpen]);

  const isEmpty = items.length === 0;

  return (
    <>
      {/* Overlay - Fondo oscuro */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={closeCart}
          aria-hidden="true"
        />
      )}

      {/* Drawer Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Carrito ({total.itemsCount})
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeCart}
            className="hover:bg-transparent text-gray-600 hover:text-black"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Items List - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Tu carrito está vacío
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Añade productos para comenzar tu pedido
              </p>
              <Button onClick={closeCart} variant="outline">
                Seguir comprando
              </Button>
            </div>
          ) : (
            <div className="space-y-0">
              {items.map((item) => (
                <CartItem
                  key={item.itemId}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer - Resumen y acciones */}
        {!isEmpty && (
          <div className="border-t border-gray-200 p-4 space-y-4 bg-gray-50">
            {/* Botón vaciar carrito */}
            <button
              onClick={clearCart}
              className="text-xs text-gray-500 hover:text-destructive transition-colors"
            >
              Vaciar carrito
            </button>

            {/* Subtotal */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">
                  {formatPrice(total.subtotal)}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Los gastos de envío se calcularán en el checkout
              </p>
            </div>

            {/* Mensaje de compras pausadas */}
            {isPaused && pauseMessage && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">{pauseMessage}</p>
                </div>
              </div>
            )}

            {/* Botón Tramitar Pedido */}
            <Button
              size="lg"
              className="w-full"
              onClick={handleCheckout}
              disabled={isProcessingCheckout || isPaused}
            >
              {isProcessingCheckout ? 'Procesando...' : isPaused ? 'Compras Pausadas' : 'Tramitar Pedido'}
            </Button>

            {/* Botón Ver Carrito Completo - Solo en Desktop */}
            <Button
              size="lg"
              variant="outline"
              className="w-full hidden sm:flex"
              onClick={() => {
                closeCart();
                navigate('/carrito');
              }}
            >
              Ver Carrito Completo
            </Button>

            {/* Botón Seguir Comprando */}
            <Button
              variant="ghost"
              className="w-full"
              onClick={closeCart}
            >
              Seguir comprando
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
