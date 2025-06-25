import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { Resend } from 'https://esm.sh/resend';

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

  const { email, name, points, changeType, level } = await req.json();

  let subject = '';
  let html = '';
    const footerNote = `
    <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
        No respondas a este correo. Para cualquier duda, escríbenos a 
        <a href="mailto:vetacreativalaser@gmail.com" style="color: #10b981; text-decoration: none;">vetacreativalaser@gmail.com</a>.
    </p>
    `;
  if (changeType === 'levelup') {
    subject = `🎉 ¡Has subido al nivel ${level}!`;
    html = `
      <div style="font-family: Arial, sans-serif; background-color: #f0fdf4; padding: 30px;">
        <div style="max-width: 600px; margin: auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
          <h2 style="color: #059669;">¡Felicidades ${name || email}!</h2>
          <p style="font-size: 16px; color: #444;">
            Has alcanzado el <strong>nivel ${level}</strong> en Veta Creativa Láser. 🎉
          </p>
          <div style="margin: 20px 0; padding: 20px; background: #ecfdf5; border-left: 4px solid #10b981; border-radius: 8px;">
            <p style="margin: 0; font-size: 16px;">
              El equipo de Veta se pondrá en contacto contigo para darte tu premio especial por este logro.
            </p>
          </div>
          <p style="font-size: 14px; color: #888; margin-top: 40px;">Sigue participando para alcanzar nuevos niveles y desbloquear más recompensas exclusivas.</p>
          <p style="font-size: 12px; color: #bbb;">Veta Creativa &copy; ${new Date().getFullYear()}</p>
        </div>
      </div>
            ${footerNote}

    `;
  } else {
    const isGain = changeType === 'gain';
    subject = isGain
      ? '🎉 ¡Gracias por tu reseña, has ganado 5 puntos!'
      : '⚠️ Has eliminado una reseña y has perdido puntos';

    html = `
      <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 30px;">
        <div style="max-width: 600px; margin: auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
          <h2 style="color: #10b981;">¡${isGain ? 'Enhorabuena' : 'Actualización de puntos'} ${name || email}!</h2>
          <p style="font-size: 16px; color: #444;">
            ${isGain 
              ? 'Has ganado <strong>5 puntos</strong> por tu participación en Veta Creativa.' 
              : 'Has perdido <strong>5 puntos</strong>. Tu nuevo total es <strong>' + points + '</strong> puntos.'}
          </p>

          <div style="margin: 20px 0; padding: 20px; background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 8px;">
            <p style="margin: 0; font-size: 16px;">
              <strong>Puntos actuales:</strong> ${points}<br/>
              <strong>Puntos para próximo premio:</strong> ${100 - (points % 100)}
            </p>
          </div>

          ${points >= 100 && points % 100 < 5 ? `
            <div style="padding: 20px; background: #ecfdf5; border-left: 4px solid #059669; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #059669;">🎁 ¡Has superado los 100 puntos!</h3>
              <p>Has subido de nivel. Pronto el administrador se pondrá en contacto contigo para entregarte un premio especial.</p>
            </div>
          ` : ''}

          <p style="font-size: 14px; color: #888; margin-top: 40px;">Sigue participando para acumular más puntos y desbloquear recompensas exclusivas.</p>
          <p style="font-size: 12px; color: #bbb;">Veta Creativa &copy; ${new Date().getFullYear()}</p>
        </div>
      </div>
            ${footerNote}

    `;
  }

  try {
    await resend.emails.send({
      from: 'Veta Creativa Puntos <points@vetacreativalaser.es>',
      to: email,
      subject,
      html
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error al enviar correo:', error);
    return new Response(JSON.stringify({ success: false, error }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });
  }
});
