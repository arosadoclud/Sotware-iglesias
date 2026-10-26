// Starts a local Socket.IO fixture on port 5000; requires the frontend on port 5173.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { Server } = require(require.resolve('socket.io', { paths: [require('node:path').resolve(__dirname, '../../backend')] }));
const http = require('node:http');
const assert = require('node:assert/strict');
const initialUser = { id: 'qa', email: 'qa@example.com', fullName: 'Administrador de prueba', role: 'SUPER_ADMIN', permissions: [], churchId: 'qa' };
(async () => {
  const server = http.createServer();
  const io = new Server(server, { cors: { origin: '*' } });
  await new Promise(resolve => server.listen(5000, resolve));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  let currentUser = { ...initialUser };
  let inactive = false;
  await page.addInitScript(user => {
    localStorage.setItem('auth-storage', JSON.stringify({ state: { user, accessToken: 'qa-only', isAuthenticated: true }, version: 0 }));
    localStorage.setItem('onboarding-state', JSON.stringify({ hasCompletedTour: true, hasSeenModule: {}, exploredFeatures: [] }));
    sessionStorage.setItem('splashSeen', 'true');
  }, initialUser);
  await page.route('**/api/v1/**', route => {
    const url = new URL(route.request().url());
    let data = [];
    if (url.pathname.endsWith('/auth/me')) {
      if (inactive) return route.fulfill({ status: 401, json: { success: false } });
      data = currentUser;
    } else if (url.pathname.endsWith('/stats')) data = { totalPersons: 7, totalActivities: 2, totalPrograms: 3, upcomingPrograms: 1, activeMinistries: 2, participationRate: 75, programsThisMonth: 3, ministryDistribution: [], topParticipants: [], monthlyTrend: [], recentActivity: [] };
    else if (url.pathname.includes('/programs/')) data = { _id: 'program1', church: { name: 'Iglesia Dios Fuerte' }, activityType: { id: 'act1', name: 'Culto general' }, programDate: '2026-11-01T12:00:00Z', defaultTime: '9:00 AM', assignments: [] };
    return route.fulfill({ json: { success: true, data, pagination: { total: 0 } } });
  });
  const connected = new Promise(resolve => io.once('connection', resolve));
  await page.goto('http://127.0.0.1:5173/programs/program1/flyer');
  await connected;
  await page.getByRole('heading', { name: 'Editor del programa' }).waitFor();
  currentUser = { ...initialUser, role: 'ADMIN', useCustomPermissions: true, permissions: ['programs:view'] };
  io.emit('session:changed');
  await page.waitForFunction(() => document.querySelector('.fe-save').disabled);
  assert.notEqual(await page.locator('fieldset.fe-panel-body').getAttribute('disabled'), null);
  assert.ok(page.url().endsWith('/programs/program1/flyer'));
  currentUser = { ...initialUser, role: 'VIEWER', useCustomPermissions: true, permissions: [] };
  io.emit('session:changed');
  await page.waitForURL('http://127.0.0.1:5173/');
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('auth-storage')).state.user.role === 'VIEWER');
  assert.equal(await page.getByRole('link', { name: 'Programas', exact: true }).count(), 0);
  currentUser = { ...initialUser, role: 'ADMIN', useCustomPermissions: true, permissions: ['programs:view', 'programs:generate'] };
  io.emit('session:changed');
  await page.getByRole('link', { name: 'Programas', exact: true }).waitFor();
  await page.getByRole('link', { name: 'Programas', exact: true }).click();
  await page.waitForURL('**/programs');
  currentUser = { ...currentUser, permissions: [] };
  io.emit('session:changed');
  await page.waitForURL('http://127.0.0.1:5173/');
  inactive = true;
  io.emit('session:changed');
  await page.waitForURL('**/login');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('auth-storage')).state.isAuthenticated), false);
  console.log('Live role update, menu grant, permission revocation/redirect and session deactivation passed without reload.');
  await browser.close();
  await new Promise(resolve => io.close(resolve));
})().catch(error => { console.error(error); process.exit(1); });
