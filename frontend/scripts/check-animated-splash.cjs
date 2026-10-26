// Run from repository root, frontend on port 5173. No production requests.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("assert/strict");
(async () => {
  const b = await chromium.launch({ channel: "msedge", headless: true });
  for (const width of [320, 390, 1440]) {
    const c = await b.newContext({
      viewport: { width, height: width === 320 ? 568 : 900 },
      reducedMotion: width === 320 ? "reduce" : "no-preference",
    });
    const p = await c.newPage();
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto("http://127.0.0.1:5173/login?bienvenida=1");
    const bar = p.getByRole("progressbar", { name: "Progreso de bienvenida" });
    await bar.waitFor();
    const start = Number(await bar.getAttribute("aria-valuenow"));
    await p.waitForTimeout(1100);
    const middle = Number(await bar.getAttribute("aria-valuenow"));
    assert.ok(middle > start && middle < 100);
    assert.ok(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 2,
      ),
    );
    await p.screenshot({
      path: ".cache/design-qa/splash-animated-" + width + ".png",
      fullPage: true,
    });
    await p.getByRole("heading", { name: "Qué bueno verte" }).waitFor();
    assert.equal(
      await p.evaluate(() =>
        sessionStorage.getItem("splashSeen:arca-2026-10-animada"),
      ),
      "true",
    );
    assert.deepEqual(errors, []);
    await c.close();
  }
  const p = await b.newPage();
  await p.route("**/arca-logo.png", (r) => r.abort());
  await p.goto("http://127.0.0.1:5173/login?bienvenida=1");
  await p.getByRole("heading", { name: "Qué bueno verte" }).waitFor();
  await p.goto("http://127.0.0.1:5173/login?bienvenida=1");
  await p.getByRole("button", { name: "Entrar", exact: false }).first().click();
  await p.getByRole("heading", { name: "Qué bueno verte" }).waitFor();
  await b.close();
  console.log(
    "PASS progress increases, automatic completion, logo failure, skip, reduced motion and mobile widths",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
