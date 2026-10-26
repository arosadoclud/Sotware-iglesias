// Run from repository root with frontend on port 5173. All API requests are mocked.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("assert/strict");
(async () => {
  const b = await chromium.launch({ channel: "msedge", headless: true });
  for (const width of [320, 390, 768, 1440]) {
    const c = await b.newContext({
      viewport: { width, height: 950 },
      reducedMotion: "reduce",
    });
    await c.addInitScript(() => {
      sessionStorage.setItem("splashSeen:arca-2026-10-animada", "true");
      localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            user: {
              id: "qa",
              fullName: "Prueba",
              role: "SUPER_ADMIN",
              permissions: [],
              churchId: "qa",
            },
            accessToken: "qa",
            isAuthenticated: true,
          },
          version: 0,
        }),
      );
      localStorage.setItem(
        "onboarding-state",
        JSON.stringify({
          hasCompletedTour: true,
          hasSeenModule: {},
          exploredFeatures: [],
        }),
      );
    });
    const p = await c.newPage();
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    let saves = 0,
      downloads = 0;
    await p.route("**/api/v1/**", (r) => {
      const u = new URL(r.request().url());
      let data = [];
      if (u.pathname.endsWith("/auth/me"))
        data = {
          id: "qa",
          fullName: "Prueba",
          role: "SUPER_ADMIN",
          permissions: [],
          churchId: "qa",
        };
      else if (u.pathname.endsWith("/secretary/stats"))
        data = {
          childPresentations: 4,
          weddings: 2,
          baptisms: 3,
          conversions: 1,
          boardMinutes: 2,
          preachers: 5,
        };
      else if (u.pathname.includes("/secretary/"))
        data = [
          {
            _id: "r",
            childName: "María Alejandra Rodríguez",
            sexo: "Niña",
            fatherName: "José Rodríguez",
            presentationDate: "2026-10-26T12:00:00Z",
            fullName: "Persona de prueba",
          },
        ];
      else if (u.pathname.endsWith("/letters/generated"))
        data = [
          {
            _id: "letter",
            templateName: "Invitación",
            recipientName: "Comunidad de prueba",
            finalContent: "Que la paz esté con ustedes.",
            createdAt: "2026-10-26T12:00:00Z",
          },
        ];
      else if (u.pathname.endsWith("/letters/generate")) {
        saves++;
        data = { _id: "saved" };
      } else if (u.pathname.endsWith("/letters/download-pdf")) {
        downloads++;
        return r.fulfill({ status: 500, json: { message: "QA PDF failure" } });
      }
      return r.fulfill({ json: { success: true, data } });
    });
    async function shot(name) {
      await p.waitForTimeout(650);
      assert.ok(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 2,
        ),
        name + " " + width,
      );
      await p.screenshot({
        path: ".cache/design-qa/" + name + "-" + width + ".png",
        fullPage: true,
      });
    }
    await p.goto("http://127.0.0.1:5173/secretaria");
    await p.getByRole("heading", { name: "Secretaría", exact: true }).waitFor();
    await shot("secretary");
    assert.ok(
      await p
        .locator(".secretary-stats")
        .innerText()
        .then((t) => t.includes("4")),
    );
    await p.getByRole("button", { name: "Nuevo niño", exact: true }).click();
    await p.getByRole("dialog").waitFor();
    await shot("secretary-modal");
    await p.getByRole("button", { name: "Cancelar", exact: true }).click();
    await p.goto("http://127.0.0.1:5173/pastoral");
    await p
      .getByRole("heading", { name: "Área pastoral", exact: true })
      .waitFor();
    await shot("pastoral");
    await p.goto("http://127.0.0.1:5173/letters");
    await p
      .getByRole("heading", { name: "Cartas de la iglesia", exact: true })
      .waitFor();
    await shot("letters");
    await p.getByLabel("Buscar cartas").fill("inexistente");
    assert.equal(await p.getByTitle("Ver carta").count(), 0);
    await p.getByLabel("Buscar cartas").fill("");
    await p.getByRole("button", { name: "Nueva carta", exact: true }).click();
    await p
      .getByRole("button", { name: "Invitación a Iglesia", exact: false })
      .click();
    await p.getByRole("button", { name: "Siguiente", exact: true }).click();
    await p
      .locator("#letter-nombre_iglesia")
      .fill("Iglesia Dios Fuerte Arca Evangélica");
    await p
      .getByLabel("Nombre del Pastor/a *", { exact: true })
      .fill("Pastor de prueba");
    await p.locator("#letter-iglesia_destinatario").fill("Comunidad de prueba");
    await p.locator("#letter-pastor_destinatario").fill("Pastor invitado");
    await p.locator("#letter-fecha_actividad").fill("1 de noviembre de 2026");
    await p.locator("#letter-tema_evento").fill("Unidos para servir");
    await shot("letter-fields");
    await p.getByRole("button", { name: "Siguiente", exact: true }).click();
    await p.locator(".letter-paper").waitFor();
    await shot("letter-preview");
    assert.ok(
      await p
        .locator(".letter-paper img")
        .evaluate((e) => e.complete && e.naturalWidth > 0),
    );
    await p.getByRole("button", { name: "Descargar PDF", exact: true }).click();
    await p.waitForTimeout(350);
    await p.getByRole("button", { name: "Descargar PDF", exact: true }).click();
    await p.waitForTimeout(350);
    assert.equal(saves, 1);
    assert.equal(downloads, 2);
    assert.equal(await p.getByRole("dialog").count(), 1);
    assert.deepEqual(errors, []);
    await c.close();
  }
  await b.close();
  console.log(
    "PASS four viewport sizes: secretary, modal, pastoral, letter wizard/preview, search, PDF retry without duplicate save",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
