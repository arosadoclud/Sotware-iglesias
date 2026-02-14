import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import * as puppeteer from 'puppeteer';

export async function generateFlyerPdf(data: any): Promise<Buffer> {
  // Helpers para plantilla
  Handlebars.registerHelper('padId', (id: number) => String(id).padStart(2, '0'));
  Handlebars.registerHelper('churchNameUpper', () => (data.churchName || '').toUpperCase());
  Handlebars.registerHelper('verseText', () => {
    // Separar texto y cita
    const verseInput = data.verse || '';
    let verseText = verseInput;
    if (verseInput.includes('—') || verseInput.includes('-') || verseInput.includes(':')) {
      let idx = Math.max(
        verseInput.lastIndexOf('—'),
        verseInput.lastIndexOf('-'),
        verseInput.lastIndexOf(':')
      );
      if (idx > 0 && idx < verseInput.length - 1) {
        verseText = verseInput.slice(0, idx).trim();
      }
    }
    if (verseText.startsWith('"') && verseText.endsWith('"')) {
      verseText = verseText.slice(1, -1);
    }
    return verseText || '"Por tanto, id, y haced discípulos a todas las naciones"';
  });
  Handlebars.registerHelper('verseRef', () => {
    const verseInput = data.verse || '';
    let verseRef = verseInput;
    if (verseInput.includes('—') || verseInput.includes('-') || verseInput.includes(':')) {
      let idx = Math.max(
        verseInput.lastIndexOf('—'),
        verseInput.lastIndexOf('-'),
        verseInput.lastIndexOf(':')
      );
      if (idx > 0 && idx < verseInput.length - 1) {
        verseRef = verseInput.slice(idx + 1).trim();
      }
    }
    return verseRef || 'Mateo 28:19';
  });
  // 1. Leer la plantilla HTML
  const templatePath = path.join(__dirname, '../../templates/flyer-program.html');
  const htmlRaw = fs.readFileSync(templatePath, 'utf8');

  // 2. Compilar con Handlebars
  const template = Handlebars.compile(htmlRaw);
  const html = template(data);

  // 3. Lanzar Puppeteer y generar PDF
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  // Opcional: ajustar tamaño de página
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
  });
  await browser.close();

  return pdfBuffer;
}
