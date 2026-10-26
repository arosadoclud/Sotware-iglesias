// Run from the repository root with the frontend running on port 5173. APIs are mocked.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("assert/strict");
const fs = require("fs");
(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  let count = 0;
  for (const width of [320, 390, 768, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 950 },
      reducedMotion: "reduce",
    });
    await context.addInitScript(() =>
      sessionStorage.setItem("splashSeen:arca-2026-10-animada", "true"),
    );
    const page = await context.newPage();
    let submitted = 0;
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route("**/api/v1/**", (r) => {
      submitted++;
      return r.fulfill({ json: { success: true, data: { emailSent: true } } });
    });
    await page.goto("http://127.0.0.1:5173/register");
    await page.getByRole("heading", { name: "Crea tu cuenta" }).waitFor();
    await page.waitForTimeout(800);
    await page.screenshot({
      path: ".cache/design-qa/register-" + width + ".png",
      fullPage: true,
    });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 2,
      ),
    );
    await page
      .getByLabel("Nombre completo", { exact: true })
      .fill("Persona de prueba");
    await page
      .getByLabel("Correo electrónico", { exact: true })
      .fill("qa@example.test");
    await page
      .getByLabel("Contraseña", { exact: true })
      .fill("SeguraPrueba2026");
    await page
      .getByLabel("Confirmar contraseña", { exact: true })
      .fill("SeguraPrueba2026");
    await page.getByRole("button", { name: "Crear mi cuenta" }).click();
    await page.getByRole("heading", { name: "Revisa tu correo" }).waitFor();
    assert.ok(await page.getByText("72 horas", { exact: false }).count());
    assert.equal(submitted, 1);
    assert.equal(errors.length, 0);
    count++;
    await context.close();
    const ctx = await browser.newContext({
      viewport: { width, height: 950 },
      reducedMotion: "reduce",
    });
    await ctx.addInitScript(() => {
      sessionStorage.setItem("splashSeen:arca-2026-10-animada", "true");
      localStorage.setItem(
        "protected-modules-storage",
        JSON.stringify({
          state: {
            config: { enabled: false, modules: [], password: "" },
            autoLockMinutes: 30,
          },
          version: 0,
        }),
      );
      localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            user: {
              id: "qa",
              fullName: "Administrador de prueba",
              role: "SUPER_ADMIN",
              permissions: [],
              churchId: "qa",
            },
            accessToken: "local-qa",
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
    const p = await ctx.newPage();
    const category = {
      _id: "cat",
      name: "Ofrendas",
      type: "INCOME",
      code: "ING-02",
      color: "#c99a32",
    };
    const fund = {
      _id: "fund",
      name: "Fondo general",
      balance: 2500,
      isDefault: true,
    };
    const tx = {
      _id: "tx",
      type: "INCOME",
      category,
      fund,
      amount: 2500,
      date: "2026-10-26",
      description: "Ofrenda del domingo",
      paymentMethod: "CASH",
      approvalStatus: "APPROVED",
    };
    let lastSearch = "";
    await p.route("**/api/v1/**", (r) => {
      const u = new URL(r.request().url());
      let data = [];
      let pagination;
      if (u.pathname.endsWith("/auth/me"))
        data = {
          id: "qa",
          fullName: "Administrador",
          role: "SUPER_ADMIN",
          permissions: [],
          churchId: "qa",
        };
      else if (u.pathname.endsWith("/categories")) data = [category];
      else if (u.pathname.endsWith("/funds")) data = [fund];
      else if (u.pathname.endsWith("/transactions")) {
        data = [tx];
        pagination = { total: 25 };
        lastSearch = u.searchParams.get("search") || "";
      } else if (u.pathname.endsWith("/summary"))
        data = {
          totals: {
            income: 2500,
            expense: 800,
            balance: 1700,
            incomeCount: 1,
            expenseCount: 1,
          },
          byCategory: [{ ...category, total: 2500 }],
          pendingExpenses: 1,
        };
      return r.fulfill({ json: { success: true, data, pagination } });
    });
    await p.goto("http://127.0.0.1:5173/finances");
    await p.getByRole("heading", { name: "Finanzas de la iglesia" }).waitFor();
    await p.waitForTimeout(400);
    await p.screenshot({
      path: ".cache/design-qa/finances-" + width + ".png",
      fullPage: true,
    });
    assert.ok(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 2,
      ),
      "finance overflow " + width,
    );
    await p.getByPlaceholder("Buscar descripción o referencia").fill("ofrenda");
    await p.waitForTimeout(700);
    assert.equal(lastSearch, "ofrenda");
    await p.getByRole("button", { name: "Nuevo ingreso", exact: true }).click();
    await p.getByRole("dialog").waitFor();
    await p.screenshot({
      path: ".cache/design-qa/finance-dialog-" + width + ".png",
      fullPage: true,
    });
    assert.ok(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 2,
      ),
    );
    count++;
    await ctx.close();
  }
  console.log(count + " responsive and interaction scenarios passed");
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
