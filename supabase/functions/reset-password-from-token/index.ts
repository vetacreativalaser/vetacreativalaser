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
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword || newPassword.length < 6) {
      return new Response(JSON.stringify({ error: 'Datos inválidos' }), { status: 400 });
    }

    const { data: tokenData, error } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !tokenData) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 400 });
    }

    if (tokenData.used) {
      return new Response(JSON.stringify({ error: 'Token ya usado' }), { status: 400 });
    }

    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    if (now > expiresAt) {
      return new Response(JSON.stringify({ error: 'Token expirado' }), { status: 400 });
    }

    // Buscar al usuario por email
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users.find((u) => u.email === tokenData.email);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), { status: 404 });
    }

    const result = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword
    });

    if (result.error) {
      return new Response(JSON.stringify({ error: 'No se pudo actualizar la contraseña' }), { status: 500 });
    }

    await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('token', token);

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });

  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'Error inesperado' }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });
  }
});
