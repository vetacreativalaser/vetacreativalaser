/**
 * CART STORE - Veta Creativa Láser
 *
 * Store global del carrito de compras usando Zustand con persistencia en localStorage.
 *
 * Características:
 * - Persistencia automática en localStorage
 * - Generación de itemId único basado en product + customization + reason
 * - Cálculos de precio centralizados usando priceUtils
 * - Control de visibilidad del cart drawer
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateCartTotal } from '../lib/priceUtils';

/**
 * Genera un ID único para un item del carrito
 *
 * Combina: productId + customization + selectedReason
 * Esto permite que el mismo producto con diferentes personalizaciones
 * se trate como items separados en el carrito
 *
 * @param {string|number} productId - ID del producto
 * @param {Object} customization - Objeto con campos personalizados
 * @param {string|null} selectedReason - Motivo seleccionado (para byReason pricing)
 * @returns {string} - ID único del item
 */
function generateItemId(productId, customization = {}, selectedReason = null) {
  const customizationHash = JSON.stringify(customization || {});
  const reasonHash = selectedReason || '';
  return `${productId}__${customizationHash}__${reasonHash}`;
}

/**
 * @typedef {Object} CartItem
 * @property {string} itemId - ID único generado
 * @property {Object} product - Objeto producto completo de Supabase
 * @property {number} quantity - Cantidad
 * @property {Object} customization - Datos de personalización { fieldLabel: value }
 * @property {string|null} selectedReason - Motivo seleccionado (byReason)
 * @property {Object} priceConfig - Copia de product.price (JSONB) para referencia rápida
 * @property {Date} addedAt - Timestamp de cuándo se añadió
 */

/**
 * @typedef {Object} CartState
 * @property {CartItem[]} items - Items en el carrito
 * @property {boolean} isOpen - Estado del drawer del carrito
 * @property {Function} addItem - Añade o incrementa item
 * @property {Function} removeItem - Elimina item por ID
 * @property {Function} updateQuantity - Actualiza cantidad de un item
 * @property {Function} clearCart - Vacía el carrito
 * @property {Function} toggleCart - Abre/cierra el drawer
 * @property {Function} openCart - Abre el drawer
 * @property {Function} closeCart - Cierra el drawer
 * @property {Function} getCartTotal - Selector para totales calculados
 */

/**
 * Valida que un priceConfig sea válido
 */
function isValidPriceConfig(priceConfig) {
  return priceConfig && typeof priceConfig === 'object' && priceConfig.type;
}

