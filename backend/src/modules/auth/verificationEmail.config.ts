/** Validate delivery settings before attempting registration email delivery. */
export function getVerificationEmailConfig(env: NodeJS.ProcessEnv = process.env) {
  const emailFrom = env.EMAIL_FROM?.trim();
  if (!emailFrom) {
    throw new Error('EMAIL_FROM es requerido para enviar correos de verificación');
  }

  const smtpHost = (env.SMTP_HOST || '').trim().toLowerCase();
  const apiKey = env.BREVO_API_KEY?.trim();
  const provider = (env.EMAIL_PROVIDER?.trim().toLowerCase() ||
    (apiKey ? 'brevo' : 'smtp'));
  const isBrevo = provider === 'brevo' ||
    (provider === 'smtp' && (smtpHost.includes('brevo.com') || smtpHost.includes('sendinblue')));

  if (isBrevo && !apiKey) {
    throw new Error('BREVO_API_KEY es requerida para enviar verificaciones con Brevo por HTTPS');
  }

  return { emailFrom, provider, isBrevo, apiKey };
}
