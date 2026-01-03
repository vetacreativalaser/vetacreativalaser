/**
 * EDGE FUNCTION: send-order-confirmation
 *
 * Envía email de confirmación de pedido usando Resend
 * Llamado automáticamente desde el webhook de Stripe
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderEmailData {
  orderNumber: string;
  userId: string; // ← AGREGADO: ID del usuario de Supabase
  customerEmail?: string; // ← Ahora es opcional
  customerName: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    postal_code: string;
    state: string;
    country: string;
  };
}

function generateOrderEmailHTML(data: OrderEmailData): string {
  const formatPrice = (amount: number) => `${amount.toFixed(2)} €`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Confirmación de Pedido</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header img {
      max-width: 200px;
      height: auto;
      margin-bottom: 15px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .order-number {
      background: rgba(255,255,255,0.2);
      padding: 10px 20px;
      border-radius: 20px;
      display: inline-block;
      margin-top: 10px;
      font-family: monospace;
      font-size: 18px;
    }
    .content {
      background: white;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
    }
    .section {
      margin: 30px 0;
    }
    .section-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 15px;
      color: #111;
    }
    .item {
      padding: 15px;
      background: #f9fafb;
      border-radius: 6px;
      margin-bottom: 10px;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 5px;
    }
    .item-name {
      font-weight: 500;
      color: #111;
    }
    .item-price {
      font-weight: 600;
      color: #3b82f6;
    }
    .item-quantity {
      font-size: 14px;
      color: #6b7280;
    }
    .address-box {
      background: #f9fafb;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #3b82f6;
    }
    .totals {
      background: #f9fafb;
      padding: 20px;
      border-radius: 6px;
      margin-top: 20px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }
    .total-row.final {
      border-top: 2px solid #e5e7eb;
      margin-top: 10px;
      padding-top: 15px;
      font-size: 18px;
      font-weight: 700;
      color: #3b82f6;
    }
    .footer {
      background: #f9fafb;
      padding: 30px;
      text-align: center;
      border-radius: 0 0 8px 8px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .footer p {
      margin: 5px 0;
      font-size: 14px;
      color: #6b7280;
    }
    .cta-button {
      display: inline-block;
      background: #3b82f6;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 600;
    }
    .cta-button:hover {
      background: #2563eb;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>¡Pedido Confirmado!</h1>
    <div class="order-number">${data.orderNumber}</div>
  </div>

  <div class="content">
    <p class="greeting">Hola ${data.customerName},</p>
    <p>¡Gracias por tu pedido! Hemos recibido tu compra y comenzaremos a preparar tus productos personalizados.</p>

    <div class="section">
      <div class="section-title">📦 Detalles del Pedido</div>
      ${data.items.map(item => `
        <div class="item">
          <div class="item-header">
            <div>
              <div class="item-name">${item.productName}</div>
              <div class="item-quantity">Cantidad: ${item.quantity}</div>
            </div>
            <div class="item-price">${formatPrice(item.unitPrice * item.quantity)}</div>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="section">
      <div class="section-title">📍 Dirección de Envío</div>
      <div class="address-box">
        ${data.shippingAddress.line1}<br>
        ${data.shippingAddress.line2 ? data.shippingAddress.line2 + '<br>' : ''}
        ${data.shippingAddress.postal_code} ${data.shippingAddress.city}<br>
        ${data.shippingAddress.state}, ${data.shippingAddress.country}
      </div>
    </div>

    <div class="totals">
      <div class="total-row">
        <span>Subtotal:</span>
        <span>${formatPrice(data.subtotal)}</span>
      </div>
      <div class="total-row">
        <span>Envío:</span>
        <span>${formatPrice(data.shippingCost)}</span>
      </div>
      <div class="total-row final">
        <span>TOTAL:</span>
        <span>${formatPrice(data.total)}</span>
      </div>
    </div>

    <div style="text-align: center;">
      <a href="https://vetacreativalaser.es/perfil" class="cta-button">Ver Estado del Pedido</a>
    </div>

    <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
      Te enviaremos un email cuando tu pedido esté en camino con el número de seguimiento.
    </p>
  </div>

  <div class="footer">
    <p><strong>Veta Creativa Láser</strong></p>
    <p>Personalización con láser de alta calidad</p>
    <p style="margin-top: 15px;">
      ¿Necesitas ayuda? Contáctanos en <a href="mailto:vetacreativalaser@gmail.com" style="color: #3b82f6;">vetacreativalaser@gmail.com</a>
    </p>
  </div>
</body>
</html>
  `;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const emailData: OrderEmailData = await req.json();

    // ← NUEVO: Crear cliente de Supabase con Service Role Key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ← NUEVO: Obtener el email del usuario desde auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
      emailData.userId
    );

    if (userError || !userData.user) {
      console.error('❌ Error obteniendo usuario:', userError);
      throw new Error(`No se pudo obtener el usuario: ${userError?.message}`);
    }

    const userEmail = userData.user.email;

    if (!userEmail) {
      throw new Error('El usuario no tiene email asociado');
    }

    console.log('📧 Enviando email de confirmación a:', userEmail);

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Veta Creativa Láser <compras@vetacreativalaser.es>',
        to: [userEmail], // ← CAMBIADO: Ahora usa el email de Supabase
        subject: `✅ Pedido Confirmado - ${emailData.orderNumber}`,
        html: generateOrderEmailHTML(emailData),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Error de Resend:', error);
      throw new Error(`Resend API error: ${error}`);
    }

    const result = await response.json();
    console.log('✅ Email enviado:', result);

    return new Response(
      JSON.stringify({ success: true, emailId: result.id, sentTo: userEmail }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