export const useCartStore = create(
  persist(
    (set, get) => ({
      // ========== STATE ==========
      items: [],
      isOpen: false,

      // ========== INITIALIZATION ==========
      /**
       * Limpia items corruptos del carrito al inicializar
       */
      cleanupInvalidItems: () => {
        set(state => ({
          items: state.items.filter(item => {
            const isValid = isValidPriceConfig(item.priceConfig);
            if (!isValid) {
              console.warn('Removing invalid cart item:', item);
            }
            return isValid;
          })
        }));
      },

      // ========== ACTIONS ==========

      /**
       * Añade un producto al carrito o incrementa cantidad si ya existe
       *
       * @param {Object} product - Producto completo de Supabase
       * @param {number} quantity - Cantidad a añadir (default: 1)
       * @param {Object} customization - Datos de personalización
       * @param {string|null} selectedReason - Motivo seleccionado
       */
      addItem: (product, quantity = 1, customization = {}, selectedReason = null) => {
        // Validaciones básicas
        if (!product || !product.id) {
          console.error('Invalid product:', product);
          return;
        }

        if (quantity < 1) {
          console.error('Quantity must be at least 1');
          return;
        }

        // Parsear price si es string
        let priceConfig = product.price;
        console.log('🔍 addItem - product.price tipo:', typeof product.price, 'valor:', product.price);

        if (typeof priceConfig === 'string') {
          try {
            priceConfig = JSON.parse(priceConfig);
            console.log('✅ addItem - price parseado correctamente:', priceConfig);
          } catch (e) {
            console.error('❌ addItem - Error parsing price config:', e);
          }
        }

        if (!priceConfig || !priceConfig.type) {
          console.error('❌ addItem - Product missing price configuration:', product);
          return;
        }

        console.log('✅ addItem - priceConfig validado:', priceConfig);

        const itemId = generateItemId(product.id, customization, selectedReason);
        const currentItems = get().items;
        const existingItemIndex = currentItems.findIndex(item => item.itemId === itemId);

        set(state => {
          let updatedItems;

          if (existingItemIndex >= 0) {
            // Item ya existe: incrementar cantidad
            updatedItems = [...state.items];
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              quantity: updatedItems[existingItemIndex].quantity + quantity
            };
          } else {
            // Item nuevo: crear entrada
            const newItem = {
              itemId,
              product,
              quantity,
              customization: customization || {},
              selectedReason,
              priceConfig: priceConfig, // Copia parseada del JSONB para referencia
              addedAt: new Date().toISOString()
            };
            updatedItems = [...state.items, newItem];
          }

          return { items: updatedItems };
        });
      },

      /**
       * Elimina un item del carrito por su ID
       *
       * @param {string} itemId - ID único del item
       */
      removeItem: (itemId) => {
        set(state => ({
          items: state.items.filter(item => item.itemId !== itemId)
        }));
      },

      /**
       * Actualiza la cantidad de un item existente
       *
       * @param {string} itemId - ID único del item
       * @param {number} newQuantity - Nueva cantidad (si es 0 o menos, elimina el item)
       */
      updateQuantity: (itemId, newQuantity) => {
        if (newQuantity < 1) {
          // Si la cantidad es 0 o negativa, eliminar el item
          get().removeItem(itemId);
          return;
        }

        set(state => ({
          items: state.items.map(item =>
            item.itemId === itemId
              ? { ...item, quantity: newQuantity }
              : item
          )
        }));
      },

      /**
       * Actualiza el priceConfig de un item (para refrescar precios desde DB)
       *
       * @param {string} itemId - ID único del item
       * @param {Object} newPriceConfig - Nueva configuración de precio
       */
      updateItemPrice: (itemId, newPriceConfig) => {
        // Parsear newPriceConfig si es string
        let parsedPriceConfig = newPriceConfig;
        if (typeof newPriceConfig === 'string') {
          try {
            parsedPriceConfig = JSON.parse(newPriceConfig);
          } catch (e) {
            console.error('Error parsing newPriceConfig:', e);
            return; // No actualizar si el precio es inválido
          }
        }

        // Validar que tenga el campo 'type'
        if (!parsedPriceConfig || !parsedPriceConfig.type) {
          console.error('updateItemPrice: newPriceConfig missing type field', newPriceConfig);
          return; // No actualizar si el precio es inválido
        }

        set(state => ({
          items: state.items.map(item =>
            item.itemId === itemId
              ? { ...item, priceConfig: parsedPriceConfig }
              : item
          )
        }));
      },

      /**
       * Vacía completamente el carrito
       */
      clearCart: () => {
        set({ items: [] });
      },

      /**
       * Toggle del estado del drawer (abre/cierra)
       */
      toggleCart: () => {
        set(state => ({ isOpen: !state.isOpen }));
      },

      /**
       * Abre el drawer del carrito
       */
      openCart: () => {
        set({ isOpen: true });
      },

      /**
       * Cierra el drawer del carrito
       */
      closeCart: () => {
        set({ isOpen: false });
      },

      /**
       * Selector: Calcula totales del carrito usando priceUtils
       *
       * @returns {Object} - { subtotal, itemsCount }
       */
      getCartTotal: () => {
        const items = get().items;

        // Transformar items del store al formato esperado por calculateCartTotal
        const itemsForCalculation = items.map(item => ({
          priceConfig: item.priceConfig,
          quantity: item.quantity,
          selectedReason: item.selectedReason
        }));

        return calculateCartTotal(itemsForCalculation);
      }
    }),
    {
      name: 'veta-cart-storage', // Nombre de la key en localStorage
      version: 1, // Versión del schema (útil para migraciones)

      // Opciones de persistencia
      partialize: (state) => ({
        // Solo persistir items, NO el estado isOpen
        items: state.items
      }),

      // Merge strategy: mantener acciones, solo hidratar state
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState,
        isOpen: false // Siempre iniciar cerrado al cargar
      })
    }
  )
);

/**
 * HOOK DE CONVENIENCIA: useCart
 *
 * Exporta un hook más ergonómico que incluye los totales calculados
 * automáticamente. Úsalo en los componentes en lugar de useCartStore directo.
 *
 * @returns {Object} - Todo el state + { total: { subtotal, itemsCount } }
 *
 * @example
 * const { items, addItem, total } = useCart();
 * console.log(total.subtotal); // => 125.50
 * console.log(total.itemsCount); // => 7
 */
export function useCart() {
  const store = useCartStore();

  return {
    ...store,
    // Propiedad computada que siempre está actualizada
    total: store.getCartTotal()
  };
}

/**
 * SELECTOR: Obtener solo el conteo de items (para badge)
 *
 * Optimización: evita re-renders innecesarios en componentes que solo
 * necesitan el número total de items.
 *
 * @example
 * const itemCount = useCartItemCount();
 * // => 7
 */
export function useCartItemCount() {
  return useCartStore(state =>
    state.items.reduce((acc, item) => acc + item.quantity, 0)
  );
}

/**
 * SELECTOR: Verificar si el carrito está vacío
 *
 * @example
 * const isEmpty = useCartIsEmpty();
 * if (isEmpty) return <EmptyCartMessage />;
 */
export function useCartIsEmpty() {
  return useCartStore(state => state.items.length === 0);
}

// Export por defecto del store
export default useCartStore;
