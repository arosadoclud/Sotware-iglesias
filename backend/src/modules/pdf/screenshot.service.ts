import path from "path";
import fs from "fs";
import puppeteer from "puppeteer";
import { pdfService, PdfGenerationOptions } from "./pdf.service";
import { format } from "date-fns";

/**
 * SCREENSHOT SERVICE
 * Genera capturas de pantalla de los flyers de programas publicados
 * para mostrar previews visuales en el dashboard
 */

export interface ScreenshotResult {
  url: string;
  filename: string;
  generatedAt: Date;
}

export class ScreenshotService {
  private screenshotsDir = path.join(process.cwd(), "uploads", "screenshots");

  constructor() {
    // Crear directorio de screenshots si no existe
    if (!fs.existsSync(this.screenshotsDir)) {
      fs.mkdirSync(this.screenshotsDir, { recursive: true });
    }
  }

  /**
   * Genera screenshot del flyer de un programa y lo guarda
   * @param options - Mismas opciones que PdfGenerationOptions
   * @returns URL relativa del screenshot guardado
   */
  async generateScreenshot(options: PdfGenerationOptions): Promise<ScreenshotResult> {
    // Usar el mismo HTML que el PDF (flyer style)
    const html = pdfService.buildHtml({ ...options, flyerStyle: true });
    const { program, church } = options;

    // Configuración para Render/producción (misma que PDF)
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
    
    const browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--allow-file-access-from-files",
        "--single-process",
        "--no-zygote",
      ],
    });

    try {
      const page = await browser.newPage();
      
      // Configurar viewport para screenshot (ratio vertical típico de flyer)
      // 1200x1600px = ratio 3:4 (similar a carta)
      await page.setViewport({
        width: 1200,
        height: 1600,
        deviceScaleFactor: 1,
      });

      await page.setContent(html, { waitUntil: "networkidle0" });

      // Esperar a que las fuentes de Google se carguen
      await page.evaluateHandle("document.fonts.ready");
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Generar screenshot como PNG
      const screenshotBuffer = await page.screenshot({
        type: "png",
        fullPage: true,
        omitBackground: false,
      });

      // Generar filename único basado en programId y fecha
      const dateStr = format(new Date(program.programDate), "yyyy-MM-dd");
      const programId = (program as any)._id || "unknown";
      const filename = `program-${programId}-${dateStr}.png`;
      
      // Guardar screenshot
      const filePath = path.join(this.screenshotsDir, filename);
      fs.writeFileSync(filePath, screenshotBuffer);

      await browser.close();

      // Retornar URL relativa para acceso HTTP
      return {
        url: `/uploads/screenshots/${filename}`,
        filename,
        generatedAt: new Date(),
      };
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  /**
   * Elimina un screenshot del sistema de archivos
   * @param filename - Nombre del archivo a eliminar
   */
  deleteScreenshot(filename: string): void {
    const filePath = path.join(this.screenshotsDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  /**
   * Limpia screenshots huérfanos (sin programa asociado)
   * Útil para mantenimiento
   */
  async cleanupOrphanScreenshots(validProgramIds: string[]): Promise<number> {
    const files = fs.readdirSync(this.screenshotsDir);
    let deleted = 0;

    for (const file of files) {
      if (!file.endsWith(".png")) continue;
      
      // Extraer programId del filename (format: program-{id}-{date}.png)
      const match = file.match(/^program-([a-f0-9]+)-/);
      if (match) {
        const programId = match[1];
        if (!validProgramIds.includes(programId)) {
          this.deleteScreenshot(file);
          deleted++;
        }
      }
    }

    return deleted;
  }
}

export const screenshotService = new ScreenshotService();
