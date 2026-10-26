import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import * as puppeteer from 'puppeteer';
import { getProgramLogoDataUri } from '../../config/brand';

export async function generateFlyerPdf(data: any, options: { format?: 'pdf' | 'png'; layout?: 'compact' | 'a4' } = {}): Promise<Buffer> {
  // Helpers para plantilla
  Handlebars.registerHelper('padId', (id: number) => String(id).padStart(2, '0'));
  Handlebars.registerHelper('churchNameUpper', () => (data.churchName || '').toUpperCase());
  // verse y verseText se pasan directamente en data

  const logoUrl = getProgramLogoDataUri();
  const templateData = { ...data, logoUrl };

  // 1. Leer la plantilla HTML
  // Compiled: dist/modules/programs/ → need 3 levels up to reach backend/templates/
  const templatePath = path.join(__dirname, '../../../templates/flyer-program.html');
  const htmlRaw = fs.readFileSync(templatePath, 'utf8');

  // 2. Compilar con Handlebars
  const template = Handlebars.compile(htmlRaw);
  const html = template(templateData);

  // 3. Lanzar Puppeteer y generar PDF
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
    ],
  });
  let pdfBuffer: Buffer;
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 540, height: 900, deviceScaleFactor: 2 });
    // Use 'domcontentloaded' to avoid hanging waiting for Google Fonts network requests
    // timeout of 15s prevents indefinite waits
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 });
    // Wait for fonts to finish loading (resolves immediately if fonts already loaded)
    await page.evaluateHandle("Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 4000))])");
    await page.emulateMediaType('print');
    const compact = options.format === 'png' || options.layout !== 'a4';
    if (compact) {
      await page.addStyleTag({ content: 'html,body{margin:0!important;padding:0!important;background:transparent!important}.flyer-container{margin:0!important;box-shadow:none!important;width:540px!important;max-width:none!important}' });
    }
    const flyer = await page.$('.flyer-container');
    if (!flyer) throw new Error('No se encontró el diseño del programa');
    const bounds = await flyer.boundingBox();
    if (!bounds) throw new Error('No se pudo medir el programa');
    // Chromium rounds PDF dimensions to points. A 1px width allowance prevents
    // long labels reflowing after measurement and pushing the footer to page 2.
    if (compact) await page.addStyleTag({ content: '@page{size:541px ' + (Math.ceil(bounds.height) + 2) + 'px;margin:0}' });
    if (options.format === 'png') {
      pdfBuffer = await flyer.screenshot({ type: 'png', omitBackground: true }) as Buffer;
    } else {
      pdfBuffer = await page.pdf({
        ...(compact ? { width: '541px', height: (Math.ceil(bounds.height) + 2) + 'px', scale: 1 } : { format: 'A4' as const, scale: 1.15 }),
        preferCSSPageSize: compact,
        printBackground: true,
        margin: compact ? { top: 0, right: 0, bottom: 0, left: 0 } : { top: '20px', right: '20px', bottom: '20px', left: '20px' },
      }) as Buffer;
    }
  } finally {
    await browser.close();
  }

  return pdfBuffer;
}
