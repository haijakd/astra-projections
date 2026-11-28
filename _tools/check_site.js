// Serve site/ locally, load each page in headless Edge, report broken requests and console errors, save full-page shots.
const { chromium } = require('playwright-core');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(process.argv[2]), OUT = path.resolve(process.argv[3]);
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.pdf': 'application/pdf', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => {
  const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0].split('#')[0]) === '/' ? 'index.html' : decodeURIComponent(q.url.split('?')[0]));
  // like Cloudflare Pages: /services serves services.html
  const file = path.extname(p) ? p : p + '.html';
  fs.readFile(file, (e, b) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' }); r.end(b); } });
}).listen(8765);
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  let bad = 0;
  for (const [vw, tag] of [[1440, 'desk'], [820, 'tablet'], [390, 'mobile']]) {
    const ctx = await browser.newContext({ viewport: { width: vw, height: 900 } });
    for (const pg of ['index.html', 'services.html', 'contact.html']) {
      const page = await ctx.newPage();
      const errs = [];
      page.on('response', r => { if (r.url().startsWith('http://localhost') && r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
      page.on('pageerror', e => errs.push('JS ' + e.message));
      await page.goto('http://localhost:8765/' + pg, { waitUntil: 'load' });
      for (let y = 0; y < 6000; y += 500) { await page.mouse.wheel(0, 500); await page.waitForTimeout(80); }
      await page.waitForTimeout(800);
      const broken = await page.evaluate(() => [...document.images].filter(i => i.getAttribute('src') && !i.dataset.src && (!i.complete || i.naturalWidth === 0)).map(i => i.src));
      errs.push(...broken.map(b => 'IMG ' + b));
      const wix = (await page.content()).match(/wix(static|site)|parastorage/gi);
      if (wix) errs.push('WIX refs: ' + wix.length);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (over > 0) errs.push('OVERFLOW x ' + over + 'px');
      const hdr = await page.evaluate(() => Math.round(document.querySelector('.site-header').getBoundingClientRect().height));
      if (hdr > 60) errs.push('HEADER tall ' + hdr + 'px');
      const fontOk = await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('300 16px Barlow'); });
      if (!fontOk) errs.push('FONT Barlow not loaded');
      await page.screenshot({ path: path.join(OUT, `check_${tag}_${pg.replace('.html', '')}.png`), fullPage: true });
      console.log(tag, pg, errs.length ? errs : 'OK');
      bad += errs.length;
      await page.close();
    }
    await ctx.close();
  }
  // slideshow advances?
  const p = await browser.newPage();
  await p.goto('http://localhost:8765/index.html');
  const a = await p.evaluate(() => document.querySelector('.slide.on').getAttribute('src'));
  await p.waitForTimeout(5000);
  const b = await p.evaluate(() => document.querySelector('.slide.on').getAttribute('src'));
  console.log('slideshow', a, '->', b, a !== b ? 'ADVANCES' : 'STUCK');
  const pdf = await (await p.request.get('http://localhost:8765/downloads/astra-sony-vpl-fhz700l-spec-sheet.pdf')).body();
  console.log('pdf bytes', pdf.length, pdf.slice(0, 5).toString());
  await browser.close(); srv.close();
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
