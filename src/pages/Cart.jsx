/**
 * CART PAGE - Veta Creativa Láser
 *
 * Página completa del carrito de compras
 * Vista previa al checkout definitivo con Stripe
 */

import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore, useCart } from '@/store/useCartStore';
import CartItem from '@/components/commerce/cart/CartItem';
import { formatPrice } from '@/lib/priceUtils';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

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
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [pricesUpdated, setPricesUpdated] = useState(false);

  // Limpiar items inválidos al cargar la página
  useEffect(() => {
    if (cleanupInvalidItems) {
      cleanupInvalidItems();
    }
  }, [cleanupInvalidItems]);

  // Actualizar precios desde la BD cuando se carga la página
  useEffect(() => {
    const updatePrices = async () => {
      if (items.length > 0 && !pricesUpdated) {
        try {
          const productIds = items.map(item => item.product.id);
          const { data: products, error } = await supabase
            .from('products')
            .select('id, price')
            .in('id', productIds);

          if (!error && products) {
            // Actualizar el priceConfig de cada item en el carrito
            products.forEach(product => {
              const cartItem = items.find(item => item.product.id === product.id);
              if (cartItem && updateItemPrice) {
                updateItemPrice(cartItem.itemId, product.price);
              }
            });
            setPricesUpdated(true);
          }
        } catch (error) {
          console.error('Error al actualizar precios:', error);
        }
      }
    };

    updatePrices();
  }, [items, pricesUpdated, updateItemPrice]);

  // Handler para procesar pedido con Stripe
  const handleCheckout = async () => {
    if (items.length === 0) {
      toast({
        title: 'Carrito vacío',
        description: 'Añade productos antes de continuar.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessingCheckout(true);

    try {
      // 1. Preparar datos del carrito para el checkout
      const cartItems = items.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        priceConfig: item.product.price,
        customization: item.customization,
        selectedReason: item.selectedReason
      }));

      // 2. Llamar a la Edge Function de Supabase para crear la sesión de Stripe
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { cartItems }
      });

      if (error) {
        console.error('Error al invocar la función:', error);
        throw new Error(error.message || 'Error al crear la sesión de pago');
      }

      if (!data || !data.url) {
        console.error('Respuesta de la función:', data);
        // Mostrar el error específico si viene en data
        if (data && data.error) {
          throw new Error(`Error del servidor: ${data.error}`);
        }
        throw new Error('No se recibió una URL de pago válida');
      }

      // 3. Redirigir al usuario a Stripe Checkout usando la URL completa
      console.log('Redirigiendo a Stripe Checkout:', data.url);
      window.location.href = data.url;

      // Si todo va bien, el usuario será redirigido a Stripe
      // No cerramos el carrito aquí porque la página se redirigirá

    } catch (error) {
      console.error('Error en checkout:', error);
      toast({
        title: 'Error al procesar el pedido',
        description: error.message || 'Por favor, inténtalo de nuevo más tarde.',
        variant: 'destructive'
      });
      setIsProcessingCheckout(false);
    }
  };

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
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Envío</span>
                    <span>Calculado en el siguiente paso</span>
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-gray-900">Total estimado</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {formatPrice(total.subtotal)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    IVA incluido
                  </p>
                </div>

                {/* Botón Tramitar Pedido */}
                <Button
                  size="lg"
                  className="w-full mb-3"
                  onClick={handleCheckout}
                  disabled={isProcessingCheckout}
                >
                  {isProcessingCheckout ? 'Procesando...' : 'Tramitar Pedido'}
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
