import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import LetterTemplate from '../../models/LetterTemplate.model';
import GeneratedLetter from '../../models/GeneratedLetter.model';
import Person from '../../models/Person.model';
import Church from '../../models/Church.model';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

export const getLetterTemplates = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const templates = await LetterTemplate.find({ churchId: req.churchId }).sort({ name: 1 });
    res.json({ success: true, data: templates });
  } catch (error) { next(error); }
};

export const getLetterTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const template = await LetterTemplate.findOne({ _id: req.params.id, churchId: req.churchId });
    if (!template) throw new NotFoundError('Plantilla no encontrada');
    res.json({ success: true, data: template });
  } catch (error) { next(error); }
};

export const createLetterTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    delete req.body.churchId;
    const template = await LetterTemplate.create({ ...req.body, churchId: req.churchId });
    res.status(201).json({ success: true, data: template });
  } catch (error) { next(error); }
};

export const updateLetterTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    delete req.body.churchId;
    const template = await LetterTemplate.findOneAndUpdate(
      { _id: req.params.id, churchId: req.churchId }, req.body, { new: true }
    );
    if (!template) throw new NotFoundError('Plantilla no encontrada');
    res.json({ success: true, data: template });
  } catch (error) { next(error); }
};

export const deleteLetterTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const template = await LetterTemplate.findOneAndDelete({ _id: req.params.id, churchId: req.churchId });
    if (!template) throw new NotFoundError('Plantilla no encontrada');
    res.json({ success: true, message: 'Plantilla eliminada' });
  } catch (error) { next(error); }
};

export const getGeneratedLetters = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const letters = await GeneratedLetter.find({ churchId: req.churchId }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: letters });
  } catch (error) { next(error); }
};

export const deleteGeneratedLetter = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const letter = await GeneratedLetter.findOneAndDelete({ _id: req.params.id, churchId: req.churchId });
    if (!letter) throw new NotFoundError('Carta no encontrada');
    res.json({ success: true, message: 'Carta eliminada' });
  } catch (error) { next(error); }
};

export const generateLetter = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { templateId, personId, customFields, content: directContent, recipientName, templateName: directTemplateName } = req.body;
    
    // Buscar plantilla si existe y el templateId no es un wizard-type
    let template = null;
    let templateName = directTemplateName || 'Carta';
    
    if (templateId && !templateId.startsWith('wizard-')) {
      template = await LetterTemplate.findOne({ _id: templateId, churchId: req.churchId });
      if (!template) throw new NotFoundError('Plantilla no encontrada');
      templateName = template.name;
    }

    let finalContent = directContent || (template?.content || '');
    let recipient = recipientName || '';
    const variablesUsed: Record<string, string> = {};

    // Si se proporciona personId, obtener datos de la persona
    if (personId) {
      const person = await Person.findOne({ _id: personId, churchId: req.churchId });
      if (!person) throw new NotFoundError('Persona no encontrada');
      recipient = person.fullName;
      finalContent = finalContent.replace(/\{\{nombre\}\}/gi, person.fullName);
      finalContent = finalContent.replace(/\{\{fecha\}\}/gi, new Date().toLocaleDateString('es-DO'));
      variablesUsed['nombre'] = person.fullName;
    }

    // Reemplazar variables adicionales
    if (customFields) {
      Object.entries(customFields).forEach(([key, val]) => {
        finalContent = finalContent.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'gi'), String(val));
        variablesUsed[key] = String(val);
      });
    }

    const letter = await GeneratedLetter.create({
      churchId: req.churchId,
      templateId: templateId || 'wizard',
      recipientName: recipient || 'Destinatario',
      templateName,
      finalContent,
      variablesUsed,
      generatedBy: { id: req.userId, name: req.user?.fullName || 'Sistema' },
    });

    res.status(201).json({ success: true, data: letter });
  } catch (error) { next(error); }
};

