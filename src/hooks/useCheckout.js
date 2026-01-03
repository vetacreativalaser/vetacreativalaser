import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

/**
 * Hook personalizado para manejar el proceso de checkout con Stripe
 *
 * Encapsula toda la lógica de crear la sesión de Stripe y redirigir al usuario
 *
 * @param {Array} items - Items del carrito
 * @returns {Object} { handleCheckout, isProcessing }
 */
export function useCheckout(items) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast({
        title: 'Carrito vacío',
        description: 'Añade productos antes de continuar.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);

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
        if (data && data.error) {
          throw new Error(`Error del servidor: ${data.error}`);
        }
        throw new Error('No se recibió una URL de pago válida');
      }

      // 3. Redirigir al usuario a Stripe Checkout
      window.location.href = data.url;

    } catch (error) {
      console.error('Error en checkout:', error);
      toast({
        title: 'Error al procesar el pedido',
        description: error.message || 'Por favor, inténtalo de nuevo más tarde.',
        variant: 'destructive'
      });
      setIsProcessing(false);
    }
  };

  return { handleCheckout, isProcessing };
}
