// @ts-ignore
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// @ts-ignore

import { Resend } from 'https://esm.sh/resend';

// @ts-ignore
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*', // O usa tu dominio en producción
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Manejo de preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers,
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers,
    });
  }

  try {
    const { name, email, phone, subject, message } = await req.json();

    const data = await resend.emails.send({
      from: 'Contacto Veta <contacto@vetacreativalaser.es>',
      to: ['vetacreativalaser@gmail.com'],
      subject: subject || 'Nuevo mensaje de contacto Veta Creativa',
      reply_to: email,
      html: `
        <div style="font-family: sans-serif; line-height: 1.5;">
          <h2>Nuevo mensaje de contacto</h2>
          <p><strong>Nombre:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Teléfono:</strong> ${phone || 'No proporcionado'}</p>
          <p><strong>Asunto:</strong> ${subject}</p>
          <p><strong>Mensaje:</strong><br/>${message}</p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers,
    });
  }
});
