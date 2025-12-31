/**
 * PRICE UTILITIES - Veta Creativa Láser
 *
 * Funciones puras para cálculo de precios complejos basados en el modelo JSONB.
 *
 * Modelos soportados:
 * - Fixed: Precio fijo
 * - byQuantity: Precio escalonado por cantidad (tiers)
 * - byReason: Precio según motivo/razón seleccionada
 */

/**
 * Normaliza configuraciones de precio antiguas al formato nuevo
 *
 * Transforma:
 * - byQuantity: tier.quantity -> tier.min/max
 * - byReason: reason/increment -> label/price
 *
 * @param {Object} priceConfig - Configuración de precio desde DB
 * @returns {Object} - Configuración normalizada
 */
export function normalizePriceConfig(priceConfig) {
  if (!priceConfig || !priceConfig.type) {
    return priceConfig;
  }

  // Crear una copia para no mutar el original
  const normalized = { ...priceConfig };

  // NORMALIZAR byQuantity
  if (normalized.type === 'byQuantity' && normalized.tiers) {
    normalized.tiers = normalized.tiers.map((tier, index, allTiers) => {
      // Si ya tiene min/max, no normalizar
      if (tier.min !== undefined) {
        return tier;
      }

      // Caso antiguo: tier.quantity existe
      if (tier.quantity !== undefined) {
        const quantityStr = String(tier.quantity).trim();

        // Extraer el número base (ej: "1", "+60" -> 60)
        const minValue = parseInt(quantityStr.replace('+', ''));

        // Calcular max basándose en el siguiente tier
        let maxValue = null;
        if (index < allTiers.length - 1) {
          const nextTier = allTiers[index + 1];
          const nextQuantityStr = String(nextTier.quantity).trim();
          const nextMin = parseInt(nextQuantityStr.replace('+', ''));
          maxValue = nextMin - 1;
        }

        return {
          min: minValue,
          max: maxValue,
          price: parseFloat(tier.price)
        };
      }

      return tier;
    });
  }

  // NORMALIZAR byReason
  if (normalized.type === 'byReason' && normalized.reasons) {
    const basePrice = parseFloat(normalized.base) || 0;

    normalized.reasons = normalized.reasons.map(reason => {
      // Si ya tiene label/price, no normalizar
      if (reason.label !== undefined && reason.price !== undefined) {
        return reason;
      }

      // Caso antiguo: reason/increment existe
      if (reason.reason !== undefined && reason.increment !== undefined) {
        return {
          label: reason.reason,
          price: basePrice + parseFloat(reason.increment)
        };
      }

      return reason;
    });

    // Guardar el base price para referencia
    normalized.basePrice = basePrice;
  }

  return normalized;
}

/**
 * Calcula el precio unitario basado en el tipo de pricing del producto
 *
 * @param {Object} priceConfig - Configuración de precio desde products.price (JSONB)
 * @param {number} quantity - Cantidad a calcular
 * @param {string|null} selectedReason - Motivo seleccionado (solo para byReason)
 * @returns {number} - Precio unitario calculado
 *
 * @example
 * // Precio fijo
 * calculateUnitPrice({ type: 'fixed', value: 25.50 }, 1)
 * // => 25.50
 *
 * @example
 * // Precio por cantidad
 * calculateUnitPrice({
 *   type: 'byQuantity',
 *   tiers: [
 *     { min: 1, max: 10, price: 20 },
 *     { min: 11, max: 50, price: 18 },
 *     { min: 51, max: null, price: 15 }
 *   ]
 * }, 25)
 * // => 18
 *
 * @example
 * // Precio por motivo
 * calculateUnitPrice({
 *   type: 'byReason',
 *   reasons: [
 *     { label: 'Boda', price: 30 },
 *     { label: 'Cumpleaños', price: 25 }
 *   ]
 * }, 5, 'Boda')
 * // => 30
 */
