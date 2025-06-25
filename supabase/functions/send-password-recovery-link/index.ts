import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';
import { Resend } from 'https://esm.sh/resend';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!
);

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

  const { email } = await req.json();
  if (!email) {
    return new Response(JSON.stringify({ error: 'Falta email' }), { status: 400 });
  }

  // Generar el enlace de reseteo desde Supabase
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'http://vetacreativalaser.es/reset-password'
  });

  if (error) {
    console.error('Error al generar enlace de recuperación:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }

  // Enviar email con Resend
  try {
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
            <a href="https://vetacreativalaser.es/reset-password" style="display:inline-block; margin: 20px 0; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
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
    console.error('Error enviando correo con Resend:', err);
    return new Response(JSON.stringify({ error: 'Error enviando correo' }), {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
});
