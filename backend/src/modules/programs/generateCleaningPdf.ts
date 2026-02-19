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

  // Build HTML for cleaning schedule - matching preview format
  const membersHtml = data.members
    .map((m, idx) => `
      <div class="member-row">
        <div class="member-number">${String(idx + 1).padStart(2, '0')}</div>
        <div class="member-info">
          <div class="member-name">${m.name}</div>
          ${m.phone ? `<div class="member-phone">${m.phone}</div>` : ''}
        </div>
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
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #F7F8FC;
          margin: 0;
          padding: 0;
        }
        .container {
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          overflow: hidden;
          width: 100%;
          max-width: 540px;
          margin: 40px auto;
        }
        /* Header */
        .header {
          background: linear-gradient(to right, #2c4875, #3d5a80);
          padding: 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 16px;
        }
        .logo {
          width: 96px;
          height: 96px;
          object-fit: contain;
          border-radius: 12px;
          background: rgba(255,255,255,0.1);
          padding: 8px;
        }
        .logo-fallback {
          width: 96px;
          height: 96px;
          background: rgba(255,255,255,0.15);
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
        }
        .church-name {
          color: white;
          font-size: 24px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          font-family: 'Playfair Display', serif;
        }
        /* Gold band */
        .gold-band {
          height: 6px;
          background: linear-gradient(to right, transparent, #F59E0B, transparent);
        }
        /* Badge */
        .badge-section {
          display: flex;
          justify-content: center;
          padding: 24px 0;
        }
        .badge {
          background: linear-gradient(to right, #F59E0B, #FBBF24);
          color: #1B2D5B;
          padding: 8px 32px;
          border-radius: 9999px;
          font-weight: 700;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
          font-family: 'Playfair Display', serif;
        }
        /* Date & Time */
        .date-section {
          text-align: center;
          padding: 0 32px 8px;
        }
        .date {
          color: #1B2D5B;
          font-size: 18px;
          font-weight: 600;
          text-transform: capitalize;
          font-family: 'Playfair Display', serif;
        }
        .time {
          color: #6B7280;
          font-size: 16px;
          margin-top: 4px;
        }
        /* Ornament */
        .ornament {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 32px;
        }
        .ornament-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, transparent, #D1D5DB, transparent);
        }
        .ornament-diamonds {
          display: flex;
          gap: 6px;
        }
        .ornament-diamonds span {
          width: 6px;
          height: 6px;
          background: #F59E0B;
          transform: rotate(45deg);
          opacity: 0.6;
        }
        .ornament-diamonds span:nth-child(2) {
          opacity: 1;
        }
        /* Group title */
        .group-title {
          text-align: center;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: #2c4875;
          padding-bottom: 16px;
          font-family: 'Playfair Display', serif;
        }
        /* Members list */
        .members-section {
          padding: 0 24px 24px;
        }
        .member-row {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 8px;
        }
        .member-row:nth-child(odd) {
          background: #F3F4F6;
        }
        .member-row:nth-child(even) {
          background: white;
        }
        .member-number {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          background: #2c4875;
          color: #FBBF24;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          font-family: 'Playfair Display', serif;
        }
        .member-info {
          flex: 1;
          text-align: center;
        }
        .member-name {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          font-family: 'Playfair Display', serif;
        }
        .member-phone {
          font-size: 12px;
          color: #6B7280;
          margin-top: 4px;
        }
        .no-members {
          text-align: center;
          padding: 32px 0;
          color: #9CA3AF;
          font-style: italic;
        }
        /* Verse */
        .verse-section {
          text-align: center;
          padding: 0 32px 16px;
        }
        .verse-text {
          font-size: 12px;
          font-style: italic;
          color: #6B7280;
          font-family: 'Playfair Display', serif;
          margin-bottom: 4px;
        }
        .verse-ref {
          font-size: 12px;
          color: #EA580C;
          font-weight: 600;
        }
        /* Footer */
        .footer {
          background: #2c4875;
          padding: 16px;
          text-align: center;
        }
        .footer-text {
          color: rgba(255,255,255,0.85);
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-family: 'Playfair Display', serif;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          ${logoBase64 
            ? `<img src="${logoBase64}" class="logo" alt="Logo de la iglesia"/>`
            : '<div class="logo-fallback">🕊</div>'
          }
          <h1 class="church-name">${data.churchName || 'Nombre de la Iglesia'}</h1>
        </div>

        <!-- Gold Band -->
        <div class="gold-band"></div>

        <!-- Badge -->
        <div class="badge-section">
          <div class="badge">${data.activityType || 'Programa de Limpieza'}</div>
        </div>

        <!-- Date & Time -->
        <div class="date-section">
          <div class="date">${data.date}</div>
          ${data.time ? `<div class="time">${data.time}</div>` : ''}
        </div>

        <!-- Ornament -->
        <div class="ornament">
          <div class="ornament-line"></div>
          <div class="ornament-diamonds">
            <span></span><span></span><span></span>
          </div>
          <div class="ornament-line"></div>
        </div>

        <!-- Group Title -->
        <div class="group-title">Grupo ${data.groupNumber}</div>

        <!-- Members List -->
        <div class="members-section">
          ${data.members.length === 0 
            ? '<div class="no-members">No hay miembros asignados</div>'
            : membersHtml
          }
        </div>

        <!-- Verse -->
        ${data.verse || data.verseText ? `
          <div class="verse-section">
            ${data.verseText ? `<div class="verse-text">"${data.verseText}"</div>` : ''}
            ${data.verse ? `<div class="verse-ref">${data.verse}</div>` : ''}
          </div>
        ` : ''}

        <!-- Footer -->
        <div class="footer">
          <div class="footer-text">${(data.churchName || 'Nombre de la Iglesia').toUpperCase()}</div>
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
