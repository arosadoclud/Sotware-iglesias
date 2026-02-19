import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';

export interface CleaningMember {
  id: string;
  name: string;
  phone?: string;
}

export interface CleaningPdfData {
  churchName: string;
  churchSub?: string;
  logoUrl?: string;
  activityType: string;
  date: string;
  time?: string;
  groupNumber: number;
  totalGroups: number;
  verse?: string;
  verseText?: string;
  members: CleaningMember[];
}

export async function generateCleaningPdf(data: CleaningPdfData): Promise<Buffer> {
  // Leer logo local
  let logoBase64 = '';
  try {
    const logoPath = path.join(process.cwd(), 'uploads', 'logo.png');
    const logoBuffer = await fs.readFile(logoPath);
    logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  } catch (error) {
    console.warn('No se pudo cargar el logo desde uploads/logo.png:', error);
  }

  // Build HTML for cleaning schedule - matching flyer format
  const membersHtml = data.members
    .map((m, idx) => `
      <div class="flyer-row">
        <div class="flyer-row-num">${String(idx + 1).padStart(2, '0')}</div>
        <div class="flyer-row-person">${m.name}</div>
        ${m.phone ? `<div class="flyer-row-phone">${m.phone}</div>` : ''}
      </div>
    `)
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Programa de Limpieza</title>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
      <style>
        :root {
          --navy: #1B2D5B;
          --navy-mid: #2A4080;
          --navy-light: #3B5BA8;
          --gold: #C8A84B;
          --gold-light: #E8C96A;
          --gold-pale: #FBF4E2;
          --gray-900: #111827;
          --gray-700: #374151;
          --gray-500: #6B7280;
          --gray-300: #D1D5DB;
          --gray-100: #F3F4F6;
          --bg: #F7F8FC;
          --white: #FFFFFF;
          --shadow-lg: 0 10px 40px rgba(0,0,0,0.14);
          --r: 12px;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'DM Sans', sans-serif;
          background: var(--bg);
          color: var(--gray-900);
          min-height: 100vh;
          margin: 0;
          padding: 0;
        }
        .flyer-container {
          background: var(--white);
          border-radius: var(--r);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
          width: 100%;
          max-width: 540px;
          margin: 40px auto;
          position: relative;
        }
        .flyer-header {
          background: linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 60%, var(--navy) 100%);
          padding: 1.8rem 2rem 1.5rem;
          position: relative;
          overflow: hidden;
        }
        .flyer-header::before {
          content: '';
          position: absolute;
          top: -40px; right: -40px;
          width: 160px; height: 160px;
          background: rgba(200,168,75,0.08);
          border-radius: 50%;
        }
        .flyer-header::after {
          content: '';
          position: absolute;
          bottom: -20px; left: -30px;
          width: 120px; height: 120px;
          background: rgba(200,168,75,0.05);
          border-radius: 50%;
        }
        .header-inner {
          display: flex;
          align-items: center;
          gap: 1.1rem;
          position: relative;
          z-index: 1;
        }
        .logo-circle {
          width: 60px;
          height: 60px;
          background: rgba(255,255,255,0.1);
          border: 2px solid rgba(200,168,75,0.5);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
          flex-shrink: 0;
          backdrop-filter: blur(4px);
        }
        .logo-img {
          width: 60px;
          height: 60px;
          border-radius: 10px;
          object-fit: contain;
          border: 2px solid rgba(200,168,75,0.4);
        }
        .header-text { flex: 1; }
        .flyer-church-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.35rem;
          font-weight: 700;
          color: white;
          line-height: 1.1;
          letter-spacing: 0.02em;
        }
        .flyer-church-sub {
          font-size: 0.75rem;
          color: var(--gold-light);
          margin-top: 2px;
          letter-spacing: 0.05em;
        }
        .gold-band {
          height: 4px;
          background: linear-gradient(90deg, var(--gold) 0%, var(--gold-light) 50%, var(--gold) 100%);
        }
        .flyer-badge-row {
          display: flex;
          justify-content: center;
          padding: 1.1rem 2rem 0.4rem;
        }
        .flyer-badge {
          background: var(--gold);
          color: var(--navy);
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.1rem;
          font-weight: 700;
          padding: 6px 24px;
          border-radius: 30px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .flyer-date-row {
          text-align: center;
          padding: 0.4rem 2rem 0.2rem;
        }
        .flyer-date {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.05rem;
          color: var(--navy);
          font-weight: 600;
        }
        .flyer-time {
          font-size: 0.8rem;
          color: var(--gray-500);
          margin-top: 2px;
        }
        .ornament {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0.5rem 2rem;
        }
        .ornament-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--gray-300), transparent);
        }
        .ornament-diamonds {
          display: flex;
          gap: 4px;
        }
        .ornament-diamonds span {
          display: block;
          width: 5px;
          height: 5px;
          background: var(--gold);
          transform: rotate(45deg);
          opacity: 0.7;
        }
        .ornament-diamonds span:nth-child(2) { opacity: 1; }
        .flyer-section-title {
          text-align: center;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--navy);
          padding-bottom: 0.5rem;
        }
        .flyer-table {
          padding: 0 1.5rem 1rem;
        }
        .flyer-row {
          display: flex;
          align-items: center;
          padding: 10px 12px;
          border-radius: 8px;
          margin-bottom: 4px;
          min-height: 44px;
          transition: background 0.15s;
        }
        .flyer-row:nth-child(odd) { background: var(--gray-100); }
        .flyer-row:nth-child(even) { background: var(--white); border: 1px solid var(--gray-100); }
        .flyer-row-num {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          background: var(--navy);
          color: var(--gold-light);
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
        }
        .flyer-row-person {
          flex: 1;
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--gray-900);
          font-style: italic;
        }
        .flyer-row-phone {
          flex-shrink: 0;
          font-size: 0.75rem;
          color: var(--gray-500);
          margin-left: 12px;
        }
        .flyer-verse {
          text-align: center;
          padding: 0.8rem 2rem 0.5rem;
          border-top: 1px solid var(--gray-100);
          margin: 0 1.5rem;
        }
        .flyer-verse p {
          font-family: 'Cormorant Garamond', serif;
          font-size: 0.88rem;
          font-style: italic;
          color: var(--gray-500);
          line-height: 1.5;
        }
        .flyer-verse cite {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--gold);
          font-style: normal;
          letter-spacing: 0.05em;
          display: block;
          margin-top: 3px;
        }
        .flyer-footer {
          background: var(--navy);
          padding: 10px 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 0.8rem;
        }
        .flyer-footer-text {
          font-size: 0.72rem;
          font-weight: 600;
          color: rgba(255,255,255,0.7);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
      </style>
    </head>
    <body>
      <div class="flyer-container">
        <div class="flyer-header">
          <div class="header-inner">
            <div class="logo-circle">
              ${logoBase64 
                ? `<img src="${logoBase64}" class="logo-img" alt="Logo"/>`
                : '✝'
              }
            </div>
            <div class="header-text">
              <div class="flyer-church-name">${data.churchName || 'Nombre de la Iglesia'}</div>
              ${data.churchSub ? `<div class="flyer-church-sub">${data.churchSub}</div>` : ''}
            </div>
          </div>
        </div>
        <div class="gold-band"></div>
        <div class="flyer-badge-row">
          <div class="flyer-badge">GRUPO ${data.groupNumber}</div>
        </div>
        <div class="flyer-date-row">
          <div class="flyer-date">${data.date}</div>
          ${data.time ? `<div class="flyer-time">${data.time}</div>` : ''}
        </div>
        <div class="ornament">
          <div class="ornament-line"></div>
          <div class="ornament-diamonds">
            <span></span><span></span><span></span>
          </div>
          <div class="ornament-line"></div>
        </div>
        <div class="flyer-section-title">${data.activityType || 'PROGRAMA DE LIMPIEZA'}</div>
        <div class="flyer-table">
          ${data.members.length === 0 
            ? '<div style="text-align: center; color: #9ca3af; font-style: italic; padding: 40px 0; font-size: 0.85rem;">No hay miembros asignados</div>'
            : membersHtml
          }
        </div>
        ${data.verse || data.verseText ? `
          <div class="flyer-verse">
            ${data.verseText ? `<p>"${data.verseText}"</p>` : ''}
            ${data.verse ? `<cite>${data.verse}</cite>` : ''}
          </div>
        ` : ''}
        <div class="flyer-footer">
          <span class="flyer-footer-text">${(data.churchName || 'NOMBRE DE LA IGLESIA').toUpperCase()}</span>
        </div>
      </div>
    </body>
    </html>
  `;

  // Generate PDF with Puppeteer
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
  });
  
  await browser.close();
  return pdfBuffer;
}
