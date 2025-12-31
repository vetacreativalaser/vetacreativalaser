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
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      console.error('🔴 Token inválido:', tokenError);
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (tokenData.used) {
      return new Response(JSON.stringify({ error: 'Token ya usado' }), {
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    if (now > expiresAt) {
      return new Response(JSON.stringify({ error: 'Token expirado' }), {
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    const { data: usersData, error: userError } = await supabase.auth.admin.listUsers();
    if (userError || !usersData || !Array.isArray(usersData.users)) {
      console.error('🔴 Error buscando usuarios:', userError);
      return new Response(JSON.stringify({ error: 'Error al buscar usuarios' }), {
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    const user = usersData.users.find((u) => u.email === tokenData.email);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), {
        status: 404,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword
    });

    if (updateError) {
      console.error('🔴 Error actualizando contraseña:', updateError);
      return new Response(JSON.stringify({ error: 'No se pudo actualizar la contraseña' }), {
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    const { error: markUsedError } = await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('token', token);

    if (markUsedError) {
      console.error('🔴 Error marcando token como usado:', markUsedError);
      return new Response(JSON.stringify({ error: 'No se pudo marcar el token como usado' }), {
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });

  } catch (err) {
    console.error('❌ Error inesperado:', err);
    return new Response(JSON.stringify({ error: 'Error inesperado' }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });
  }
});
