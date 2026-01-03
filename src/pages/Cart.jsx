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

/**
 * Calcula el coste de envío basado en el peso total
 * Misma lógica que la Edge Function
 */
function calculateShippingCost(totalWeight) {
  if (totalWeight < 2) {
    return 5; // 5€
  } else {
    return 8; // 8€
  }
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

  // Custom hooks
  const { handleCheckout, isProcessing: isProcessingCheckout } = useCheckout(items);
  useCartPriceUpdate(items, updateItemPrice);
  const { isPaused, pauseMessage } = useShopPauseStatus();

  // Calcular peso total y coste de envío
  const shippingInfo = useMemo(() => {
    const totalWeight = items.reduce((sum, item) => {
      const weight = item.product.shipping_weight || 0;
      return sum + (weight * item.quantity);
    }, 0);

    const cost = calculateShippingCost(totalWeight);

    return {
      weight: totalWeight,
      cost: cost
    };
  }, [items]);

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
            Seguir comprando
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingBag className="w-8 h-8" />
            Tu Carrito ({total.itemsCount} {total.itemsCount === 1 ? 'artículo' : 'artículos'})
          </h1>
        </div>

        {isEmpty ? (
          /* Carrito vacío */
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Tu carrito está vacío
            </h2>
            <p className="text-gray-600 mb-8">
              Explora nuestros productos y añade los que más te gusten
            </p>
            <Button onClick={() => navigate('/productos')} size="lg">
              Ver productos
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
                  <div className="col-span-6">Producto</div>
                  <div className="col-span-2 text-center">Cantidad</div>
                  <div className="col-span-2 text-right">Precio</div>
                  <div className="col-span-2 text-right">Total</div>
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
                    Vaciar carrito
                  </button>
                </div>
              </div>
            </div>

            {/* Resumen del pedido - 1/3 del ancho */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-32">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Resumen del pedido
                </h2>

                {/* Subtotal */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Subtotal ({total.itemsCount} {total.itemsCount === 1 ? 'artículo' : 'artículos'})</span>
                    <span className="font-medium text-gray-900">
                      {formatPrice(total.subtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Gastos de envío</span>
                    <span className="font-medium text-gray-900">
                      {formatPrice(shippingInfo.cost)}
                    </span>
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {formatPrice(total.subtotal + shippingInfo.cost)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    IVA incluido
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
                  {isProcessingCheckout ? 'Procesando...' : isPaused ? 'Compras Pausadas' : 'Tramitar Pedido'}
                </Button>

                {/* Botón Seguir Comprando */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/productos')}
                >
                  Seguir comprando
                </Button>

                {/* Información adicional */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    El pago se procesará de forma segura a través de Stripe.
                    Los gastos de envío se calcularán según tu dirección en el siguiente paso.
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
