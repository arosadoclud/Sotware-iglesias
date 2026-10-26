import { getProgramLogoDataUri } from '../../config/brand';
const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character]!));

// Preserve the established correspondence layout; content is always escaped.
function paragraph(line: string, emphasis: string[] = []): string {
  if (!line.trim()) return '<div class="paragraph-gap"></div>';
  const recipient = line.match(/^(Iglesia|Pastor\/a\/es|Pastor\/a|Pastor|Pastora|Dirigido a|Señor\/a):\s*(.*)$/i);
  return recipient
    ? `<p class="recipient">${escape(recipient[1])}: <strong>${escape(recipient[2])}</strong></p>`
    : `<p>${emphasize(line, emphasis)}</p>`;
}
function emphasize(line: string, values: string[]): string {
  const tokens = values.filter(value => typeof value === 'string' && value.trim()).sort((a,b) => b.length - a.length);
  if (!tokens.length) return escape(line);
  const pattern = new RegExp('(' + tokens.map(value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi');
  return line.split(pattern).map(part => tokens.some(value => value.toLowerCase() === part.toLowerCase()) ? '<strong>' + escape(part) + '</strong>' : escape(part)).join('');
}
export function renderLetterDocument({content, title, churchData = {}, eventData = {}, date = new Date()}: {content: string; title?: string; churchData?: Record<string,string>; date?: Date; eventData?: Record<string,string>}) {
  const churchName = churchData.nombre || 'Iglesia Evangélica Dios Fuerte';
  const emphasis = [churchName, eventData.fecha, eventData.tema, eventData.hora].filter(Boolean);
  const lines = content.split(/\n_{5,}/)[0].trim().split('\n');
  const embeddedDate = /^\d{1,2} de [a-záéíóúñ]+ de \d{4}$/i.test(lines[0]?.trim() || '') ? lines.shift()!.trim() : '';
  while (lines.length && !lines[0].trim()) lines.shift();
  const finalLine = lines.pop() || '';
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${escape(title || 'Carta de la iglesia')}</title><style>
  @page{size:A4;margin:20mm 25mm}*{box-sizing:border-box}body{font:13pt/1.75 'Times New Roman',Times,serif;color:#111;margin:0;overflow-wrap:anywhere}
  header{position:relative;min-height:135px;padding:12px 0 0 110px;margin-bottom:0;text-align:center;break-inside:avoid}
  header img{position:absolute;left:0;top:10px;width:95px;height:auto}header h1{font:bold 14pt/1.3 'Times New Roman',Times,serif;margin:0 0 12px}header p{font:bold 12pt/1.4 'Times New Roman',Times,serif;margin:6px 0}
  .document-date{text-align:right;font:italic 11pt/1.5 'Times New Roman',Times,serif;margin:18px 0 28px}main p{margin:0 0 8px;text-align:justify;orphans:3;widows:3}.recipient{text-align:left;margin-bottom:8px}.recipient u{text-underline-offset:2px}.paragraph-gap{height:14px}.closing{break-inside:avoid}.signature{margin:48px 0 0;text-align:center;break-inside:avoid;font:bold 12pt/1.5 'Times New Roman',Times,serif}.signature-line{width:250px;max-width:80%;border-top:1px solid #111;margin:0 auto 7px}.signature p{margin:10px 0;color:#b48c22}.signature img{display:block;width:86px;height:auto;margin:20px auto 0}
  </style></head><body><header><img src="${getProgramLogoDataUri()}" alt="Arca Evangélica · Dios Fuerte"><div><h1>${escape(churchName)}</h1>${churchData.direccion ? `<p>${escape(churchData.direccion)}</p>` : ''}${churchData.telefono ? `<p>Tel: ${escape(churchData.telefono)}</p>` : ''}</div></header><p class="document-date">${escape(churchData.fecha || embeddedDate || date.toLocaleDateString('es-DO', {day:'numeric',month:'long',year:'numeric',timeZone:'America/Santo_Domingo'}))}</p><main>${lines.map(line => paragraph(line, emphasis)).join('')}</main><div class="closing"><main>${paragraph(finalLine, emphasis)}</main>${churchData.pastor ? `<section class="signature"><div class="signature-line"></div><p>${escape(churchData.tituloPastor || 'Pastor')}</p><strong>${escape(churchData.pastor)}</strong><img src="${getProgramLogoDataUri()}" alt="Logo de la iglesia"></section>` : ''}</div></body></html>`;
}
