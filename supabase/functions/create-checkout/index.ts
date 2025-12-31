/**
 * EDGE FUNCTION: create-checkout
 *
 * Crea una sesión de Stripe Checkout con lógica avanzada:
 * - Cálculo de precios dinámicos (fixed, byQuantity, byReason)
 * - Detección y suma de extras de personalización
 * - Cálculo de gastos de envío por peso volumétrico
 * - Metadatos completos para el webhook
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// Tipos TypeScript
interface CartItem {
  productId: number;
  productName: string;
  quantity: number;
  priceConfig: any; // JSONB de la DB
  customization: Record<string, any>;
  selectedReason: string | null;
}

interface Product {
  id: number;
  name: string;
  price: any; // JSONB
  weight?: number; // Peso en kg
  stripe_enabled: boolean;
  image_urls?: string[];
}

interface PriceCalculation {
  basePrice: number;
  extrasTotal: number;
  finalUnitPrice: number;
}

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Normaliza configuraciones de precio antiguas al formato nuevo
 */
function normalizePriceConfig(priceConfig: any): any {
  if (!priceConfig || !priceConfig.type) {
    return priceConfig;
  }

  const normalized = { ...priceConfig };

  // NORMALIZAR byQuantity
  if (normalized.type === 'byQuantity' && normalized.tiers) {
    normalized.tiers = normalized.tiers.map((tier: any, index: number, allTiers: any[]) => {
      if (tier.min !== undefined) {
        return tier;
      }

      if (tier.quantity !== undefined) {
        const quantityStr = String(tier.quantity).trim();
        const minValue = parseInt(quantityStr.replace('+', ''));

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
          price: parseFloat(tier.price),
        };
      }

      return tier;
    });
  }

  // NORMALIZAR byReason
  if (normalized.type === 'byReason' && normalized.reasons) {
    const basePrice = parseFloat(normalized.base) || 0;

    normalized.reasons = normalized.reasons.map((reason: any) => {
      if (reason.label !== undefined && reason.price !== undefined) {
        return reason;
      }

      if (reason.reason !== undefined && reason.increment !== undefined) {
        return {
          label: reason.reason,
          price: basePrice + parseFloat(reason.increment),
        };
      }

      return reason;
    });

    normalized.basePrice = basePrice;
  }

  return normalized;
}

/**
 * Calcula el precio unitario base según el tipo de pricing
 */
function calculateBaseUnitPrice(
  priceConfig: any,
  quantity: number,
  selectedReason: string | null
): number {
  const normalized = normalizePriceConfig(priceConfig);

  switch (normalized.type) {
    case 'fixed':
      return parseFloat(normalized.value) || 0;

    case 'byQuantity': {
      const tiers = normalized.tiers || [];
      const sortedTiers = [...tiers].sort((a, b) => a.min - b.min);

      const applicableTier = sortedTiers.find((tier: any) => {
        const minMatches = quantity >= tier.min;
        const maxMatches = tier.max === null || quantity <= tier.max;
        return minMatches && maxMatches;
      });

      if (applicableTier) {
        return parseFloat(applicableTier.price) || 0;
      }

      // Fallback: usar el último tier
      const lastTier = sortedTiers[sortedTiers.length - 1];
      return parseFloat(lastTier?.price) || 0;
    }

    case 'byReason': {
      if (!selectedReason) {
        return parseFloat(normalized.base) || 0;
      }

      const reasons = normalized.reasons || [];
      const reasonConfig = reasons.find((r: any) => r.label === selectedReason);

      if (reasonConfig) {
        return parseFloat(reasonConfig.price) || 0;
      }

      return parseFloat(normalized.base) || 0;
    }

    default:
      throw new Error(`Unknown price type: ${normalized.type}`);
  }
}

/**
 * Detecta y calcula extras de personalización
 * Analiza el objeto customization buscando patrones como "(+2€)" en los valores
 */
function calculateCustomizationExtras(customization: Record<string, any>): number {
  let extrasTotal = 0;

  for (const [key, value] of Object.entries(customization)) {
    if (typeof value === 'string') {
      // Buscar patrones como "(+2€)", "(+2.5€)", "(+2)", etc.
      const extraMatch = value.match(/\(\+(\d+(?:\.\d+)?)\s*€?\)/);
      if (extraMatch) {
        const extraAmount = parseFloat(extraMatch[1]);
        extrasTotal += extraAmount;
      }
    }
  }

  return extrasTotal;
}

/**
 * Calcula el precio completo de un item (base + extras)
 */
function calculateItemPrice(
  priceConfig: any,
  quantity: number,
  selectedReason: string | null,
  customization: Record<string, any>
): PriceCalculation {
  const basePrice = calculateBaseUnitPrice(priceConfig, quantity, selectedReason);
  const extrasTotal = calculateCustomizationExtras(customization);
  const finalUnitPrice = basePrice + extrasTotal;

  return {
    basePrice,
    extrasTotal,
    finalUnitPrice,
  };
}

