// Run inside the backend service: node scripts/check-email.cjs
// Read-only: authenticates against Brevo without sending email or printing keys.
require('dotenv').config();

async function checkEmail(env = process.env, request = fetch) {
  const key = env.BREVO_API_KEY?.trim();
  if (!key) throw new Error('Falta BREVO_API_KEY en este servicio.');
  console.log('Proveedor:', env.EMAIL_PROVIDER || '(automático)');
  console.log('Remitente:', env.EMAIL_FROM || '(sin configurar)');
  console.log('Últimos 4 caracteres de la clave:', key.slice(-4));
  const response = await request('https://api.brevo.com/v3/account', {
    headers: { accept: 'application/json', 'api-key': key },
    signal: AbortSignal.timeout(15000),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`Brevo HTTP ${response.status}: ${body.code || 'error'} — ${body.message || 'Acceso rechazado'}`);
  }
  console.log('Autenticación correcta. Cuenta de Brevo:', body.email || '(no informada)');
  console.log('La clave es aceptada. Este chequeo no verifica la entrega ni envía correos.');
}

if (require.main === module) {
  checkEmail().catch(error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { checkEmail };
