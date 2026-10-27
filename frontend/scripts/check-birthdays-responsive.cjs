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

    let fail = false,
      saves = 0;
    let people = [
      {
        _id: "1",
        fullName: "María Alejandra Rodríguez de la Comunidad",
        phone: "18090000000",
        ministry: "Alabanza",
        birthDate: "1990-10-26",
        daysUntil: 0,
        status: "ACTIVE",
      },
      {
        _id: "2",
        fullName: "José Ramírez",
        birthDate: "1990-10-30",
        daysUntil: 4,
        status: "ACTIVE",
      },
      {
        _id: "3",
        fullName: "Ana Fernández",
        birthDate: null,
        daysUntil: null,
        status: "ACTIVE",
      },
    ];
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
      else if (u.pathname.includes("/birthdays")) {
        if (r.request().method() === "POST") {
          saves++;
          if (fail)
            return r.fulfill({ status: 500, json: { message: "QA failure" } });
          people.push({
            _id: "4",
            ...r.request().postDataJSON(),
            daysUntil: null,
            status: "ACTIVE",
          });
        }
        data = people;
      }
      return r.fulfill({ json: { success: true, data } });
    });
    await p.goto("http://127.0.0.1:5173/cumpleanos");
    await p.getByRole("heading", { name: "Cumpleaños", exact: true }).waitFor();
    await p.locator('td[data-label="Persona"]').first().waitFor();
    assert.equal(await p.locator('td[data-label="Persona"]').count(), 3);
    await p.getByLabel("Filtrar cumpleaños").selectOption("today");
    assert.equal(await p.locator('td[data-label="Persona"]').count(), 1);
    await p.getByLabel("Filtrar cumpleaños").selectOption("missing");
    assert.equal(await p.locator('td[data-label="Persona"]').count(), 1);
    await p.getByLabel("Filtrar cumpleaños").selectOption("all");
    await p.getByLabel("Buscar cumpleaños").fill("José");
    assert.equal(await p.locator('td[data-label="Persona"]').count(), 1);
    await p.getByLabel("Buscar cumpleaños").fill("");
    assert(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "Overflow " + width,
    );
    await p.waitForTimeout(500);
    await p.screenshot({
      path: ".cache/design-qa/birthdays-" + width + ".png",
      fullPage: true,
    });
    await p.getByRole("button", { name: "Nuevo miembro", exact: true }).click();
    await p
      .getByLabel("Nombre completo *", { exact: true })
      .fill("Persona de prueba");
    await p
      .getByLabel("Fecha de cumpleaños", { exact: true })
      .fill("2000-11-02");
    fail = true;
    await p.getByRole("button", { name: "Guardar", exact: true }).click();
    await p.getByText("Error al añadir la persona").waitFor();
    assert.equal(
      await p.getByLabel("Nombre completo *").inputValue(),
      "Persona de prueba",
    );
    fail = false;
    await p.getByRole("button", { name: "Guardar", exact: true }).click();
    await p.getByRole("dialog").waitFor({ state: "hidden" });
    assert.equal(saves, 2);
    await p
      .getByRole("button", { name: "Editar José Ramírez", exact: true })
      .click();
    assert.equal(
      await p.getByLabel("Nombre completo *").inputValue(),
      "José Ramírez",
    );
    await p.keyboard.press("Escape");
    await p.getByRole("dialog").waitFor({ state: "hidden" });
    assert.deepEqual(errors, []);
    total++;
    await c.close();
  }
  await b.close();
  console.log(
    total +
      " widths: birthday filters/search, responsive layout, failed-save retry and editing passed",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
