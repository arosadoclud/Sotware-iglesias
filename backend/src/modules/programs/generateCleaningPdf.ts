import puppeteer from 'puppeteer';

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
  // Build HTML inline for cleaning schedule - matching frontend preview style
  const membersHtml = data.members
    .map((m, idx) => `
      <div class="member-row ${idx % 2 === 0 ? 'bg-even' : 'bg-odd'}">
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
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Playfair Display', serif;
          background: white;
          color: #1e293b;
          padding: 0;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #2c4875 0%, #3d5a80 100%);
          color: white;
          padding: 40px 50px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        .logo-container {
          width: 96px;
          height: 96px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: rgba(255,255,255,0.15);
          border: 2px solid rgba(255,255,255,0.3);
          padding: 8px;
        }
        .logo {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        .logo-emoji {
          font-size: 50px;
        }
        .church-name {
          font-size: 28px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          font-family: 'Playfair Display', serif;
        }
        .gold-band {
          height: 6px;
          background: linear-gradient(90deg, transparent 0%, #f59e0b 20%, #f59e0b 80%, transparent 100%);
        }
        .badge-container {
          display: flex;
          justify-content: center;
          padding: 30px 0;
        }
        .badge {
          background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
          color: #1B2D5B;
          padding: 10px 30px;
          border-radius: 50px;
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          font-family: 'Playfair Display', serif;
          box-shadow: 0 4px 10px rgba(245, 158, 11, 0.3);
        }
        .date-time {
          text-align: center;
          padding: 0 50px 10px;
        }
        .date {
          font-size: 20px;
          font-weight: 600;
          color: #1B2D5B;
          font-family: 'Playfair Display', serif;
          text-transform: capitalize;
        }
        .time {
          font-size: 16px;
          color: #6b7280;
          margin-top: 5px;
        }
        .ornament {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 25px 50px;
        }
        .ornament-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, #d1d5db 50%, transparent 100%);
        }
        .ornament-dots {
          display: flex;
          gap: 6px;
        }
        .ornament-dot {
          width: 6px;
          height: 6px;
          background: #f59e0b;
          transform: rotate(45deg);
        }
        .ornament-dot:nth-child(1),
        .ornament-dot:nth-child(3) {
          opacity: 0.6;
        }
        .group-label {
          text-align: center;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #2c4875;
          padding-bottom: 20px;
          font-family: 'Playfair Display', serif;
        }
        .members-container {
          padding: 0 30px 30px;
        }
        .member-row {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 15px 20px;
          border-radius: 10px;
          margin-bottom: 8px;
        }
        .bg-even {
          background: #f3f4f6;
        }
        .bg-odd {
          background: white;
        }
        .member-number {
          width: 32px;
          height: 32px;
          background: #2c4875;
          color: #fbbf24;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          font-family: 'Playfair Display', serif;
          flex-shrink: 0;
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
          font-size: 11px;
          color: #6b7280;
          margin-top: 4px;
        }
        .verse-section {
          text-align: center;
          padding: 20px 50px;
        }
        .verse-text {
          font-size: 12px;
          font-style: italic;
          color: #6b7280;
          font-family: 'Cormorant Garamond', serif;
          margin-bottom: 5px;
        }
        .verse-ref {
          font-size: 12px;
          color: #f59e0b;
          font-weight: 600;
          font-family: 'Cormorant Garamond', serif;
        }
        .footer {
          text-align: center;
          padding: 20px;
          background: #2c4875;
        }
        .footer-text {
          font-size: 14px;
          color: rgba(255,255,255,0.85);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          font-family: 'Playfair Display', serif;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-container">
            ${data.logoUrl 
              ? `<img src="${data.logoUrl}" class="logo" alt="Logo" onerror="this.style.display='none'; this.parentElement.innerHTML='<span class=\"logo-emoji\">🕊</span>';">`
              : '<span class="logo-emoji">🕊</span>'
            }
          </div>
          <div class="church-name">${data.churchName || 'Nombre de la Iglesia'}</div>
        </div>
        
        <div class="gold-band"></div>
        
        <div class="badge-container">
          <div class="badge">${data.activityType || 'Programa de Limpieza'}</div>
        </div>
        
        <div class="date-time">
          <div class="date">${data.date}</div>
          ${data.time ? `<div class="time">${data.time}</div>` : ''}
        </div>
        
        <div class="ornament">
          <div class="ornament-line"></div>
          <div class="ornament-dots">
            <span class="ornament-dot"></span>
            <span class="ornament-dot"></span>
            <span class="ornament-dot"></span>
          </div>
          <div class="ornament-line"></div>
        </div>
        
        <div class="group-label">Grupo ${data.groupNumber}</div>
        
        <div class="members-container">
          ${data.members.length === 0 
            ? '<div style="text-align: center; color: #9ca3af; font-style: italic; padding: 40px 0;">No hay miembros asignados</div>'
            : membersHtml
          }
        </div>
        
        ${data.verse || data.verseText ? `
          <div class="verse-section">
            ${data.verseText ? `<div class="verse-text">"${data.verseText}"</div>` : ''}
            ${data.verse ? `<div class="verse-ref">${data.verse}</div>` : ''}
          </div>
        ` : ''}
        
        <div class="footer">
          <div class="footer-text">${data.churchName || 'Nombre de la Iglesia'}</div>
        </div>
      </div>
    </body>
    </html>
  `;

  // Generate PDF with Puppeteer
  const browser = await puppeteer.launch({ headless: 'new' });
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
