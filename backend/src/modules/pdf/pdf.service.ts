import path from "path";
import fs from "fs";
import Handlebars from "handlebars";
import { IProgram } from "../../models/Program.model";
import { IChurch } from "../../models/Church.model";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import puppeteer from "puppeteer";

/**
 * PDF SERVICE
 * Genera PDFs profesionales de programas usando Puppeteer (HTML→PDF)
 */

// Registrar helpers Handlebars
Handlebars.registerHelper("eq", (a: any, b: any) => a === b);
Handlebars.registerHelper("formatDate", (date: Date) =>
  format(new Date(date), "EEEE d 'de' MMMM yyyy", { locale: es }),
);
Handlebars.registerHelper("addOne", (value: number) => {
  return value + 1;
});
Handlebars.registerHelper("padId", (id: any) => String(id).padStart(2, "0"));

const DAYS_ES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

const DEFAULT_BRAND_COLOR = "#1e3a5f";
const DEFAULT_BRAND_COLOR_LIGHT = "#2563eb";

export interface PdfGenerationOptions {
  program: IProgram;
  church: IChurch;
  isPro?: boolean;
  flyerStyle?: boolean;
}

export interface PdfResult {
  buffer: Buffer;
  filename: string;
  generatedAt: Date;
}

export class PdfService {
  private templatePath = path.join(__dirname, "templates", "program.hbs");
  private flyerTemplatePath = path.join(__dirname, "templates", "flyer.hbs");
  private template: Handlebars.TemplateDelegate | null = null;

  private getTemplate(flyerStyle = false): Handlebars.TemplateDelegate {
    const templateSource = fs.readFileSync(
      flyerStyle ? this.flyerTemplatePath : this.templatePath,
      "utf-8",
    );
    return Handlebars.compile(templateSource);
  }

  buildHtml(options: PdfGenerationOptions): string {
    const { program, church, isPro = false, flyerStyle = false } = options;

    if (flyerStyle) {
      // --- FLYER DATA - USA DATOS EXACTOS DEL PROGRAMA ---
      const assignments = (program.assignments || []).map(
        (a: any, idx: number) => ({
          id: a.id || a.sectionOrder || idx + 1,
          roleName: a.roleName || a.sectionName || "Sin rol",
          personName: a.person?.fullName || a.person?.name || "Sin asignar",
        }),
      );

      // Extraer versículo completo del programa
      let verseText = "";
      let verseRef = "";

      const verseSource = (program as any).verse || "";

      if (verseSource) {
        // Si el versículo contiene separador, dividirlo
        const separatorIdx = Math.max(
          verseSource.lastIndexOf("—"),
          verseSource.lastIndexOf("-"),
          verseSource.lastIndexOf("–"),
        );

        if (separatorIdx > 0 && separatorIdx < verseSource.length - 5) {
          verseText = verseSource.slice(0, separatorIdx).trim();
          verseRef = verseSource.slice(separatorIdx + 1).trim();
        } else {
          // Si no hay separador, usar todo como texto
          verseText = verseSource;
        }
      }

      // Usar la fecha y hora EXACTAS guardadas en el programa
      const dateObj = new Date(program.programDate);
      const formattedDate = `${DAYS_ES[dateObj.getDay()]}, ${format(dateObj, "d 'de' MMMM yyyy", { locale: es })}`;

      // ✅ CRÍTICO: Usar programTime si existe, sino extraer de programDate
      const programTime =
        (program as any).programTime || format(dateObj, "HH:mm");

      // ✅ CRÍTICO: Usar churchName del programa (no de church)
      const churchName =
        (program as any).churchName || church.name || "Iglesia";
      const subtitle =
        (program as any).subtitle || (church as any).subTitle || "";
      const worshipType = (program as any).activityType?.name || "Culto";

      const templateData = {
        churchName,
        subtitle,
        location: "",
        worshipType,
        assignments,
        formattedDate,
        programTime,
        verseText,
        verseRef,
        verse: verseSource, // Versículo completo para el template
        summary: (program as any).summary || "",
        logoUrl: church.logoUrl || null,
      };

      const template = this.getTemplate(true);
      return template(templateData);
    }

    // --- DEFAULT CORPORATE PDF ---
    const sectionsMap = new Map<
      string,
      { name: string; order: number; assignments: any[] }
    >();
    for (const assignment of program.assignments) {
      const key = assignment.sectionName;
      if (!sectionsMap.has(key)) {
        sectionsMap.set(key, {
          name: assignment.sectionName,
          order: assignment.sectionOrder,
          assignments: [],
        });
      }
      sectionsMap.get(key)!.assignments.push(assignment);
    }

    const sections = [...sectionsMap.values()].sort(
      (a, b) => a.order - b.order,
    );
    const totalAssignments = program.assignments.filter(
      (a) => a.person?.name,
    ).length;
    const uniqueSections = sections.length;
    const dateObj = new Date(program.programDate);
    const formattedDate = `${DAYS_ES[dateObj.getDay()]}, ${format(dateObj, "d 'de' MMMM 'de' yyyy", { locale: es })}`;
    const brandColor = (church as any).brandColor || DEFAULT_BRAND_COLOR;
    const brandColorLight = this.lightenColor(brandColor);

    const templateData = {
      church: {
        name: church.name,
        logoUrl: church.logoUrl || null,
        signatureUrl: (church as any).signatureUrl || null,
        pastorName: (church as any).pastorName || null,
        phone: church.phone || null,
        address: church.address,
      },
      activityType: (program as any).activityType,
      formattedDate,
      defaultTime: (church as any).settings?.defaultTime || "",
      notes: (program as any).notes || null,
      sections,
      totalAssignments,
      totalSections: uniqueSections,
      coveragePercent:
        uniqueSections > 0
          ? Math.round((totalAssignments / program.assignments.length) * 100)
          : 0,
      programStatus: STATUS_LABELS[program.status] || program.status,
      generatedAt: format(new Date(), "d MMM yyyy 'a las' HH:mm", {
        locale: es,
      }),
      generatedBy: (program as any).generatedBy,
      isPro,
      brandColor,
      brandColorLight,
    };

    const template = this.getTemplate();
    return template(templateData);
  }

