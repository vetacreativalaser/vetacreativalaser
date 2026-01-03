// @ts-ignore
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const supabase = createClient(
  // @ts-ignore
  Deno.env.get('SUPABASE_URL')!,
  // @ts-ignore
  Deno.env.get('SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword || newPassword.length < 6) {
      return new Response(JSON.stringify({ error: 'Datos inválidos' }), {
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
      });
    }

    // Verificar el token usando verifyOtp para obtener el usuario
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'recovery'
    });

    if (verifyError || !verifyData?.user) {
      console.error('Error verificando token:', verifyError);
      return new Response(JSON.stringify({ error: 'Token inválido o expirado' }), {
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
      });
    }

    // Actualizar la contraseña del usuario
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      verifyData.user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error actualizando contraseña:', updateError);
      return new Response(JSON.stringify({ error: 'No se pudo actualizar la contraseña' }), {
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
      });
    }

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
