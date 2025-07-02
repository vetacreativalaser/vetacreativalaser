// @ts-ignore
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js';
// @ts-ignore
import { Resend } from 'https://esm.sh/resend';

const supabase = createClient(
  // @ts-ignore
  Deno.env.get('SUPABASE_URL')!,
  // @ts-ignore
  Deno.env.get('SERVICE_ROLE_KEY')! // Necesario para usar auth.admin
);
  // @ts-ignore

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    });
  }

try {
  const { email } = await req.json();
  console.log('🟡 Recibido email:', email);

  if (!email) {
    console.log('❌ Falta email');
    return new Response(JSON.stringify({ error: 'Falta email' }), { status: 400 });
  }

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo: 'https://vetacreativalaser.es/reset-password'
    }
  });

  const actionLink = data?.properties?.action_link;

  if (error || !actionLink) {
    console.error('❌ Error al generar enlace:', error);
    console.error('📦 Data recibida:', data);
    return new Response(JSON.stringify({ error: 'No se pudo generar el enlace' }), { status: 500 });
  }

  console.log('✅ Enlace generado:', actionLink);

  const token = new URL(actionLink).searchParams.get('token');
  if (!token) {
    console.error('❌ Token no encontrado en actionLink');
    return new Response(JSON.stringify({ error: 'Token no encontrado en el enlace' }), { status: 500 });
  }

  console.log('🧪 Token extraído:', token);

  const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutos
  console.log('📅 Expira en:', expiresAt.toISOString());

  const { error: insertError } = await supabase
    .from('password_reset_tokens')
    .insert([{ token, email, used: false, expires_at: expiresAt.toISOString() }]);

  if (insertError) {
    console.error('❌ Error insertando token:', insertError.message);
    return new Response(JSON.stringify({ error: 'No se pudo guardar el token' }), { status: 500 });
  }

  console.log('✅ Token guardado correctamente');

  await resend.emails.send({
    from: 'Veta Creativa <points@vetacreativalaser.es>',
    to: email,
    subject: '🔐 Recupera tu contraseña de Veta Creativa',
    html: `<a href="${actionLink}">Restablecer contraseña</a>`
  });

  console.log('📨 Correo enviado');

  return new Response(JSON.stringify({ success: true }), {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    }
  });
} catch (err) {
  console.error('🔥 Error inesperado:', err);
  return new Response(JSON.stringify({ error: 'Error interno' }), {
    status: 500,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    }
  });
}

});
