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
import { buildWhatsAppLink } from '@/lib/whatsapp';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t, language } = useLanguage();

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
            {t('cart.drawerTitle')} ({total.itemsCount})
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
                {t('cart.empty')}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {t('cart.addProducts')}
              </p>
              <Button onClick={closeCart} variant="outline">
                {t('cart.continueShopping')}
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
              {t('cart.clear')}
            </button>

            {/* Subtotal */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t('cart.subtotal')}</span>
                <span className="font-medium text-gray-900">
                  {formatPrice(total.subtotal)}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {t('cart.shippingCalculated')}
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
              {isProcessingCheckout ? t('cart.processing') : isPaused ? t('cart.paused') : t('cart.checkout')}
            </Button>

            {/* Botón Enviar pedido por WhatsApp (recoger en Vendrell) */}
            <Button
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={() => window.open(buildWhatsAppLink(items, language), '_blank')}
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              {t('cart.whatsappButton')}
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
              {t('cart.viewFull')}
            </Button>

            {/* Botón Seguir Comprando */}
            <Button
              variant="ghost"
              className="w-full"
              onClick={closeCart}
            >
              {t('cart.continueShopping')}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
