// api/webhook-mp.js
const { MercadoPagoConfig, Payment } = require('mercadopago');
const { google } = require('googleapis');

const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

function getCalendar() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return google.calendar({ version: 'v3', auth });
}

// Parsea fecha en español a objeto Date
// fecha ej: "sábado, 7 de junio" + hora ej: "10:00"
function parseDateTime(fecha, hora) {
  const meses = { enero:0,febrero:1,marzo:2,abril:3,mayo:4,junio:5,julio:6,agosto:7,septiembre:8,octubre:9,noviembre:10,diciembre:11 };
  const match = fecha.match(/(\d+)\s+de\s+(\w+)/i);
  if (!match) return null;
  const day = parseInt(match[1]);
  const month = meses[match[2].toLowerCase()];
  const year = new Date().getFullYear();
  const [h, m] = hora.split(':').map(Number);
  const start = new Date(year, month, day, h, m);
  const end = new Date(year, month, day, h + 1, m); // 1 hora de duración
  return { start, end };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  res.status(200).end(); // Responder rápido a MP

  try {
    const { type, data } = req.body;
    if (type !== 'payment') return;

    const payment = new Payment(mp);
    const info = await payment.get({ id: data.id });
    if (info.status !== 'approved') return;

    let turno = {};
    try { turno = JSON.parse(info.external_reference); } catch {}

    const { nombre, email, telefono, especialidad, motivo, fecha, hora } = turno;

    // ── Crear evento en Google Calendar ──
    const dt = parseDateTime(fecha, hora);
    if (dt) {
      const calendar = getCalendar();
      await calendar.events.insert({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        sendUpdates: 'all', // manda invitación al paciente también
        requestBody: {
          summary: `🦷 ${nombre} — ${especialidad}`,
          description: `Paciente: ${nombre}\nTeléfono: ${telefono}\nEmail: ${email}\nEspecialidad: ${especialidad}\nMotivo: ${motivo || 'No especificado'}\n\n💳 Seña cobrada: $3.000`,
          location: 'Somellera 5739, Mataderos, CABA',
          start: { dateTime: dt.start.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' },
          end: { dateTime: dt.end.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' },
          attendees: [
            { email: process.env.GOOGLE_CALENDAR_ID, displayName: 'Dra. Oliva Mariana' },
            { email: email, displayName: nombre },
          ],
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 24 * 60 }, // 24hs antes
              { method: 'popup', minutes: 60 },       // 1hs antes
            ],
          },
          colorId: '3', // violeta en Google Calendar
        },
      });
    }

    // ── WhatsApp a la Dra. (CallMeBot) ──
    if (process.env.CALLMEBOT_APIKEY) {
      const msg = encodeURIComponent(
        `🦷 NUEVO TURNO CONFIRMADO\n\n` +
        `👤 ${nombre}\n📅 ${fecha} ${hora}hs\n` +
        `🔬 ${especialidad}\n💬 ${motivo || '-'}\n` +
        `📞 ${telefono}\n📧 ${email}\n\n💳 Seña cobrada: $3.000 ✅`
      );
      await fetch(`https://api.callmebot.com/whatsapp.php?phone=5492214119307&text=${msg}&apikey=${process.env.CALLMEBOT_APIKEY}`);
    }

  } catch (err) {
    console.error('Webhook error:', err);
  }
};