/**
 * Calcula el coste de envío basado en el peso total
 *
 * Lógica simplificada por ahora:
 * - Menos de 2kg: 5€
 * - Más de 2kg: 8€
 *
 * TODO: Expandir con zonas (Península, Baleares, Canarias)
 */
function calculateShippingCost(totalWeight: number): number {
  if (totalWeight < 2) {
    return 500; // 5€ en céntimos
  } else {
    return 800; // 8€ en céntimos
  }
}

/**
 * Genera un resumen de personalización para metadatos
 */
function generateCustomizationSummary(customization: Record<string, any>): string {
  if (Object.keys(customization).length === 0) {
    return 'Sin personalización';
  }

  const entries = Object.entries(customization)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');

  return entries;
}

serve(async (req) => {
  // Manejar OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Inicializar clientes
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2024-11-20.acacia',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // 2. Parsear body
    const { cartItems } = await req.json() as { cartItems: CartItem[] };

    if (!cartItems || cartItems.length === 0) {
      throw new Error('El carrito está vacío');
    }

    // 3. Obtener datos de productos desde DB
    const productIds = cartItems.map((item) => item.productId);
    const { data: products, error: dbError } = await supabaseClient
      .from('products')
      .select('id, name, price, weight, stripe_enabled, image_urls')
      .in('id', productIds);

    if (dbError) {
      throw new Error(`Error al obtener productos: ${dbError.message}`);
    }

    if (!products || products.length === 0) {
      throw new Error('No se encontraron productos válidos');
    }

    // 4. Crear un mapa de productos para acceso rápido
    const productsMap = new Map<number, Product>(
      products.map((p) => [p.id, p as Product])
    );

    // 5. Calcular line_items y peso total
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let totalWeight = 0;
    const itemsMetadata: any[] = [];

    for (const cartItem of cartItems) {
      const product = productsMap.get(cartItem.productId);

      if (!product) {
        throw new Error(`Producto ${cartItem.productId} no encontrado`);
      }

      if (!product.stripe_enabled) {
        throw new Error(`Producto "${product.name}" no está disponible para compra online`);
      }

      // Calcular precio con extras
      const priceCalc = calculateItemPrice(
        product.price,
        cartItem.quantity,
        cartItem.selectedReason,
        cartItem.customization
      );

      // Convertir a céntimos para Stripe
      const unitAmountCents = Math.round(priceCalc.finalUnitPrice * 100);

      // Acumular peso
      const itemWeight = (product.weight || 0) * cartItem.quantity;
      totalWeight += itemWeight;

      // Crear descripción del item con personalización
      const customizationSummary = generateCustomizationSummary(cartItem.customization);
      let description = customizationSummary;

      if (cartItem.selectedReason) {
        description = `Motivo: ${cartItem.selectedReason}. ${description}`;
      }

      // Añadir line_item
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: product.name,
            description: description,
            images: product.image_urls ? [product.image_urls[0]] : undefined,
          },
          unit_amount: unitAmountCents,
        },
        quantity: cartItem.quantity,
      });

      // Guardar metadata del item para el webhook
      itemsMetadata.push({
        productId: product.id,
        productName: product.name,
        quantity: cartItem.quantity,
        unitPrice: priceCalc.finalUnitPrice,
        customization: cartItem.customization,
        selectedReason: cartItem.selectedReason,
        basePrice: priceCalc.basePrice,
        extras: priceCalc.extrasTotal,
      });
    }

    // 6. Calcular y añadir gastos de envío
    const shippingCostCents = calculateShippingCost(totalWeight);

    lineItems.push({
      price_data: {
        currency: 'eur',
        product_data: {
          name: 'Gastos de envío',
          description: `Envío calculado según peso total: ${totalWeight.toFixed(2)} kg`,
        },
        unit_amount: shippingCostCents,
      },
      quantity: 1,
    });

    // 7. Obtener origin desde headers
    const origin = req.headers.get('origin') || 'http://localhost:5173';

    // 8. Crear sesión de Stripe
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['ES'],
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      payment_intent_data: {
        metadata: {
          cartItemsCount: cartItems.length.toString(),
          totalWeight: totalWeight.toFixed(2),
          shippingCost: (shippingCostCents / 100).toFixed(2),
          // Guardar items en JSON para el webhook
          items: JSON.stringify(itemsMetadata),
        },
      },
      metadata: {
        source: 'veta-creativa-laser',
      },
    });

    // 9. Devolver sessionId al frontend
    return new Response(
      JSON.stringify({ sessionId: session.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error en create-checkout:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Error desconocido',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
