/**
 * EDGE FUNCTION: sync-stripe-product
 *
 * Sincroniza productos entre Supabase y Stripe
 *
 * POST: Crear o actualizar producto y precio en Stripe
 * DELETE: Archivar producto en Stripe (soft delete)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
};

// Tipos TypeScript
interface ProductRecord {
  id?: number;
  name: string;
  full_description?: string;
  price: {
    type: 'fixed' | 'byQuantity' | 'byReason';
    value?: number;
    base?: number;
    [key: string]: any;
  };
  images?: Array<{ url: string; alt?: string }>;
  stripe_product_id?: string;
  stripe_price_id?: string;
  sku?: string;
  slug?: string;
  purchase_mode?: 'standard' | 'contact_only' | 'buy_and_clarify';
}

interface PostRequestBody {
  record: ProductRecord;
}

interface DeleteRequestBody {
  stripe_product_id: string;
}

/**
 * Extrae el precio base del objeto price según su tipo
 */
function extractBasePrice(priceConfig: ProductRecord['price']): number {
  switch (priceConfig.type) {
    case 'fixed':
      return parseFloat(String(priceConfig.value || 0));

    case 'byQuantity': {
      // Usar el precio del primer tier como base
      const tiers = priceConfig.tiers || [];
      if (tiers.length > 0 && tiers[0].price) {
        return parseFloat(String(tiers[0].price));
      }
      return 0;
    }

    case 'byReason':
      return parseFloat(String(priceConfig.base || 0));

    default:
      return 0;
  }
}

/**
 * POST: Crear o actualizar producto y precio en Stripe
 */
