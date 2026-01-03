import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Hook personalizado para actualizar precios del carrito desde la BD
 *
 * Sincroniza los precios del carrito con los precios actuales en Supabase
 * para evitar precios desactualizados en el frontend
 *
 * @param {Array} items - Items del carrito
 * @param {Function} updateItemPrice - Función para actualizar precio de un item
 * @returns {boolean} pricesUpdated - Indica si los precios ya fueron actualizados
 */
export function useCartPriceUpdate(items, updateItemPrice) {
  const [pricesUpdated, setPricesUpdated] = useState(false);

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

  return pricesUpdated;
}
