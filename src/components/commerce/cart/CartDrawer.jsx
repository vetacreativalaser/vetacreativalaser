/**
 * CART DRAWER - Veta Creativa Láser
 *
 * Panel lateral deslizante que muestra el carrito de compras
 * Usa animaciones y overlay para mejor UX
 */

import { X, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore, useCart } from '@/store/useCartStore';
import CartItem from './CartItem';
import { formatPrice } from '@/lib/priceUtils';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

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
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [pricesUpdated, setPricesUpdated] = useState(false);

  // Limpiar items inválidos al abrir el carrito
  useEffect(() => {
    if (isOpen && cleanupInvalidItems) {
      cleanupInvalidItems();
    }
  }, [isOpen, cleanupInvalidItems]);

  // Actualizar precios desde la BD cuando se abre el carrito
  useEffect(() => {
    const updatePrices = async () => {
      if (isOpen && items.length > 0 && !pricesUpdated) {
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
  }, [isOpen, items, pricesUpdated, updateItemPrice]);

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

            {/* Botón Tramitar Pedido */}
            <Button
              size="lg"
              className="w-full"
              onClick={handleCheckout}
              disabled={isProcessingCheckout}
            >
              {isProcessingCheckout ? 'Procesando...' : 'Tramitar Pedido'}
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
