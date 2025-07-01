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
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // Necesario para usar auth.admin
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
    if (!email) {
      return new Response(JSON.stringify({ error: 'Falta email' }), {
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 1. Generar el enlace de recuperación
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: 'https://vetacreativalaser.es/reset-password'
      }
    });

    if (error || !data?.action_link) {
      console.error('Error generando el enlace:', error?.message);
      return new Response(JSON.stringify({ error: 'No se pudo generar el enlace' }), {
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 2. Extraer el token del enlace generado
    const token = new URL(data.action_link).searchParams.get('token');
    if (!token) {
      return new Response(JSON.stringify({ error: 'Token no encontrado en el enlace' }), {
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 3. Guardar el token en la tabla personalizada
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutos

    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert([
        {
          token,
          email,
          used: false,
          expires_at: expiresAt.toISOString()
        }
      ]);

    if (insertError) {
      console.error('Error guardando el token:', insertError.message);
      return new Response(JSON.stringify({ error: 'No se pudo guardar el token' }), {
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 4. Enviar email personalizado con el enlace real
    await resend.emails.send({
      from: 'Veta Creativa <points@vetacreativalaser.es>',
      to: email,
      subject: '🔐 Recupera tu contraseña de Veta Creativa',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 5px 15px rgba(0,0,0,0.05);">
            <h2 style="color: #10b981;">Recuperación de contraseña</h2>
            <p style="font-size: 16px; color: #333;">
              Has solicitado restablecer tu contraseña. Haz clic en el botón de abajo para continuar.
            </p>
            <a href="${data.action_link}" style="display:inline-block; margin: 20px 0; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Restablecer contraseña
            </a>
            <p style="font-size: 14px; color: #777;">
              Si no solicitaste este cambio, puedes ignorar este mensaje.
            </p>
            <hr style="margin: 30px 0;" />
            <p style="font-size: 12px; color: #aaa; text-align: center;">
              No respondas a este correo. Para cualquier duda, escríbenos a 
              <a href="mailto:vetacreativalaser@gmail.com" style="color: #10b981;">vetacreativalaser@gmail.com</a>.
            </p>
          </div>
        </div>
      `
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });

  } catch (err) {
    console.error('Error inesperado:', err);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });
  }
});