// Descargar carta como PDF
export const downloadLetterPdf = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { content, title, recipientName, churchData, eventData } = req.body;
    if (!content) throw new BadRequestError('El contenido es requerido');

    // Buscar logo de la iglesia
    let logoBase64 = '';
    const possibleLogoPaths = [
      path.join(process.cwd(), 'uploads', 'logo.png'),
      path.join(process.cwd(), '..', 'uploads', 'logo.png'),
      path.join(process.cwd(), '..', 'frontend', 'public', 'logo.png'),
      path.join(process.cwd(), '..', 'frontend', 'dist', 'logo.png'),
      path.join(process.cwd(), 'public', 'logo.png'),
    ];
    
    console.log('🔍 Buscando logo de la iglesia...');
    console.log('process.cwd():', process.cwd());
    
    for (const logoPath of possibleLogoPaths) {
      console.log('Intentando:', logoPath);
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
        console.log('✅ Logo encontrado en:', logoPath);
        break;
      }
    }
    
    if (!logoBase64) {
      console.warn('⚠️ No se encontró el logo en ninguna ubicación');
    }

    // Datos de la iglesia para el encabezado
    const church = churchData || {};
    const churchName = church.nombre || 'Iglesia';
    const churchAddress = church.direccion || '';
    const churchPhone = church.telefono || '';
    const pastorName = church.pastor || '';
    const pastorTitle = church.tituloPastor || 'Pastor';

    // Datos del evento para aplicar negritas
    const event = eventData || {};

    // Procesar contenido aplicando negritas a campos del evento
    let processedContent = content;
    
    // Aplicar negrita al nombre de la iglesia destinatario (después de "Iglesia:")
    if (event.iglesiaDestinatario) {
      processedContent = processedContent.replace(
        `Iglesia: ${event.iglesiaDestinatario}`,
        `Iglesia: <strong>${event.iglesiaDestinatario}</strong>`
      );
    }
    
    // Aplicar negrita al nombre del pastor destinatario
    if (event.pastorDestinatario) {
      processedContent = processedContent.replace(
        `Pastor/a/es: ${event.pastorDestinatario}`,
        `Pastor/a/es: <strong>${event.pastorDestinatario}</strong>`
      );
      processedContent = processedContent.replace(
        `Pastor/a: ${event.pastorDestinatario}`,
        `Pastor/a: <strong>${event.pastorDestinatario}</strong>`
      );
    }
    
    // Aplicar negrita al nombre de la iglesia remitente (dentro del texto del cuerpo)
    if (churchName && churchName !== 'Iglesia') {
      processedContent = processedContent.split(churchName).join(`<strong>${churchName.toUpperCase()}</strong>`);
    }
    
    // Aplicar negrita a la fecha del evento
    if (event.fecha) {
      processedContent = processedContent.split(event.fecha).join(`<strong>${event.fecha}</strong>`);
    }
    
    // Aplicar negrita al tema (con comillas y en mayúsculas)
    if (event.tema) {
      processedContent = processedContent.replace(
        `"${event.tema}"`,
        `"<strong>${event.tema.toUpperCase()}</strong>"`
      );
    }
    
    // Aplicar negrita a la hora
    if (event.hora) {
      processedContent = processedContent.split(event.hora).join(`<strong>${event.hora}</strong>`);
    }


    // Convertir saltos de línea a HTML pero excluir la firma
    const lines = processedContent.split('\n');
    let htmlContent = '';
    let inSignature = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detectar inicio de firma (línea de guiones bajos)
      if (line.startsWith('_____')) {
        inSignature = true;
        continue; // No incluir la línea de guiones, la manejamos en la firma
      }
      
      // Si estamos en firma, ignorar (lo manejamos aparte)
      if (inSignature) continue;
      
      if (line === '') {
        htmlContent += '<br/>';
      } else if (line.startsWith('Iglesia:') || line.startsWith('Pastor/a/es:')) {
        // Sin margen inferior para estas líneas (van juntas)
        htmlContent += `<p class="recipient-line">${line}</p>`;
      } else {
        htmlContent += `<p>${line}</p>`;
      }
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page { 
            size: A4;
            margin: 2cm 2.5cm; 
          }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.8;
            color: #333;
            margin: 0;
            padding: 0;
          }
          
          /* Encabezado */
          .header {
            display: flex;
            align-items: flex-start;
            margin-bottom: 40px;
            text-align: center;
          }
          .header-logo {
            width: 70px;
            height: auto;
            margin-right: 20px;
          }
          .header-info {
            flex: 1;
            text-align: center;
          }
          .header-name {
            font-size: 18pt;
            font-weight: bold;
            color: #1a5276;
            margin: 0 0 8px 0;
            white-space: nowrap;
          }
          .header-address {
            font-size: 11pt;
            font-weight: bold;
            color: #333;
            margin: 3px 0;
            text-align: center;
          }
          .header-phone {
            font-size: 11pt;
            font-weight: bold;
            color: #333;
            margin: 3px 0;
            text-align: center;
          }
          
          /* Fecha de redacción */
          .date-line {
            text-align: right;
            font-size: 11pt;
            color: #333;
            margin: 0 0 30px 0;
            font-style: italic;
          }
          
          /* Contenido */
          .content {
            margin: 30px 0;
            padding: 0 10px;
          }
          .content p {
            margin: 0 0 8px 0;
            text-align: justify;
            text-indent: 0;
            line-height: 1.8;
          }
          .content .recipient-line {
            margin: 0 0 2px 0;
            text-align: left;
          }
          .content br {
            display: block;
            margin: 10px 0;
            content: "";
          }
          
          /* Firma centrada */
          .signature-section {
            text-align: center;
            margin-top: 80px;
            padding-top: 20px;
          }
          .signature-line {
            width: 200px;
            border-top: 1px solid #333;
            margin: 0 auto 15px auto;
          }
          .pastor-name {
            font-weight: bold;
            font-size: 12pt;
            margin: 8px 0 3px 0;
          }
          .pastor-title {
            color: #c0392b;
            font-size: 11pt;
            font-weight: bold;
            margin: 0;
          }
          .signature-logo {
            width: 65px;
            height: auto;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <!-- Encabezado con logo e información de la iglesia -->
        <div class="header">
          ${logoBase64 ? `<img src="${logoBase64}" class="header-logo" alt="Logo"/>` : ''}
          <div class="header-info">
            <p class="header-name">${churchName}</p>
            ${churchAddress ? `<p class="header-address">${churchAddress}</p>` : ''}
            ${churchPhone ? `<p class="header-phone">Tel: ${churchPhone}.</p>` : ''}
          </div>
        </div>
        
        <!-- Fecha de redacción -->
        <p class="date-line">${new Date().toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        
        <!-- Contenido de la carta -->
        <div class="content">
          ${htmlContent}
        </div>
        
        <!-- Firma centrada con logo -->
        <div class="signature-section">
          <div class="signature-line"></div>
          <p class="pastor-name">${pastorName}</p>
          <p class="pastor-title">${pastorTitle}</p>
          ${logoBase64 ? `<img src="${logoBase64}" class="signature-logo" alt="Logo"/>` : ''}
        </div>
      </body>
      </html>
    `;

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '1.5cm', bottom: '1.5cm', left: '2cm', right: '2cm' },
    });
    await browser.close();

    const filename = `carta-${(recipientName || 'invitacion').replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) { next(error); }
};