export function calculateUnitPrice(priceConfig, quantity, selectedReason = null) {
  // Validación de entrada
  if (!priceConfig || !priceConfig.type) {
    throw new Error('Invalid price configuration: missing type');
  }

  if (quantity < 1) {
    throw new Error('Quantity must be at least 1');
  }

  // NORMALIZAR configuración antes de calcular
  const normalized = normalizePriceConfig(priceConfig);

  switch (normalized.type) {
    case 'fixed':
      return parseFloat(normalized.value) || 0;

    case 'byQuantity':
      return calculateTieredPrice(normalized.tiers, quantity);

    case 'byReason':
      return calculateReasonPrice(normalized.reasons, selectedReason);

    default:
      throw new Error(`Unknown price type: ${normalized.type}`);
  }
}

/**
 * Calcula el precio basado en tiers de cantidad
 *
 * @param {Array} tiers - Array de objetos { min, max, price }
 * @param {number} quantity - Cantidad a calcular
 * @returns {number} - Precio unitario del tier aplicable
 */
function calculateTieredPrice(tiers, quantity) {
  if (!Array.isArray(tiers) || tiers.length === 0) {
    throw new Error('Invalid tiers configuration');
  }

  // Ordenar tiers por min ascendente
  const sortedTiers = [...tiers].sort((a, b) => a.min - b.min);

  // Buscar el tier aplicable
  const applicableTier = sortedTiers.find(tier => {
    const minMatches = quantity >= tier.min;
    const maxMatches = tier.max === null || quantity <= tier.max;
    return minMatches && maxMatches;
  });

  if (!applicableTier) {
    // FALLBACK: Si no hay tier exacto, buscar el más cercano
    // Si la cantidad es menor que el primer tier, usar el primer tier
    if (quantity < sortedTiers[0].min) {
      return parseFloat(sortedTiers[0].price) || 0;
    }

    // Si la cantidad es mayor que todos los tiers, usar el último tier
    const lastTier = sortedTiers[sortedTiers.length - 1];
    return parseFloat(lastTier.price) || 0;
  }

  return parseFloat(applicableTier.price) || 0;
}

/**
 * Calcula el precio basado en el motivo seleccionado
 *
 * @param {Array} reasons - Array de objetos { label, price }
 * @param {string} selectedReason - Motivo seleccionado por el usuario
 * @returns {number} - Precio del motivo seleccionado
 */
function calculateReasonPrice(reasons, selectedReason) {
  if (!Array.isArray(reasons) || reasons.length === 0) {
    throw new Error('Invalid reasons configuration');
  }

  if (!selectedReason) {
    throw new Error('A reason must be selected for byReason pricing');
  }

  const reasonConfig = reasons.find(r => r.label === selectedReason);

  if (!reasonConfig) {
    throw new Error(`Invalid reason selected: ${selectedReason}`);
  }

  return parseFloat(reasonConfig.price) || 0;
}

/**
 * Calcula el precio total de un item (unitario * cantidad)
 *
 * @param {Object} priceConfig - Configuración de precio
 * @param {number} quantity - Cantidad
 * @param {string|null} selectedReason - Motivo (opcional)
 * @returns {number} - Precio total
 */
export function calculateItemTotal(priceConfig, quantity, selectedReason = null) {
  const unitPrice = calculateUnitPrice(priceConfig, quantity, selectedReason);
  return unitPrice * quantity;
}

/**
 * Calcula el total del carrito sumando todos los items
 *
 * @param {Array} cartItems - Array de items del carrito
 * @returns {Object} - { subtotal, itemsCount }
 *
 * @example
 * calculateCartTotal([
 *   { priceConfig: {...}, quantity: 2, selectedReason: null },
 *   { priceConfig: {...}, quantity: 5, selectedReason: 'Boda' }
 * ])
 * // => { subtotal: 275.50, itemsCount: 7 }
 */
export function calculateCartTotal(cartItems) {
  if (!Array.isArray(cartItems)) {
    return { subtotal: 0, itemsCount: 0 };
  }

  const subtotal = cartItems.reduce((acc, item) => {
    try {
      const itemTotal = calculateItemTotal(
        item.priceConfig,
        item.quantity,
        item.selectedReason
      );
      return acc + itemTotal;
    } catch (error) {
      console.error('Error calculating item price:', error);
      return acc; // Skip items with errors
    }
  }, 0);

  const itemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    itemsCount
  };
}

