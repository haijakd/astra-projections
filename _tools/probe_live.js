// Read nav links, fonts and layout boxes from a live Wix page. Usage: node _tools/probe_live.js <url> [width]
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ channel: 'msedge', headless: true });
  const p = await b.newPage({ viewport: { width: Number(process.argv[3] || 1440), height: 900 } });
  await p.goto(process.argv[2], { waitUntil: 'load', timeout: 60000 });
  for (let y = 0; y < 9000; y += 400) { await p.mouse.wheel(0, 400); await p.waitForTimeout(100); }
  await p.waitForTimeout(1500);
  const r = await p.evaluate(() => {
    const out = {};
    out.links = [...new Set([...document.querySelectorAll('a[href]')].map(a => a.textContent.trim().slice(0, 30) + ' => ' + a.href))];
    const cs = e => getComputedStyle(e);
    out.bodyBg = cs(document.body).backgroundColor + ' ' + cs(document.body).backgroundImage.slice(0, 120);
    const bgs = [...document.querySelectorAll('[data-testid="bgMedia"], [id^="bgLayers"], #pageBackground, [data-testid="colorUnderlay"]')].slice(0, 12)
      .map(e => (e.id || e.dataset.testid) + ' ' + cs(e).backgroundColor + ' pos=' + cs(e).position + ' ' + JSON.stringify(e.getBoundingClientRect()).slice(0, 80));
    out.bgs = bgs;
    out.bgImgs = [...document.querySelectorAll('[id*="bgLayers"] img, #pageBackground img, wow-image img')].slice(0, 40)
      .map(i => { const r = i.getBoundingClientRect(); return Math.round(r.x) + ',' + Math.round(r.y + scrollY) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' ' + (i.alt || '') + ' ' + i.src.split('/').slice(-1)[0].slice(0, 60); });
    const fonts = {};
    document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,a,li').forEach(e => { if (e.childElementCount === 0 && e.textContent.trim()) { const k = cs(e).fontFamily.split(',')[0] + ' ' + cs(e).fontSize + ' ' + cs(e).fontWeight + ' ' + cs(e).fontStyle + ' ' + cs(e).color + ' ls=' + cs(e).letterSpacing; (fonts[k] = fonts[k] || []).push(e.textContent.trim().slice(0, 40)); } });
    out.fonts = Object.fromEntries(Object.entries(fonts).map(([k, v]) => [k, v.slice(0, 4)]));
    out.iframes = [...document.querySelectorAll('iframe')].map(f => f.src.slice(0, 120) + ' ' + Math.round(f.getBoundingClientRect().width) + 'x' + Math.round(f.getBoundingClientRect().height));
    out.boxes = [...document.querySelectorAll('section, [data-testid="columns"], [data-mesh-id] > div')].slice(0, 60).map(e => { const r = e.getBoundingClientRect(); return (e.id || e.className.toString().slice(0, 20)) + ' ' + Math.round(r.x) + ',' + Math.round(r.y + scrollY) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' bg=' + cs(e).backgroundColor; }).filter(s => !s.endsWith('rgba(0, 0, 0, 0)'));
    return out;
  });
  console.log(JSON.stringify(r, null, 1));
  await b.close();
})();
