// api/turnos-ocupados.js
// Devuelve los horarios ya ocupados en Google Calendar para una fecha dada
const { google } = require('googleapis');

function getCalendar() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return google.calendar({ version: 'v3', auth });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { fecha } = req.query; // ej: "2025-06-07"
  if (!fecha) return res.status(400).json({ error: 'Falta la fecha' });

  try {
    const calendar = getCalendar();
    const start = new Date(`${fecha}T00:00:00-03:00`);
    const end   = new Date(`${fecha}T23:59:59-03:00`);

    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const ocupados = (response.data.items || []).map(event => {
      const s = new Date(event.start.dateTime || event.start.date);
      return `${String(s.getHours()).padStart(2,'0')}:${String(s.getMinutes()).padStart(2,'0')}`;
    });

    return res.status(200).json({ ocupados });
  } catch (err) {
    console.error('Error calendar:', err);
    return res.status(500).json({ ocupados: [] });
  }
};
