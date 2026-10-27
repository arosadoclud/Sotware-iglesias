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
    let lastSaved = null;
    let lastPdf = null;
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
        data = lastSaved
          ? [
              {
                _id: "saved",
                ...lastSaved,
                finalContent: lastSaved.content,
                variablesUsed: lastSaved.customFields,
                createdAt: "2026-10-26T12:00:00Z",
              },
            ]
          : [];
      else if (u.pathname.endsWith("/letters/generate")) {
        saves++;
        lastSaved = r.request().postDataJSON();
        data = { _id: "saved" };
      } else if (u.pathname.endsWith("/letters/download-pdf")) {
        downloads++;
        lastPdf = r.request().postDataJSON();
        return r.fulfill({
          contentType: "application/pdf",
          body: Buffer.from("%PDF-1.4\n% Mock download for browser flow QA"),
        });
      }
      return r.fulfill({ json: { success: true, data } });
    });

    for (const variant of ["cooperative", "local", "general"]) {
      await p.goto("http://127.0.0.1:5173/letters");
      await p.getByRole("button", { name: "Nueva carta", exact: true }).click();
      await p
        .getByRole("button", {
          name:
            variant === "cooperative"
              ? "Permiso a Cooperativa"
              : "Permiso al destacamento",
          exact: false,
        })
        .click();
      await p.getByRole("button", { name: "Siguiente", exact: true }).click();
      await p.locator("#letter-nombre_iglesia").waitFor();
      if (variant !== "cooperative")
        await p.locator("#letter-modalidad_policial").selectOption(variant);
      await p.getByRole("button", { name: "Siguiente", exact: true }).click();
      assert.equal(
        await p.locator(".letter-paper").count(),
        0,
        "Missing fields must block preview",
      );
      const data = {
        nombre_iglesia: "IGLESIA DIOS FUERTE ARCA EVANGELICA",
        nombre_pastor: "Pastora de prueba",
        entidad_permiso: "Institución de prueba",
        fecha_carta: "26 de octubre de 2026",
        fecha_actividad: "12 de diciembre de 2026",
        hora_actividad: "2:00 P.M.",
        anos_servicio: "25",
        cantidad_iglesias: "15",
        tema_evento: "Encuentro comunitario",
      };
      for (const input of await p
        .locator('input[id^="letter-"]:visible')
        .all()) {
        const id = await input.getAttribute("id");
        await input.fill(data[id.replace("letter-", "")] || "Dato de prueba");
      }

      await p.getByRole("button", { name: "Siguiente", exact: true }).click();
      await p
        .locator(".letter-paper")
        .waitFor({ timeout: 5000 })
        .catch(async (e) => {
          console.log(
            "variant",
            variant,
            "width",
            width,
            await p.locator("body").innerText(),
          );
          await p.screenshot({ path: ".cache/design-qa/permission-error.png" });
          throw e;
        });
      assert(!(await p.locator(".letter-paper").innerText()).includes("{{"));
      if (variant === "general")
        assert((await p.locator(".letter-paper").innerText()).includes("Vía:"));
      assert.equal(
        await p.locator(".letter-support-signatures").count(),
        variant === "cooperative" ? 0 : 1,
      );
      assert(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await p.screenshot({
        path: ".cache/design-qa/permission-" + variant + "-" + width + ".png",
        fullPage: true,
      });
      const download = p.waitForEvent("download");
      await p
        .getByRole("button", { name: "Descargar PDF", exact: true })
        .click();
      await download;
      assert.equal(
        lastSaved.templateName,
        variant === "cooperative"
          ? "Permiso a Cooperativa"
          : "Permiso al destacamento",
      );
      assert.equal(lastSaved.recipientName, "Institución de prueba");
      assert.equal(
        lastSaved.customFields.modalidad_policial,
        variant === "general" ? "general" : "local",
      );
      assert.equal(
        lastPdf.churchData.tipoCarta,
        variant === "cooperative" ? "cooperative" : "police",
      );
      await p.getByRole("dialog").waitFor({ state: "hidden" });
      await p.getByTitle("Duplicar carta").click();
      await p.locator("#letter-entidad_permiso").waitFor();
      assert.equal(
        await p.locator("#letter-entidad_permiso").inputValue(),
        "Institución de prueba",
      );
      if (variant !== "cooperative")
        assert.equal(
          await p.locator("#letter-modalidad_policial").inputValue(),
          variant,
        );
      await p.keyboard.press("Escape");
      assert.deepEqual(errors, []);
    }
    await c.close();
  }
  await b.close();
  console.log(
    "PASS three permission variants at four widths: validation, preview, history metadata and download",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
