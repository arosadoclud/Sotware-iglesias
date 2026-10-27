// Run from repository root with frontend on port 5173. API responses are mocked; no real account changes.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("assert/strict");
(async () => {
  const b = await chromium.launch({ channel: "msedge", headless: true });
  let total = 0;
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
              email: "qa@example.test",
              fullName: "Persona de prueba",
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
        "protected-modules-storage",
        JSON.stringify({
          state: {
            config: { enabled: true, password: "qa-only", modules: [] },
            autoLockMinutes: 30,
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

    await p.addInitScript(() => {
      window.qaCopied = "";
      window.qaOpened = "";
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (value) => {
            window.qaCopied = value;
          },
        },
      });
      window.open = (url) => {
        window.qaOpened = url;
        return null;
      };
    });
    let uploads = 0,
      creates = 0,
      created = null;
    await p.route("**/api/v1/**", (r) => {
      const u = new URL(r.request().url());
      let data = [];
      if (u.pathname.endsWith("/auth/me"))
        data = {
          id: "qa",
          role: "SUPER_ADMIN",
          permissions: [],
          churchId: "qa",
        };
      else if (u.pathname.endsWith("/churches/mine"))
        data = { name: "Iglesia de prueba" };
      else if (u.pathname.endsWith("/events/upload")) {
        uploads++;
        data = { filename: "qa.png", url: "https://example.test/qa.png" };
      } else if (
        u.pathname.endsWith("/events") &&
        r.request().method() === "POST"
      ) {
        creates++;
        created = r.request().postDataJSON();
        if (creates === 1)
          return r.fulfill({ status: 500, json: { message: "QA failure" } });
        data = { _id: "saved" };
      }
      return r.fulfill({ json: { success: true, data } });
    });
    await p.goto("http://127.0.0.1:5173/flyer-assistant");
    await p
      .getByRole("heading", { name: "Asistente de flyers", exact: true })
      .waitFor();
    await p
      .getByRole("button", {
        name: "Copiar prompt y abrir ChatGPT",
        exact: true,
      })
      .click();
    assert.equal(
      await p.evaluate(() => window.qaOpened),
      "",
      "Incomplete brief must not open ChatGPT",
    );
    await p
      .getByLabel("Nombre de la iglesia *", { exact: true })
      .fill("Iglesia Dios Fuerte");
    await p.getByLabel("Tema *", { exact: true }).fill("Noche de esperanza");
    await p.getByLabel("Fecha *", { exact: true }).fill("2026-12-12");
    await p.getByLabel("Hora *", { exact: true }).fill("19:00");
    await p
      .getByLabel("Lugar o dirección *", { exact: true })
      .fill("Templo principal");
    const add = p.getByRole("button", {
      name: "Añadir predicador o expositor",
      exact: true,
    });
    await add.click();
    await add.click();
    await p
      .getByLabel("Nombre del participante *")
      .nth(0)
      .fill("María Rodríguez");
    await p.getByLabel("Nombre del participante *").nth(1).fill("José Ramírez");
    const png = {
      name: "predicadora.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=",
        "base64",
      ),
    };
    await p.locator(".fa-speaker input[type=file]").first().setInputFiles(png);
    await p.getByRole("img", { name: "Foto de María Rodríguez" }).waitFor();
    await p
      .getByRole("button", {
        name: "Copiar prompt y abrir ChatGPT",
        exact: true,
      })
      .click();
    assert.equal(
      await p.evaluate(() => window.qaOpened),
      "https://chatgpt.com/",
    );
    const copied = await p.evaluate(() => window.qaCopied);
    assert(copied.includes("María Rodríguez"));
    assert(copied.includes("predicadora.png"));
    assert(copied.includes("sin foto; presentar únicamente"));
    assert.equal(uploads, 0, "Photos must stay local");
    await p
      .getByRole("button", { name: "Guardar borrador", exact: true })
      .click();
    const draft = await p.evaluate(() =>
      localStorage.getItem("flyer-assistant:qa:qa"),
    );
    assert(draft.includes("María Rodríguez"));
    assert(!draft.includes("blob:"));
    assert(!draft.includes("predicadora.png"));
    await p
      .getByRole("button", { name: "Cargar borrador", exact: true })
      .click();
    assert.equal(await p.locator(".fa-photo img").count(), 0);
    assert.equal(await p.getByLabel("Nombre del participante *").count(), 2);
    await p.waitForTimeout(500);
    assert(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "Overflow " + width,
    );
    await p.screenshot({
      path: ".cache/design-qa/flyer-assistant-" + width + ".png",
      fullPage: true,
    });
    await p
      .locator("section.fa-panel input[type=file]")
      .setInputFiles({ ...png, name: "flyer.png" });
    await p
      .getByRole("img", { name: "Flyer terminado seleccionado", exact: true })
      .waitFor();
    await p
      .getByRole("button", { name: "Guardar en Eventos", exact: true })
      .click();
    await p
      .getByText("No se pudo guardar el flyer. Puedes volver a intentarlo.")
      .waitFor();
    await p
      .getByRole("button", { name: "Guardar en Eventos", exact: true })
      .click();
    await p
      .getByRole("button", { name: "Guardado en Eventos", exact: true })
      .waitFor();
    assert.equal(uploads, 1);
    assert.equal(creates, 2);
    assert.equal(created.isActive, false);
    assert.equal(created.title, "Noche de esperanza");
    assert(created.imageUrl.includes("/uploads/events/qa.png"));
    assert.deepEqual(errors, []);
    total++;
    await c.close();
  }
  await b.close();
  console.log(
    total +
      " widths: flyer brief, optional photos, manual ChatGPT handoff, scoped draft, inactive event save and retry passed",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
