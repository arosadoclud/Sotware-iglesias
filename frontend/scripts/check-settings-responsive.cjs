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
    let saves = 0;
    let church = {
      _id: "qa",
      name: "Iglesia Dios Fuerte Arca Evangélica",
      address: {
        street: "Calle de prueba",
        city: "Santo Domingo",
        state: "Distrito Nacional",
      },
      phone: "8090000000",
      email: "qa@example.test",
      website: "https://example.test",
      pastorName: "Pastor de prueba",
    };
    await p.route("**/api/v1/**", (r) => {
      const u = new URL(r.request().url());
      let data = [];
      if (u.pathname.endsWith("/auth/me"))
        data = {
          id: "qa",
          email: "qa@example.test",
          fullName: "Persona de prueba",
          role: "SUPER_ADMIN",
          permissions: [],
          churchId: "qa",
        };
      else if (u.pathname.endsWith("/churches/mine")) {
        if (r.request().method() === "PUT") {
          saves++;
          if (saves === 1)
            return r.fulfill({ status: 500, json: { message: "QA failure" } });
          church = r.request().postDataJSON();
        }
        data = church;
      } else if (u.pathname.endsWith("/roles"))
        data = [
          {
            _id: "r",
            name: "Dirección",
            description: "Coordina el encuentro de la comunidad",
            color: "#b99849",
          },
        ];
      else if (u.pathname.endsWith("/auth/callmebot"))
        data = {
          configured: false,
          hasApiKey: false,
          additionalRecipients: [],
        };
      return r.fulfill({ json: { success: true, data } });
    });
    async function check(name) {
      await p.waitForTimeout(600);
      const layout = await p.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        width: innerWidth,
      }));
      assert.ok(
        layout.scroll <= layout.width + 2,
        name + " " + width + " " + JSON.stringify(layout),
      );
      await p.screenshot({
        path: ".cache/design-qa/settings-" + name + "-" + width + ".png",
        fullPage: true,
      });
      total++;
    }
    await p.goto("http://127.0.0.1:5173/settings");
    await p
      .getByRole("heading", { name: "Configuración", exact: true })
      .waitFor();
    await p
      .getByLabel("Nombre de la Iglesia", { exact: true })
      .fill("Iglesia actualizada de prueba");
    await p.locator(".settings-unsaved").waitFor();
    await check("general-dirty");
    await p.locator(".settings-unsaved button").click();
    await p.waitForTimeout(300);
    assert.equal(
      await p.getByLabel("Nombre de la Iglesia", { exact: true }).inputValue(),
      "Iglesia actualizada de prueba",
    );
    assert.equal(await p.locator(".settings-unsaved").count(), 1);
    await p.locator(".settings-unsaved button").click();
    await p.locator(".settings-unsaved").waitFor({ state: "hidden" });
    assert.equal(saves, 2);
    for (const [id, label] of [
      ["branding", "Marca"],
      ["roles", "Roles"],
      ["profile", "Mi Perfil"],
      ["security", "Seguridad"],
      ["advanced", "Avanzado"],
    ]) {
      if (width <= 800)
        await p
          .getByLabel("¿Qué deseas configurar?", { exact: true })
          .selectOption(id);
      else
        await p
          .locator(".settings-nav-items button")
          .filter({ has: p.getByText(label, { exact: true }) })
          .click();
      await p.getByRole("region", { name: label, exact: true }).waitFor();
      await check(id);
      if (id === "roles") {
        await p.getByRole("button", { name: "Nuevo Rol", exact: true }).click();
        await p.getByRole("dialog").waitFor();
        await check("role-dialog");
        await p.keyboard.press("Escape");
      }
      if (id === "profile") {
        assert.equal(
          await p
            .getByLabel("Clave de CallMeBot", { exact: true })
            .getAttribute("type"),
          "password",
        );
        assert.equal(
          await p.locator(".settings-whatsapp-guide").getAttribute("open"),
          null,
        );
      }
    }
    assert.deepEqual(errors, []);
    await c.close();
  }
  await b.close();
  console.log(
    "PASS " +
      total +
      " settings responsive views and failed-save/retry checks; all APIs mocked",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
