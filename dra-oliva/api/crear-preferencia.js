// api/crear-preferencia.js
// Serverless function para Vercel — crea la preferencia de pago en Mercado Pago

const { MercadoPagoConfig, Preference } = require('mercadopago');

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { nombre, email, telefono, consultorio, especialidad, motivo, fecha, hora } = req.body;

  if (!nombre || !email || !consultorio || !fecha || !hora) {
    return res.status(400).json({ error: 'Faltan datos del turno' });
  }

  const descripcion = `Turno: ${especialidad || 'Consulta'} — ${fecha} ${hora}hs — ${consultorio}`;

  try {
    const preference = new Preference(client);

    const body = {
      items: [
        {
          id: 'sena-turno-001',
          title: `Seña turno — Dra. Oliva Mariana`,
          description: descripcion,
          quantity: 1,
          currency_id: 'ARS',
          unit_price: 3000,
        },
      ],
      payer: {
        name: nombre,
        email: email,
        phone: { number: telefono },
      },
      back_urls: {
        success: `${process.env.SITE_URL}/confirmado.html`,
        failure: `${process.env.SITE_URL}/?pago=fallido`,
        pending: `${process.env.SITE_URL}/?pago=pendiente`,
      },
      auto_return: 'approved',
      external_reference: JSON.stringify({ nombre, email, telefono, consultorio, especialidad, motivo, fecha, hora }),
      statement_descriptor: 'DRA OLIVA DENTAL',
      notification_url: `${process.env.SITE_URL}/api/webhook-mp`,
    };

    const result = await preference.create({ body });

    return res.status(200).json({ init_point: result.init_point });

  } catch (error) {
    console.error('Error MP:', error);
    return res.status(500).json({ error: 'Error al crear preferencia', detalle: error.message });
  }
};
