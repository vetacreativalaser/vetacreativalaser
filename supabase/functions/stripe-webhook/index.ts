/**
 * EDGE FUNCTION: stripe-webhook
 *
 * Procesa webhooks de Stripe para:
 * - Guardar pedidos cuando se completa el pago (checkout.session.completed)
 * - Actualizar estado de pedidos según eventos de Stripe
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  console.log('🔔 Webhook invocado - Método:', req.method);

  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    console.error('❌ No signature header found');
    return new Response('No signature', { status: 400 });
  }

  try {
    const body = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

    console.log('🔑 Webhook secret exists:', !!webhookSecret);
    console.log('📦 Body length:', body.length);

    // Verificar firma del webhook (async en Deno)
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    console.log('✅ Webhook verificado - Tipo:', event.type);

    // Manejar el evento checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log('Checkout completado:', session.id);

      // Obtener detalles completos de la sesión
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items', 'payment_intent'],
      });

      // Extraer información del cliente
      const customerEmail = fullSession.customer_details?.email || '';
      const customerName = fullSession.customer_details?.name || '';

      // Extraer direcciones
      const shippingAddress = fullSession.shipping_details?.address || null;
      const billingAddress = fullSession.customer_details?.address || null;

      // Extraer metadata del payment intent
      const paymentIntent = fullSession.payment_intent as Stripe.PaymentIntent;
      const metadata = paymentIntent?.metadata || {};

      const itemsJson = metadata.items || '[]';
      const items = JSON.parse(itemsJson);
      const totalWeight = parseFloat(metadata.totalWeight || '0');
      const shippingCost = parseFloat(metadata.shippingCost || '0');
      const userId = metadata.userId || null; // ID del usuario autenticado

      // Calcular totales
      const total = (fullSession.amount_total || 0) / 100; // Convertir de céntimos a euros
      const subtotal = total - shippingCost;

      // Crear cliente de Supabase con service role key para bypass RLS
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Generar número de pedido
      const { data: orderNumberData, error: orderNumberError } = await supabase
        .rpc('generate_order_number');

      if (orderNumberError) {
        console.error('Error generando número de pedido:', orderNumberError);
        throw new Error('No se pudo generar número de pedido');
      }

      const orderNumber = orderNumberData as string;

      // Insertar pedido en la base de datos
      const { data: order, error: insertError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          stripe_session_id: fullSession.id,
          stripe_payment_intent_id: paymentIntent?.id || null,
          user_id: userId, // Vincular con usuario autenticado
          customer_email: customerEmail,
          customer_name: customerName,
          shipping_address: shippingAddress,
          billing_address: billingAddress,
          items: items,
          subtotal: subtotal,
          shipping_cost: shippingCost,
          total: total,
          total_weight: totalWeight,
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error insertando pedido:', insertError);
        throw insertError;
      }

      console.log('✅ Pedido creado:', orderNumber, order);

      // Enviar email de confirmación al cliente
      try {
        const emailData = {
          orderNumber: orderNumber,
          customerEmail: customerEmail,
          userId: userId,
          customerName: customerName || 'Cliente',
          items: items,
          subtotal: subtotal,
          shippingCost: shippingCost,
          total: total,
          shippingAddress: shippingAddress,
        };

        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-order-confirmation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify(emailData),
        });

        if (emailResponse.ok) {
          console.log('✅ Email de confirmación enviado');
        } else {
          console.error('⚠️ Error enviando email:', await emailResponse.text());
        }
      } catch (emailError) {
        console.error('⚠️ Error enviando email:', emailError);
        // No fallar el webhook si falla el email
      }

      return new Response(
        JSON.stringify({
          success: true,
          orderNumber: orderNumber,
          orderId: order.id,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Otros eventos de Stripe (puedes expandir aquí)
    console.log('Evento no manejado:', event.type);

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (err) {
    console.error('Error en webhook:', err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Unknown error',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