async function handleSync(stripe: Stripe, body: PostRequestBody): Promise<Response> {
  const { record } = body;

  if (!record || !record.name) {
    throw new Error('El campo "record.name" es obligatorio');
  }

  // LÓGICA DE NEGOCIO: Verificar si el producto permite compra online
  const isOnlinePurchasingEnabled = record.purchase_mode === 'standard';

  // CASO 1: Compra online DESHABILITADA + Producto YA SINCRONIZADO → Archivar en Stripe
  if (!isOnlinePurchasingEnabled && record.stripe_product_id) {
    console.log('⚠️ Online purchasing disabled. Archiving Stripe product:', record.stripe_product_id);

    await stripe.products.update(record.stripe_product_id, {
      active: false,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Producto archivado en Stripe (compra online deshabilitada)',
        stripe_product_id: record.stripe_product_id,
        archived: true,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }

  // CASO 2: Compra online DESHABILITADA + NO sincronizado → Skip
  if (!isOnlinePurchasingEnabled && !record.stripe_product_id) {
    console.log('ℹ️ Skipping Stripe sync: Online purchasing disabled');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sincronización omitida (compra online deshabilitada)',
        skipped: true,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }

  // CASO 3: Compra online HABILITADA → Continuar con sincronización normal
  console.log('✅ Online purchasing enabled. Proceeding with Stripe sync');

  // VALIDACIÓN: Solo precios fijos pueden sincronizarse con Stripe
  if (record.price.type !== 'fixed') {
    console.warn('⚠️ Skipping Stripe sync: Product has variable pricing (byQuantity/byReason)');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sincronización omitida: Los productos con precio variable no se sincronizan con Stripe',
        skipped: true,
        reason: 'variable_pricing',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }

  const basePrice = extractBasePrice(record.price);
  const priceInCents = Math.round(basePrice * 100);

  if (priceInCents <= 0) {
    throw new Error('El precio debe ser mayor que 0');
  }

  let stripeProductId = record.stripe_product_id;
  let stripePriceId = record.stripe_price_id;

  // CASO ESPECIAL: Si existe producto archivado, reactivarlo
  let wasReactivated = false;
  if (stripeProductId) {
    try {
      const existingProduct = await stripe.products.retrieve(stripeProductId);

      console.log('📦 Estado actual del producto en Stripe:', {
        id: existingProduct.id,
        name: existingProduct.name,
        active: existingProduct.active,
        default_price: existingProduct.default_price,
      });

      if (!existingProduct.active) {
        console.log('🔄 Reactivating archived Stripe product:', stripeProductId);
        await stripe.products.update(stripeProductId, {
          active: true,
        });
        wasReactivated = true;
      } else {
        console.log('✅ Producto ya está activo en Stripe');
      }
    } catch (error) {
      console.error('Error checking/reactivating product:', error);
      // Si no existe, lo creamos más adelante
      stripeProductId = null;
    }
  }

  // CASO 1: Crear producto nuevo en Stripe
  if (!stripeProductId) {
    console.log('Creating new Stripe product:', record.name);

    const stripeProduct = await stripe.products.create({
      name: record.name,
      description: record.full_description || undefined,
      images: record.images?.[0]?.url ? [record.images[0].url] : undefined,
      metadata: {
        source: 'veta-creativa-laser-admin',
        supabase_id: String(record.id || ''),
        sku: record.sku || '',
        slug: record.slug || '',
      },
    });

    stripeProductId = stripeProduct.id;

    // Crear precio inicial
    const stripePrice = await stripe.prices.create({
      product: stripeProductId,
      unit_amount: priceInCents,
      currency: 'eur',
      metadata: {
        price_type: record.price.type,
      },
    });

    stripePriceId = stripePrice.id;

    console.log('✅ Product created:', stripeProductId, 'Price:', stripePriceId);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Producto creado en Stripe',
        stripe_product_id: stripeProductId,
        stripe_price_id: stripePriceId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }

  // CASO 2: Actualizar producto existente en Stripe
  console.log('Updating Stripe product:', stripeProductId);

  // Actualizar datos del producto
  await stripe.products.update(stripeProductId, {
    name: record.name,
    description: record.full_description || undefined,
    images: record.images?.[0]?.url ? [record.images[0].url] : undefined,
    metadata: {
      source: 'veta-creativa-laser-admin',
      supabase_id: String(record.id || ''),
      sku: record.sku || '',
      slug: record.slug || '',
    },
  });

  // Verificar si el precio ha cambiado
  let needsNewPrice = false;

  if (stripePriceId) {
    try {
      const currentPrice = await stripe.prices.retrieve(stripePriceId);

      // Comparar precios
      if (currentPrice.unit_amount !== priceInCents) {
        needsNewPrice = true;
        console.log('Price changed from', currentPrice.unit_amount, 'to', priceInCents);
      }
    } catch (error) {
      console.error('Error retrieving current price:', error);
      needsNewPrice = true;
    }
  } else {
    needsNewPrice = true;
  }

  // Crear nuevo precio si es necesario
  if (needsNewPrice) {
    console.log('Creating new price:', priceInCents, 'cents');

    // Desactivar precio anterior (Stripe no permite editar precios existentes)
    if (stripePriceId) {
      try {
        await stripe.prices.update(stripePriceId, { active: false });
        console.log('✅ Old price deactivated:', stripePriceId);
      } catch (error) {
        console.error('Warning: Could not deactivate old price:', error);
      }
    }

    // Crear nuevo precio
    const newPrice = await stripe.prices.create({
      product: stripeProductId,
      unit_amount: priceInCents,
      currency: 'eur',
      metadata: {
        price_type: record.price.type,
      },
    });

    stripePriceId = newPrice.id;

    // Actualizar el default_price del producto
    await stripe.products.update(stripeProductId, {
      default_price: stripePriceId,
    });

    console.log('✅ New price created and set as default:', stripePriceId);
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: wasReactivated ? 'Producto reactivado en Stripe' : 'Producto actualizado en Stripe',
      stripe_product_id: stripeProductId,
      stripe_price_id: stripePriceId,
      price_updated: needsNewPrice,
      reactivated: wasReactivated,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}

/**
 * DELETE: Archivar producto en Stripe (soft delete)
 */
async function handleArchive(stripe: Stripe, body: DeleteRequestBody): Promise<Response> {
  const { stripe_product_id } = body;

  if (!stripe_product_id) {
    throw new Error('El campo "stripe_product_id" es obligatorio');
  }

  console.log('Archiving Stripe product:', stripe_product_id);

  // Archivar producto (soft delete)
  await stripe.products.update(stripe_product_id, {
    active: false,
  });

  console.log('✅ Product archived:', stripe_product_id);

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Producto archivado en Stripe',
      stripe_product_id,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}

/**
 * Main handler
 */
serve(async (req) => {
  // Manejar OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Inicializar Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY no está configurada en las variables de entorno');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Parsear body
    const body = await req.json();

    // Enrutar según método HTTP
    switch (req.method) {
      case 'POST':
        return await handleSync(stripe, body as PostRequestBody);

      case 'DELETE':
        return await handleArchive(stripe, body as DeleteRequestBody);

      default:
        throw new Error(`Método HTTP no soportado: ${req.method}`);
    }

  } catch (error) {
    console.error('❌ Error en sync-stripe-product:', error);

    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
