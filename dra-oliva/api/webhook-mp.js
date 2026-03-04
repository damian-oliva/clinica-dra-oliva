// api/webhook-mp.js
// Recibe notificaciones de Mercado Pago cuando un pago es aprobado
// Envía mensaje de WhatsApp al número de la Dra. Oliva

const { MercadoPagoConfig, Payment } = require('mercadopago');

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // MP siempre espera un 200 rápido
  res.status(200).end();

  try {
    const { type, data } = req.body;

    if (type !== 'payment') return;

    const payment = new Payment(client);
    const info = await payment.get({ id: data.id });

    if (info.status !== 'approved') return;

    // Extraer datos del turno guardados en external_reference
    let turno = {};
    try { turno = JSON.parse(info.external_reference); } catch {}

    const { nombre, email, telefono, consultorio, especialidad, motivo, fecha, hora } = turno;

    // ── Enviar WhatsApp a la Dra. Oliva vía CallMeBot (gratuito) ──
    // Alternativa: Twilio, Meta Business API
    // Para activar CallMeBot: mandar "I allow callmebot to send me messages" al +34 644 36 51 79
    // y reemplazar CALLMEBOT_APIKEY con la clave recibida
    const mensajeDra = encodeURIComponent(
      `🦷 *NUEVO TURNO CONFIRMADO*\n\n` +
      `👤 Paciente: *${nombre}*\n` +
      `📅 Fecha: *${fecha} a las ${hora}hs*\n` +
      `📍 Consultorio: *${consultorio}*\n` +
      `🔬 Especialidad: *${especialidad}*\n` +
      `💬 Motivo: ${motivo || 'No especificado'}\n` +
      `📧 Email: ${email}\n` +
      `📞 Tel: ${telefono}\n\n` +
      `💳 *SEÑA COBRADA: $3.000* ✅`
    );

    // CallMeBot — número de la Dra. Oliva (Argentina: 549 + número sin 0)
    const dra_numero = '5492214119307'; // 221 411-9307
    const callmebot_key = process.env.CALLMEBOT_APIKEY || '';

    if (callmebot_key) {
      await fetch(
        `https://api.callmebot.com/whatsapp.php?phone=${dra_numero}&text=${mensajeDra}&apikey=${callmebot_key}`
      );
    }

    // ── Enviar email de confirmación al paciente ──
    // Usar Resend (gratuito 3000 emails/mes) — reemplazá RESEND_API_KEY
    if (process.env.RESEND_API_KEY && email) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Dra. Oliva Mariana <turnos@draoliva.com.ar>',
          to: [email],
          subject: `✅ Tu turno está confirmado — ${fecha} ${hora}hs`,
          html: `
            <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:2rem;">
              <h2 style="color:#7c3aed">🦷 Turno confirmado</h2>
              <p>Hola <strong>${nombre}</strong>,</p>
              <p>Tu turno quedó confirmado. Acá están los detalles:</p>
              <div style="background:#f5f3ff;border-radius:12px;padding:1.2rem;margin:1rem 0;">
                <p>📅 <strong>${fecha} a las ${hora}hs</strong></p>
                <p>📍 <strong>${consultorio}</strong></p>
                <p>🔬 <strong>${especialidad}</strong></p>
                <p>💳 Seña abonada: <strong>$3.000</strong></p>
              </div>
              <p><strong>Recordá enviar el comprobante de pago por WhatsApp al:</strong></p>
              <p style="font-size:1.2rem;color:#7c3aed"><strong>+54 9 221 411-9307</strong></p>
              <p style="color:#6b7280;font-size:0.9rem;margin-top:1.5rem;">Si necesitás reprogramar, contactanos con al menos 24hs de anticipación.</p>
              <p style="color:#6b7280;font-size:0.9rem;">— Dra. Oliva Mariana · Clínica Dental</p>
            </div>
          `,
        }),
      });
    }

  } catch (err) {
    console.error('Webhook error:', err);
  }
};
