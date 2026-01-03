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
  Deno.env.get('SERVICE_ROLE_KEY')! // clave de servicio para usar auth.admin
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

    // Verificar que el usuario existe
    const { data: usersData, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
      console.error('Error listando usuarios:', userError);
      return new Response(JSON.stringify({ error: 'Error verificando usuario' }), {
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    const user = usersData.users.find((u) => u.email === email);
    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      return new Response(JSON.stringify({ success: true }), {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      });
    }

    // Generar token de recuperación con redirect URL
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `https://vetacreativalaser.es/reset-password`
      }
    });

    if (error || !data?.properties?.hashed_token) {
      console.error('Error generando token:', error?.message);
      return new Response(JSON.stringify({ error: 'No se pudo generar el enlace' }), {
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Usar el hashed_token para verificación OTP
    const hashedToken = data.properties.hashed_token;
    const resetUrl = `https://vetacreativalaser.es/reset-password?token=${hashedToken}&type=recovery`;

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
            <a href="${resetUrl}" style="display:inline-block; margin: 20px 0; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Restablecer contraseña
            </a>
            <p style="font-size: 14px; color: #777;">
              Si no solicitaste este cambio, puedes ignorar este mensaje. Este enlace expirará en 1 hora.
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
