import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import * as puppeteer from 'puppeteer';

export async function generateFlyerPdf(data: any): Promise<Buffer> {
  // Helpers para plantilla
  Handlebars.registerHelper('padId', (id: number) => String(id).padStart(2, '0'));
  Handlebars.registerHelper('churchNameUpper', () => (data.churchName || '').toUpperCase());
  // verse y verseText se pasan directamente en data
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
