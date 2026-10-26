// Start the frontend on http://127.0.0.1:5173, then run with Playwright installed.
// Uses simulated API responses only; never creates production data.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const outputDir = process.env.QA_OUTPUT_DIR || path.resolve(__dirname, '../../.cache/design-qa');
require('node:fs').mkdirSync(outputDir, { recursive: true });
const activity = { _id: 'activity1', name: 'Culto de oración y acción de gracias', daysOfWeek: [0, 3], defaultTime: '7:00 PM', roleConfig: [{ sectionOrder: 1, sectionName: 'Apertura y oración' }] };
const program = { _id: 'program1', activityType: { id: 'activity1', name: activity.name }, programDate: '2026-11-01T12:00:00Z', defaultTime: '7:00 PM', status: 'DRAFT', church: { name: 'IGLESIA DIOS FUERTE ARCA EVANGÉLICA', location: 'Santo Domingo' }, assignments: [{ sectionOrder: 1, sectionName: 'Apertura', roleName: 'Oración de apertura', person: { id: 'person1', name: 'María Alejandra Rodríguez' }, backup: { name: 'José Rodríguez' } }] };
const people = [{ _id: 'person1', fullName: 'María Alejandra Rodríguez', status: 'ACTIVO', roles: [] }];
const stats = { coveragePercent: 100, totalAssigned: 1, totalNeeded: 1, personsUsed: 1 };
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const results = [];
  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await context.addInitScript(() => {
      localStorage.setItem('auth-storage', JSON.stringify({ state: { user: { id: 'qa', fullName: 'Administrador de prueba', role: 'SUPER_ADMIN', permissions: [], churchId: 'qa' }, accessToken: 'local-qa-only', isAuthenticated: true }, version: 0 }));
      localStorage.setItem('onboarding-state', JSON.stringify({ hasCompletedTour: true, hasSeenModule: {}, exploredFeatures: [] }));
      sessionStorage.setItem('splashSeen:arca-2026-10', 'true');
    });
    const page = await context.newPage();
    let failSave = false;
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/api/v1/**', async route => {
      const url = new URL(route.request().url());
      if (failSave && route.request().method() === 'PUT' && url.pathname.includes('/programs/')) {
        return route.fulfill({ status: 500, json: { success: false, message: 'QA save failure' } });
      }
      let body = { success: true, data: [] };
      if (url.pathname.includes('/activities')) body.data = [activity];
      else if (url.pathname.includes('/persons')) body.data = people;
      else if (url.pathname.includes('/churches')) body.data = program.church;
      else if (url.pathname.endsWith('/generate-batch')) body.data = { generated: 1, errors: 0, results: [{ success: true, programId: 'program1' }] };
      else if (url.pathname.endsWith('/generate')) { body.data = program; body.meta = { stats }; }
      else if (url.pathname.includes('/preview')) body.data = { assignments: program.assignments, stats };
      else if (url.pathname === '/api/v1/programs') { body.data = [program]; body.pagination = { total: 1 }; }
      else if (url.pathname.includes('/programs/')) body.data = program;
      await route.fulfill({ json: body });
    });
    async function check(name) {
      await page.waitForTimeout(350);
      const overflow = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, offenders: [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > innerWidth + 2 && e.getBoundingClientRect().width > 0).slice(0, 6).map(e => e.tagName + '.' + String(e.className).slice(0, 100)) }));
      results.push({ width, name, ...overflow });
      assert.ok(overflow.scroll <= width + 2, `${width} ${name}: ${JSON.stringify(overflow)}`);
      await page.screenshot({ path: path.join(outputDir, `${width}-${name}.png`), fullPage: true });
    }
    await page.goto('http://127.0.0.1:5173/programs/generate');
    await page.getByRole('heading', { name: '¿Qué vas a organizar?' }).waitFor();
    await check('actividad');
    await page.getByRole('button', { name: 'Continuar' }).click();
    assert.equal(await page.getByRole('button', { name: 'Continuar' }).isDisabled(), true);
    await page.getByLabel('Fecha del Programa', { exact: true }).fill('2026-11-01');
    await check('fechas');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await check('revision');
    await page.getByRole('button', { name: 'Generar Programa', exact: true }).click();
    await page.getByText('Programa generado', { exact: true }).waitFor();
    assert.ok(page.url().endsWith('/programs/generate'));
    await check('resultado');
    await page.goto('http://127.0.0.1:5173/programs/program1/flyer');
    await page.getByRole('button', { name: /Guardar/ }).first().waitFor();
    await check('editor-preview');
    if (await page.getByRole('button', { name: /Editar programa/ }).first().isVisible()) {
      await page.getByRole('button', { name: /Editar programa/ }).first().click();
      assert.equal(await page.locator('.fe-preview-panel').isVisible(), false);
      await check('editor-config');
    }
    assert.equal(await page.locator('#churchName').count(), 1);
    const logo = page.locator('img[src="/arca-logo.png"]:visible').first();
    await logo.waitFor();
    assert.ok(await logo.evaluate(img => img.complete && img.naturalWidth > 0));
    await page.getByLabel('Ubicación', { exact: true }).fill('Santo Domingo, sede principal');
    await page.getByText('Cambios sin guardar', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await page.getByText('Todos los cambios guardados', { exact: true }).waitFor();
    failSave = true;
    await page.getByLabel('Ubicación', { exact: true }).fill('Otra sede');
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await page.getByText('No se pudieron guardar los cambios. Inténtalo de nuevo.', { exact: true }).waitFor();
    assert.equal(await page.getByText('Cambios sin guardar', { exact: true }).isVisible(), true);
    failSave = false;
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await page.getByText('Todos los cambios guardados', { exact: true }).waitFor();
    await page.goto('http://127.0.0.1:5173/programs/batch-review?ids=program1');
    await page.getByRole('heading', { name: 'Programas Generados por Lote' }).waitFor();
    await check('lote');
    await page.goto('http://127.0.0.1:5173/programs');
    await page.getByRole('heading', { name: 'Programas', exact: true }).waitFor();
    await check('listado');
    if (width < 1024) {
      await page.getByRole('button', { name: 'Abrir menú de navegación' }).click();
      await page.getByRole('dialog', { name: 'Navegación principal' }).waitFor();
      assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
      assert.equal(await page.getByRole('button', { name: 'Abrir menú de navegación' }).getAttribute('aria-expanded'), 'false');
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
  await browser.close();
  require('node:fs').writeFileSync(path.join(outputDir, 'results.json'), JSON.stringify(results, null, 2));
  console.log(`Passed ${results.length} responsive checks and single-program generation at six viewport widths.`);
})().catch(e => { console.error(e); process.exit(1); });
