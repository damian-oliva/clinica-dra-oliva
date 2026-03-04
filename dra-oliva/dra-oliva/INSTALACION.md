# 🦷 Guía de instalación — Clínica Dra. Oliva Mariana

## ¿Qué incluye este proyecto?

- **Sitio web completo** con información, especialidades, turnos y obras sociales
- **Backend en Vercel** (serverless, gratuito)
- **Checkout Pro de Mercado Pago** — los pacientes pagan la seña de $3.000
- **Notificación automática por WhatsApp** a la Dra. Oliva cuando se paga un turno
- **Email de confirmación** al paciente con los datos del turno
- **Página de éxito** con botón directo para enviar el comprobante por WhatsApp

---

## PASO 1 — Crear cuenta en Vercel (gratis)

1. Ir a **https://vercel.com** y registrarse (se puede con Google o GitHub)
2. Instalar Vercel CLI en tu computadora:
   ```
   npm install -g vercel
   ```
3. En la terminal, ir a la carpeta del proyecto:
   ```
   cd ruta/a/clinica-dra-oliva
   ```

---

## PASO 2 — Obtener las credenciales de Mercado Pago

1. Ir a **https://www.mercadopago.com.ar/developers/panel**
2. Iniciar sesión con la cuenta de la Dra. Oliva
3. Crear una nueva aplicación (ej: "Clínica Dental Turnos")
4. Ir a **Credenciales de Producción**
5. Copiar el **Access Token** (empieza con `APP_USR-`)

> ⚠️ Usar las credenciales de PRODUCCIÓN (no las de prueba/sandbox)

---

## PASO 3 — Activar CallMeBot para WhatsApp (gratis)

CallMeBot permite enviar mensajes de WhatsApp automáticos al número de la Dra.

1. Desde el teléfono de la Dra. Oliva, agregar el contacto:
   - Nombre: CallMeBot
   - Número: **+34 644 36 51 79**
2. Mandarle este mensaje exacto por WhatsApp:
   ```
   I allow callmebot to send me messages
   ```
3. En unos minutos llega la respuesta con tu **API Key**
4. Guardar ese número (ej: `123456`)

---

## PASO 4 — Crear cuenta en Resend (email, gratis)

1. Ir a **https://resend.com** y registrarse
2. En el dashboard, crear una API Key
3. Copiarla (empieza con `re_`)

> Nota: Para usar un email personalizado como `turnos@draoliva.com.ar` hay que verificar el dominio en Resend. Si no tenés dominio, se puede usar el email genérico de Resend por ahora.

---

## PASO 5 — Deployar en Vercel

En la terminal, dentro de la carpeta del proyecto:

```bash
vercel deploy --prod
```

Seguir las instrucciones en pantalla. Al final te da una URL como:
```
https://clinica-dra-oliva.vercel.app
```

---

## PASO 6 — Configurar las variables de entorno en Vercel

1. Ir a **https://vercel.com/dashboard**
2. Seleccionar el proyecto `clinica-dra-oliva`
3. Ir a **Settings → Environment Variables**
4. Agregar una por una:

| Variable | Valor |
|---|---|
| `MP_ACCESS_TOKEN` | El token de MP (ej: `APP_USR-1234...`) |
| `SITE_URL` | La URL de Vercel (ej: `https://clinica-dra-oliva.vercel.app`) |
| `CALLMEBOT_APIKEY` | La API key recibida por WhatsApp |
| `RESEND_API_KEY` | La API key de Resend |

5. Una vez cargadas, hacer un nuevo deploy:
   ```bash
   vercel deploy --prod
   ```

---

## PASO 7 — Activar el Webhook en Mercado Pago

Para que MP avise cuando se paga:

1. Ir a **https://www.mercadopago.com.ar/developers/panel**
2. Seleccionar tu aplicación
3. Ir a **Webhooks**
4. Agregar la URL:
   ```
   https://TU-PROYECTO.vercel.app/api/webhook-mp
   ```
5. Seleccionar el evento: **Pagos (payment)**
6. Guardar

---

## ✅ ¡Listo! Flujo completo

1. El paciente completa el formulario y hace clic en "Pagar con Mercado Pago"
2. Es redirigido a Mercado Pago y paga $3.000
3. MP confirma el pago → llama al webhook
4. La Dra. Oliva recibe un WhatsApp con todos los datos del turno ✅
5. El paciente recibe un email de confirmación ✅
6. El paciente es redirigido a la página de éxito con botón para enviar comprobante por WhatsApp ✅

---

## 🆘 ¿Necesitás ayuda?

Ante cualquier duda, contactar a quien desarrolló el sitio o revisar:
- Docs Mercado Pago: https://www.mercadopago.com.ar/developers/es/docs
- Docs Vercel: https://vercel.com/docs
- Docs CallMeBot: https://www.callmebot.com/blog/free-api-whatsapp-messages/
- Docs Resend: https://resend.com/docs
