import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import * as Handlebars from 'handlebars';
import * as puppeteer from 'puppeteer';

/** Descarga una imagen desde una URL y la retorna como data URI base64 */
async function fetchImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const mimeType = res.headers['content-type'] || 'image/png';
        resolve(`data:${mimeType};base64,${buffer.toString('base64')}`);
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

export async function generateFlyerPdf(data: any): Promise<Buffer> {
  // Helpers para plantilla
  Handlebars.registerHelper('padId', (id: number) => String(id).padStart(2, '0'));
  Handlebars.registerHelper('churchNameUpper', () => (data.churchName || '').toUpperCase());
  // verse y verseText se pasan directamente en data

  // Convertir logo a base64 para que Puppeteer no necesite red
  let logoUrl = data.logoUrl || '';
  if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
    try {
      logoUrl = await fetchImageAsBase64(logoUrl);
    } catch {
      logoUrl = ''; // Si falla, ocultamos el logo (mostrará el ícono ✝)
    }
  }
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
    headless: true,
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
    // Use 'domcontentloaded' to avoid hanging waiting for Google Fonts network requests
    // timeout of 15s prevents indefinite waits
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 });
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

