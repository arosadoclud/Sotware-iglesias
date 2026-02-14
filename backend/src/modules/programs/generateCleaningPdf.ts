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
  date: string;
  groupNumber: number;
  totalGroups: number;
  members: CleaningMember[];
}

export async function generateCleaningPdf(data: CleaningPdfData): Promise<Buffer> {
  // Build HTML inline for cleaning schedule
  const membersHtml = data.members
    .map((m, idx) => `
      <tr>
        <td style="padding: 10px 15px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: 600; color: #6366f1;">${idx + 1}</td>
        <td style="padding: 10px 15px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${m.name}</td>
        <td style="padding: 10px 15px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${m.phone || '—'}</td>
      </tr>
    `)
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', system-ui, sans-serif;
          background: #f8fafc;
          color: #1e293b;
          padding: 40px;
        }
        .container {
          max-width: 700px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .logo {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          margin-bottom: 15px;
          object-fit: cover;
          border: 3px solid rgba(255,255,255,0.3);
        }
        .church-name {
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 5px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .church-sub {
          font-size: 14px;
          opacity: 0.9;
        }
        .badge {
          display: inline-block;
          background: rgba(255,255,255,0.2);
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          margin-top: 12px;
          font-weight: 600;
        }
        .content {
          padding: 30px;
        }
        .group-title {
          text-align: center;
          margin-bottom: 25px;
        }
        .group-label {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 8px;
        }
        .group-number {
          font-size: 36px;
          font-weight: 800;
          color: #4f46e5;
        }
        .group-date {
          font-size: 16px;
          color: #374151;
          margin-top: 10px;
          font-weight: 500;
        }
        .divider {
          height: 2px;
          background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
          margin: 20px 0;
        }
        .members-title {
          font-size: 16px;
          font-weight: 700;
          color: #374151;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .members-title::before {
          content: '';
          display: inline-block;
          width: 4px;
          height: 20px;
          background: #4f46e5;
          border-radius: 2px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          background: #fafafa;
          border-radius: 10px;
          overflow: hidden;
        }
        thead th {
          background: #f1f5f9;
          padding: 12px 15px;
          text-align: left;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748b;
          font-weight: 600;
        }
        thead th:first-child {
          text-align: center;
          width: 50px;
        }
        .footer {
          text-align: center;
          padding: 20px;
          background: #f1f5f9;
          border-top: 1px solid #e2e8f0;
        }
        .footer-text {
          font-size: 13px;
          color: #64748b;
        }
        .total-badge {
          display: inline-block;
          background: #ddd6fe;
          color: #5b21b6;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${data.logoUrl ? `<img src="${data.logoUrl}" class="logo" alt="Logo">` : ''}
          <div class="church-name">${data.churchName || 'Iglesia'}</div>
          <div class="badge">Programa de Limpieza</div>
        </div>
        
        <div class="content">
          <div class="group-title">
            <div class="group-label">Asignación para</div>
            <div class="group-number">Grupo ${data.groupNumber}</div>
            <div class="group-date">${data.date}</div>
            <div class="total-badge">${data.members.length} miembro${data.members.length !== 1 ? 's' : ''}</div>
          </div>
          
          <div class="divider"></div>
          
          <div class="members-title">Miembros Asignados</div>
          
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Teléfono</th>
              </tr>
            </thead>
            <tbody>
              ${membersHtml}
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <div class="footer-text">
            Rotación: Grupo ${data.groupNumber} de ${data.totalGroups} grupos
          </div>
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
