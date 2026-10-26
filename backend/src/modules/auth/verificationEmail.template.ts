const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!));

export function verificationEmail(name: string, verifyUrl: string, frontendUrl: string) {
  const subject = 'Confirma tu correo · Arca Evangélica Dios Fuerte';
  const safeName = escapeHtml(name);
  const link = escapeHtml(verifyUrl);
  const logo = escapeHtml(`${frontendUrl.replace(/\/$/, '')}/arca-logo.png`);
  const text = `Hola ${name},\n\nBienvenido a nuestra comunidad de Arca Evangélica Dios Fuerte. Confirma tu correo para activar tu cuenta y participar en la vida de nuestra iglesia.\n\n${verifyUrl}\n\nEl enlace estará disponible durante 72 horas. Si no solicitaste esta cuenta, puedes ignorar este mensaje.\n\nArca Evangélica · Dios Fuerte\nFe, comunidad y propósito.`;
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;background:#f4f3ef;color:#1d2d50;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">Un paso más para formar parte de nuestra comunidad. Confirma tu correo.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 12px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border:1px solid #e5e2d9;border-radius:20px;">
  <tr><td align="center" style="padding:32px 24px;border-bottom:3px solid #c99a32;"><img src="${logo}" width="220" alt="Arca Evangélica · Dios Fuerte" style="display:block;width:220px;max-width:100%;height:auto;"></td></tr>
  <tr><td style="padding:36px 28px;"><p style="font-size:11px;letter-spacing:2px;color:#917126;font-weight:bold;">FE · COMUNIDAD · PROPÓSITO</p><h1 style="font-family:Georgia,serif;font-size:30px;line-height:1.2;font-weight:normal;margin:16px 0 24px;">Bienvenido a nuestra comunidad</h1>
  <p style="font-size:16px;line-height:1.7;">Hola, <strong>${safeName}</strong>.</p><p style="color:#60697a;font-size:15px;line-height:1.8;">Nos alegra que seas parte de Arca Evangélica Dios Fuerte. Confirma tu correo para activar tu cuenta y conectar con la vida de nuestra iglesia.</p>
  <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0;"><tr><td bgcolor="#1d2d50" style="border-radius:10px;"><a href="${link}" style="display:inline-block;padding:17px 26px;color:#fff;text-decoration:none;font-size:15px;font-weight:bold;">Confirmar mi correo</a></td></tr></table>
  <p style="font-size:13px;color:#60697a;line-height:1.7;background:#f8f6ef;padding:16px;border-radius:10px;">Tu enlace estará disponible durante <strong>72 horas</strong>. Si no solicitaste esta cuenta, puedes ignorar este mensaje.</p>
  <p style="font-size:12px;color:#748094;line-height:1.7;margin-top:26px;">Si el botón no abre, copia este enlace en tu navegador:<br><a href="${link}" style="color:#1d2d50;word-break:break-all;overflow-wrap:anywhere;">${link}</a></p></td></tr>
  <tr><td align="center" style="padding:24px;border-top:1px solid #eeeae0;font-size:12px;color:#748094;line-height:1.8;"><strong style="color:#1d2d50;">Arca Evangélica · Dios Fuerte</strong><br>Unidos para servir.<br>Este mensaje se envió automáticamente para confirmar tu registro.</td></tr></table></td></tr></table></body></html>`;
  return { subject, html, text };
}