  async generateBuffer(options: PdfGenerationOptions): Promise<PdfResult> {
    const html = this.buildHtml(options);
    const { program, church } = options;

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();
    // En pdf.service.ts línea 202, cambia de:
    console.log("🔍 HTML GENERADO:", html.substring(0, 500));

    // A:
    console.log("🔍 HTML GENERADO (primeros 2000):", html.substring(0, 2000));
    console.log(
      "🔍 HTML DONDE ESTÁN LOS NÚMEROS:",
      html.substring(
        html.indexOf("flyer-row-num"),
        html.indexOf("flyer-row-num") + 300,
      ),
    );
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Esperar a que las fuentes de Google se carguen
    await page.evaluateHandle("document.fonts.ready");
    await new Promise((resolve) => setTimeout(resolve, 3000)); // Esperar 3 segundos adicional

    const pdfBuffer = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: { top: "15mm", right: "15mm", bottom: "20mm", left: "15mm" },
    });

    await browser.close();

    const dateStr = format(new Date(program.programDate), "yyyy-MM-dd");
    const churchSlug = church.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const activitySlug = ((program as any).activityType?.name || "programa")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const filename = `${churchSlug}-${activitySlug}-${dateStr}.pdf`;

    return {
      buffer: Buffer.from(pdfBuffer),
      filename,
      generatedAt: new Date(),
    };
  }

  private lightenColor(hex: string): string {
    try {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const lighten = (c: number) =>
        Math.min(255, Math.floor(c + (255 - c) * 0.4));
      return `#${lighten(r).toString(16).padStart(2, "0")}${lighten(g).toString(16).padStart(2, "0")}${lighten(b).toString(16).padStart(2, "0")}`;
    } catch {
      return DEFAULT_BRAND_COLOR_LIGHT;
    }
  }
}

export const pdfService = new PdfService();
