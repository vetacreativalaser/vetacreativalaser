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
    const { token } = await req.json();

    if (!token || typeof token !== 'string') {
      return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 400 });
    }

    const { data, error } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: 'Token no encontrado' }), { status: 400 });
    }

    if (data.used) {
      return new Response(JSON.stringify({ error: 'Este enlace ya fue usado' }), { status: 400 });
    }

    const now = new Date();
    const expiresAt = new Date(data.expires_at);
    if (now > expiresAt) {
      return new Response(JSON.stringify({ error: 'El enlace ha caducado' }), { status: 400 });
    }

    return new Response(JSON.stringify({ valid: true, email: data.email }), {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });
  }
});