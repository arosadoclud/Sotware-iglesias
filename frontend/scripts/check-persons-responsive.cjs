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

    let searches=[];
    const person={_id:'p',fullName:'María de los Ángeles Rodríguez de la Comunidad',phone:'8090000000',ministry:'Alabanza',status:'ACTIVE',priority:5,roles:[{roleId:'r',roleName:'Dirección'}]};
    await p.route('**/api/v1/**',r=>{const u=new URL(r.request().url());let data=[];if(u.pathname.endsWith('/auth/me'))data={id:'qa',role:'SUPER_ADMIN',churchId:'qa',permissions:[]};else if(u.pathname.endsWith('/persons')){searches.push(u.searchParams.get('search'));data=u.searchParams.get('search')==='Sin coincidencia'?[]:[person]}else if(u.pathname.endsWith('/ministries'))data=[{_id:'m',name:'Alabanza'}];else if(u.pathname.endsWith('/statuses'))data=[{_id:'s',name:'Activo',code:'ACTIVE',color:'green'}];else if(u.pathname.endsWith('/roles'))data=[{_id:'r',name:'Dirección'}];return r.fulfill({json:{success:true,data,total:Array.isArray(data)?data.length:0}})});
    await p.goto('http://127.0.0.1:5173/persons');
    await p.getByRole('heading',{name:'Nuestra comunidad'}).waitFor();
    const search=p.getByRole('textbox',{name:'Buscar personas por nombre'});
    await search.fill('Sin coincidencia');await p.getByText('No encontramos coincidencias').waitFor();
    assert(searches.includes('Sin coincidencia'));
    await p.getByRole('button',{name:'Limpiar búsqueda',exact:true}).click();
    await p.locator('p.person-name:visible, td span:visible').filter({hasText:person.fullName}).first().waitFor();
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Overflow '+width);
    await p.getByRole('button',{name:'Nueva persona',exact:true}).first().click();
    await p.getByRole('dialog').waitFor();
    assert(await p.getByLabel('Nombre Completo *').isVisible());
    await p.screenshot({path:'.cache/design-qa/persons-'+width+'.png'});
    assert.deepEqual(errors,[]);total++;await c.close();
  }await b.close();console.log(total+' viewports: search, clear, dialog and layout passed');
})().catch(e=>{console.error(e);process.exit(1)});

