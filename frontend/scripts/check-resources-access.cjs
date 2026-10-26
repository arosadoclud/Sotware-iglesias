// Run from repository root with frontend on port 5173. All API responses are simulated.
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
        "onboarding-state",
        JSON.stringify({
          hasCompletedTour: true,
          hasSeenModule: {},
          exploredFeatures: [],
        }),
      );
    });
    const p = await c.newPage();
    let seriesRequests = 0,
      searchRequest = "";
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
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
      else if (u.pathname.endsWith("/bible-studies/meta/series")) {
        seriesRequests++;
        data = ["La vida de fe"];
      } else if (u.pathname.endsWith("/bible-studies")) {
        searchRequest = u.searchParams.get("search") || "";
        data =
          searchRequest === "sin resultados"
            ? []
            : [
                {
                  _id: "s",
                  title: "La fe que rompe las barreras",
                  theme: "Hebreos 1:1",
                  verse: "La fe es el motor del creyente",
                  description:
                    "Un estudio para fortalecer nuestra vida espiritual.",
                  teacher: "Pastora de prueba",
                  series: "La vida de fe",
                  pdfUrl: "/qa.pdf",
                  fileSize: 20480,
                  downloadCount: 7,
                  studyDate: "2026-02-23T12:00:00Z",
                },
              ];
      } else if (u.pathname.endsWith("/activities"))
        data = [
          {
            _id: "a",
            name: "Culto evangelístico general",
            daysOfWeek: [0],
            defaultTime: "09:00",
            roleConfig: [
              {
                sectionOrder: 1,
                sectionName: "Dirección",
                role: { id: "r", name: "Dirección" },
                peopleNeeded: 1,
              },
            ],
          },
        ];
      return r.fulfill({ json: { success: true, data } });
    });
    async function shot(name) {
      await p.waitForTimeout(600);
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
    await p.goto("http://127.0.0.1:5173/estudios-biblicos");
    await p
      .getByRole("heading", { name: "La fe que rompe las barreras" })
      .waitFor();
    await shot("bible-library");
    const beforeSearchSeries = seriesRequests;
    await p.getByRole("button", { name: "Filtros", exact: true }).click();
    await p.getByLabel("Mes", { exact: true }).selectOption("2");
    await shot("bible-filters");
    await p.getByLabel("Buscar estudios").fill("sin resultados");
    await p
      .getByRole("heading", { name: "No encontramos ese recurso" })
      .waitFor();
    assert.equal(searchRequest, "sin resultados");
    assert.equal(seriesRequests, beforeSearchSeries);
    await p.getByRole("button", { name: "Ver todos los estudios" }).click();
    await p
      .getByRole("heading", { name: "La fe que rompe las barreras" })
      .waitFor();
    await p.goto("http://127.0.0.1:5173/letters");
    await p
      .getByRole("heading", { name: "Aquí comienza tu correspondencia" })
      .waitFor();
    await shot("letters-empty");
    await p.getByRole("button", { name: "Crear mi primera carta" }).click();
    await p.getByRole("dialog").waitFor();
    await p.keyboard.press("Escape");
    await p.goto("http://127.0.0.1:5173/activities");
    await p
      .getByRole("heading", { name: "Actividades de la iglesia" })
      .waitFor();
    await shot("activities-new");
    await p
      .getByRole("button", { name: "Nueva actividad", exact: true })
      .click();
    await p.getByRole("dialog").waitFor();
    await shot("activity-new-dialog");
    await p.keyboard.press("Escape");
    await p.evaluate(async () => {
      const React = (await import("/node_modules/.vite/deps/react.js")).default;
      const { createRoot } = (
        await import("/node_modules/.vite/deps/react-dom_client.js")
      ).default;
      const { ModuleUnlockModal } =
        await import("/src/components/ui/ModuleUnlockModal.tsx");
      const { useProtectedModulesStore } =
        await import("/src/store/protectedModulesStore.ts");
      useProtectedModulesStore.getState().setPassword("qa-access");
      let el = document.createElement("div");
      document.body.replaceChildren(el);
      let root = createRoot(el);
      window.qaUnlock = 0;
      window.qaClose = 0;
      root.render(
        React.createElement(ModuleUnlockModal, {
          isOpen: true,
          module: "users",
          onUnlock: () => window.qaUnlock++,
          onClose: () => window.qaClose++,
        }),
      );
    });
    await p.getByRole("dialog").waitFor();
    await shot("unlock-new");
    const input = p.getByLabel("Contraseña de acceso", { exact: true });
    await input.fill("incorrecta");
    await p.getByRole("button", { name: "Desbloquear", exact: true }).click();
    await p.getByRole("alert").waitFor();
    await p
      .getByRole("button", { name: "Mostrar contraseña", exact: true })
      .click();
    assert.equal(await input.getAttribute("type"), "text");
    await input.fill("qa-access");
    await p.getByRole("button", { name: "Desbloquear", exact: true }).click();
    await p.getByRole("heading", { name: "Acceso listo" }).waitFor();
    await p.waitForTimeout(250);
    assert.equal(await p.evaluate(() => window.qaUnlock), 1);
    assert.deepEqual(errors, []);
    await c.close();
  }
  await b.close();
  console.log(
    "PASS four widths: Bible library/filter/search, letter empty CTA, activities modal, protected access error/toggle/unlock",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
