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
  // Compiled: dist/modules/programs/ → need 3 levels up to reach backend/templates/
  const templatePath = path.join(__dirname, '../../../templates/flyer-program.html');
  const htmlRaw = fs.readFileSync(templatePath, 'utf8');

  // 2. Compilar con Handlebars
  const template = Handlebars.compile(htmlRaw);
  const html = template(data);

  // 3. Lanzar Puppeteer y generar PDF
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
    ],
  });
  let pdfBuffer: Buffer;
  try {
    const page = await browser.newPage();
    // Use 'load' instead of 'networkidle0' to avoid hanging on Google Fonts
    // timeout of 15s prevents indefinite waits on slow networks
    await page.setContent(html, { waitUntil: 'load', timeout: 15000 });
    // Wait for fonts to finish loading (resolves immediately if fonts already loaded)
    await page.evaluateHandle('document.fonts.ready');
    // Opcional: ajustar tamaño de página
    pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
    }) as Buffer;
  } finally {
    await browser.close();
  }

  return pdfBuffer;
}

