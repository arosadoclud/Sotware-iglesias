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
Handlebars.registerHelper("mod", (a: number, b: number) => a % b);

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
      // --- FLYER DATA - IDÉNTICO AL PREVIEW DEL FRONTEND ---
      const assignments = (program.assignments || []).map(
        (a: any, idx: number) => ({
          id: a.sectionOrder || idx + 1,
          roleName: a.roleName || a.sectionName || "Sin rol",
          personName: a.person?.name || a.person?.fullName || "",
        }),
      );

      const verseSource = (program as any).verse || "";

      // Formatear fecha IGUAL que el frontend (formatDateES con Intl es-DO)
      const dateObj = new Date(program.programDate);
      // Ajustar para evitar problemas de timezone (igual que frontend: dateStr + 'T12:00:00')
      const dateForFormat = new Date(dateObj.toISOString().slice(0, 10) + "T12:00:00");
      const dateOpts: Intl.DateTimeFormatOptions = {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      };
      const rawDate = dateForFormat.toLocaleDateString("es-DO", dateOpts);
      const formattedDate = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

      // Formatear hora IGUAL que el frontend (formatTimeES con AM/PM)
      const timeStr = (program as any).programTime || (program as any).defaultTime || "";
      const ampm = (program as any).ampm || "AM";
      let formattedTime = "";
      if (timeStr) {
        const parts = timeStr.split(":");
        let h = parseInt(parts[0]);
        const m = parts[1] || "00";
        const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
        formattedTime = `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
      }

      // Datos de la iglesia
      const churchName =
        (program as any).churchName || church.name || "Iglesia";
      const subtitle =
        (program as any).subtitle || (program as any).churchSub || (church as any).subTitle || "";
      // location puede estar en el programa o construirse desde church.address
      let location = (program as any).location || "";
      if (!location && church.address) {
        const addr = church.address as any;
        location = typeof addr === 'string' ? addr : [addr.city, addr.state, addr.country].filter(Boolean).join(', ');
      }
      const worshipType = (program as any).activityType?.name || "Culto";

      // Logo: embeber como base64 data URI para máxima compatibilidad con Puppeteer
      let logoUrl: string | null = null;
      const rawLogo = (program as any).logoUrl || church.logoUrl || null;
      if (rawLogo) {
        if (rawLogo.startsWith("http://") || rawLogo.startsWith("https://")) {
          logoUrl = rawLogo;
        } else if (rawLogo.startsWith("data:")) {
          logoUrl = rawLogo;
        } else {
          const logoFilename = path.basename(rawLogo);
          const searchDirs = [
            path.join(process.cwd(), "uploads"),
            path.join(__dirname, "..", "..", "..", "uploads"),
            path.join(process.cwd(), "public"),
          ];
          const searchNames = [logoFilename, "logo.png"];

          for (const dir of searchDirs) {
            if (logoUrl) break;
            for (const name of searchNames) {
              const candidate = path.join(dir, name);
              if (fs.existsSync(candidate)) {
                // Leer archivo y convertir a base64 data URI
                const fileBuffer = fs.readFileSync(candidate);
                const ext = path.extname(name).toLowerCase().replace(".", "");
                const mime = ext === "png" ? "image/png"
                  : ext === "jpg" || ext === "jpeg" ? "image/jpeg"
                  : ext === "svg" ? "image/svg+xml"
                  : ext === "webp" ? "image/webp"
                  : "image/png";
                logoUrl = `data:${mime};base64,${fileBuffer.toString("base64")}`;
                break;
              }
            }
          }
        }
      }

      const templateData = {
        churchName,
        churchNameUpper: (churchName || "Iglesia").toUpperCase(),
        subtitle,
        location,
        worshipType,
        assignments,
        formattedDate,
        formattedTime,
        verse: verseSource,
        summary: (program as any).summary || "",
        logoUrl,
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
        "--allow-file-access-from-files",
      ],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Esperar a que las fuentes de Google se carguen
    await page.evaluateHandle("document.fonts.ready");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const pdfBuffer = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
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
