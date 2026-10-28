/**
 * CART PAGE - Veta Creativa Láser
 *
 * Página completa del carrito de compras
 * Vista previa al checkout definitivo con Stripe
 */

import { ShoppingBag, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore, useCart } from '@/store/useCartStore';
import CartItem from '@/components/commerce/cart/CartItem';
import { formatPrice } from '@/lib/priceUtils';
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartPriceUpdate } from '@/hooks/useCartPriceUpdate';
import { useCheckout } from '@/hooks/useCheckout';
import { useShopPauseStatus } from '@/hooks/useShopPauseStatus';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Coste de envío peninsular fijo
 */
const SHIPPING_PENINSULA = 5; // 5€ envío peninsular

/**
 * Comisión por pago con tarjeta (Stripe): 1.5% + 0.25€
 */
function calculateCardCommission(subtotal) {
  return Math.round((subtotal * 0.015 + 0.25) * 100) / 100;
}

/**
 * Cart Page Component
 *
 * Página completa del carrito antes del checkout final
 * Similar al CartDrawer pero con layout completo
 */
export default function Cart() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clearCart, updateItemPrice, cleanupInvalidItems } = useCartStore();
  const { total } = useCart();
  const { t, language } = useLanguage();

  // Custom hooks
  const { handleCheckout, isProcessing: isProcessingCheckout } = useCheckout(items);
  useCartPriceUpdate(items, updateItemPrice);
  const { isPaused, pauseMessage } = useShopPauseStatus();

  // Calcular peso total y coste de envío
  const shippingInfo = useMemo(() => {
    return {
      cost: SHIPPING_PENINSULA
    };
  }, []);

  const cardCommission = useMemo(() => {
    return calculateCardCommission(total.subtotal);
  }, [total.subtotal]);

  // Limpiar items inválidos al cargar la página
  useEffect(() => {
    if (cleanupInvalidItems) {
      cleanupInvalidItems();
    }
  }, [cleanupInvalidItems]);

  const isEmpty = items.length === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/productos')}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('cart.continueShopping')}
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingBag className="w-8 h-8" />
            {t('cart.title')} ({total.itemsCount} {total.itemsCount === 1 ? t('cart.article') : t('cart.articles')})
          </h1>
        </div>

        {isEmpty ? (
          /* Carrito vacío */
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              {t('cart.empty')}
            </h2>
            <p className="text-gray-600 mb-8">
              {t('cart.emptyDesc')}
            </p>
            <Button onClick={() => navigate('/productos')} size="lg">
              {t('cart.seeProducts')}
            </Button>
          </div>
        ) : (
          /* Carrito con items */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de productos - 2/3 del ancho */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm">
                {/* Header de la tabla (desktop) */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-200 text-sm font-medium text-gray-700">
                  <div className="col-span-6">{t('cart.product')}</div>
                  <div className="col-span-2 text-center">{t('cart.quantity')}</div>
                  <div className="col-span-2 text-right">{t('cart.price')}</div>
                  <div className="col-span-2 text-right">{t('cart.total')}</div>
                </div>

                {/* Items del carrito */}
                <div className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <div key={item.itemId} className="p-6">
                      <CartItem
                        item={item}
                        onUpdateQuantity={updateQuantity}
                        onRemove={removeItem}
                      />
                    </div>
                  ))}
                </div>

                {/* Botón vaciar carrito */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={clearCart}
                    className="text-sm text-gray-600 hover:text-destructive transition-colors"
                  >
                    {t('cart.clear')}
                  </button>
                </div>
              </div>
            </div>

            {/* Resumen del pedido - 1/3 del ancho */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-32">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('cart.orderSummary')}
                </h2>

                {/* Subtotal */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{t('cart.subtotal')} ({total.itemsCount} {total.itemsCount === 1 ? t('cart.article') : t('cart.articles')})</span>
                    <span className="font-medium text-gray-900">
                      {formatPrice(total.subtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{t('cart.shipping')}</span>
                    <span className="font-medium text-gray-900">
                      {formatPrice(SHIPPING_PENINSULA)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{t('cart.commission')}</span>
                    <span className="font-medium text-gray-900">
                      {formatPrice(cardCommission)}
                    </span>
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-gray-900">{t('cart.total')}</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {formatPrice(total.subtotal + SHIPPING_PENINSULA + cardCommission)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {t('cart.vat')}
                  </p>
                </div>

                {/* Mensaje de compras pausadas */}
                {isPaused && pauseMessage && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800 leading-relaxed">{pauseMessage}</p>
                    </div>
                  </div>
                )}

                {/* Botón Tramitar Pedido */}
                <Button
                  size="lg"
                  className="w-full mb-3"
                  onClick={handleCheckout}
                  disabled={isProcessingCheckout || isPaused}
                >
                  {isProcessingCheckout ? t('cart.processing') : isPaused ? t('cart.paused') : t('cart.checkout')}
                </Button>

                {/* Botón Enviar pedido por WhatsApp (recoger en Vendrell) */}
                <Button
                  size="lg"
                  className="w-full mb-3 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => window.open(buildWhatsAppLink(items, language), '_blank')}
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  {t('cart.whatsappButton')}
                </Button>

                {/* Botón Seguir Comprando */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/productos')}
                >
                  {t('cart.continueShopping')}
                </Button>

                {/* Información adicional */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {t('cart.paymentInfo')}
                  </p>
                  <p className="text-xs text-green-700 leading-relaxed mt-2">
                    {t('cart.vendrellInfo')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