/**
 * Formatea un precio para mostrar en UI
 *
 * @param {number} amount - Cantidad a formatear
 * @param {string} currency - Código de moneda (default: 'EUR')
 * @param {string} locale - Locale para formateo (default: 'es-ES')
 * @returns {string} - Precio formateado
 *
 * @example
 * formatPrice(25.50)
 * // => "25,50 €"
 */
export function formatPrice(amount, currency = 'EUR', locale = 'es-ES') {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  } catch (error) {
    console.error('Error formatting price:', error);
    return `${amount.toFixed(2)} ${currency}`;
  }
}

/**
 * Obtiene información sobre el tier aplicable para mostrar al usuario
 *
 * @param {Object} priceConfig - Configuración de precio
 * @param {number} quantity - Cantidad actual
 * @returns {Object|null} - Info del tier: { currentPrice, nextTier }
 *
 * @example
 * getTierInfo({ type: 'byQuantity', tiers: [...] }, 8)
 * // => {
 * //   currentPrice: 20,
 * //   nextTier: { min: 11, price: 18, unitsNeeded: 3 }
 * // }
 */
export function getTierInfo(priceConfig, quantity) {
  if (priceConfig.type !== 'byQuantity') {
    return null;
  }

  // NORMALIZAR configuración antes de calcular
  const normalized = normalizePriceConfig(priceConfig);
  const tiers = normalized.tiers;
  const currentPrice = calculateTieredPrice(tiers, quantity);

  // Buscar el siguiente tier disponible
  const currentTierIndex = tiers.findIndex(tier => {
    const minMatches = quantity >= tier.min;
    const maxMatches = tier.max === null || quantity <= tier.max;
    return minMatches && maxMatches;
  });

  const nextTier = tiers[currentTierIndex + 1];

  if (nextTier) {
    return {
      currentPrice,
      nextTier: {
        min: nextTier.min,
        price: nextTier.price,
        unitsNeeded: nextTier.min - quantity
      }
    };
  }

  return {
    currentPrice,
    nextTier: null
  };
}

/**
 * Valida que una configuración de precio es válida
 *
 * @param {Object} priceConfig - Configuración a validar
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export function validatePriceConfig(priceConfig) {
  const errors = [];

  if (!priceConfig || typeof priceConfig !== 'object') {
    return { valid: false, errors: ['Price config must be an object'] };
  }

  if (!priceConfig.type) {
    errors.push('Missing price type');
  }

  switch (priceConfig.type) {
    case 'fixed':
      if (typeof priceConfig.value !== 'number' || priceConfig.value < 0) {
        errors.push('Fixed price must be a positive number');
      }
      break;

    case 'byQuantity':
      if (!Array.isArray(priceConfig.tiers) || priceConfig.tiers.length === 0) {
        errors.push('byQuantity requires non-empty tiers array');
      } else {
        priceConfig.tiers.forEach((tier, index) => {
          if (typeof tier.min !== 'number' || tier.min < 1) {
            errors.push(`Tier ${index}: min must be >= 1`);
          }
          if (tier.max !== null && typeof tier.max !== 'number') {
            errors.push(`Tier ${index}: max must be number or null`);
          }
          if (typeof tier.price !== 'number' || tier.price < 0) {
            errors.push(`Tier ${index}: price must be positive`);
          }
        });
      }
      break;

    case 'byReason':
      if (!Array.isArray(priceConfig.reasons) || priceConfig.reasons.length === 0) {
        errors.push('byReason requires non-empty reasons array');
      } else {
        priceConfig.reasons.forEach((reason, index) => {
          if (!reason.label || typeof reason.label !== 'string') {
            errors.push(`Reason ${index}: label is required`);
          }
          if (typeof reason.price !== 'number' || reason.price < 0) {
            errors.push(`Reason ${index}: price must be positive`);
          }
        });
      }
      break;

    default:
      errors.push(`Unknown price type: ${priceConfig.type}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
