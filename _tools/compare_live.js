// Capture live astraprojections.com and the local site/ at the same widths and stitch them side by side.
// Usage: node _tools/compare_live.js site _raw/cmp [widths=390,820,1440] [pages=index,services,contact]
const { chromium } = require('playwright-core');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(process.argv[2]), OUT = path.resolve(process.argv[3]);
const WIDTHS = (process.argv[4] || '390,820,1440').split(',').map(Number);
const PAGES = (process.argv[5] || 'index,services,contact').split(',');
// the custom domain serves only the home page; Wix nav links point at the wixsite address
const LIVE = { index: 'https://www.astraprojections.com/', services: 'https://haijak.wixsite.com/astra-projections/services', contact: 'https://haijak.wixsite.com/astra-projections/contact' };
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.pdf': 'application/pdf' };
fs.mkdirSync(OUT, { recursive: true });
const srv = http.createServer((q, r) => {
  let u = decodeURIComponent(q.url.split('?')[0].split('#')[0]);
  if (u === '/') u = '/index.html';
  if (!path.extname(u)) u += '.html'; // mirrors Cloudflare Pages pretty URLs
  fs.readFile(path.join(ROOT, u), (e, b) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': TYPES[path.extname(u)] || 'application/octet-stream' }); r.end(b); } });
}).listen(8766);

async function shoot(ctx, url, file) {
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  for (let y = 0; y < 9000; y += 400) { await page.mouse.wheel(0, 400); await page.waitForTimeout(120); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1500);
  // Wix free-site ad banner is not part of the design being replicated
  await page.addStyleTag({ content: '#WIX_ADS, [data-testid="free-site-banner"]{display:none!important}' }).catch(() => {});
  // stacked viewport frames, so fixed backgrounds and sticky headers render as a visitor sees them
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  const vh = page.viewportSize().height, frames = [];
  for (let y = 0; y < h; y += vh) {
    await page.evaluate(v => window.scrollTo(0, v), y);
    await page.waitForTimeout(500);
    frames.push((await page.screenshot()).toString('base64'));
  }
  const last = h % vh;
  const vw = page.viewportSize().width;
  const sp = await ctx.newPage();
  await sp.setViewportSize({ width: vw, height: vh });
  await sp.setContent('<body style="margin:0;line-height:0">' + frames.map((f, i) => {
    const crop = i === frames.length - 1 && last ? `height:${last}px;object-fit:cover;object-position:bottom;` : '';
    return `<img style="display:block;width:${vw}px;${crop}" src="data:image/png;base64,${f}">`;
  }).join('') + '</body>');
  await sp.waitForTimeout(300);
  await sp.screenshot({ path: file, fullPage: true });
  await sp.close();
  await page.close();
  return h;
}

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    for (const pg of PAGES) {
      const lf = path.join(OUT, `live_${pg}_${w}.png`), cf = path.join(OUT, `local_${pg}_${w}.png`);
      const lh = await shoot(ctx, LIVE[pg], lf);
      const ch = await shoot(ctx, `http://localhost:8766/${pg === 'index' ? '' : pg}`, cf);
      // stitch: live left, local right, scaled to 600px per column
      const sp = await browser.newPage({ viewport: { width: 1220, height: 400 } });
      const b64 = f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
      await sp.setContent(`<body style="margin:0;background:#888;display:flex;gap:20px;align-items:flex-start;font:14px Arial">
        <div style="width:600px"><b>LIVE ${w}px h=${lh}</b><img style="width:600px" src="${b64(lf)}"></div>
        <div style="width:600px"><b>LOCAL ${w}px h=${ch}</b><img style="width:600px" src="${b64(cf)}"></div></body>`);
      await sp.waitForTimeout(300);
      await sp.screenshot({ path: path.join(OUT, `cmp_${pg}_${w}.jpg`), fullPage: true, type: 'jpeg', quality: 70 });
      await sp.close();
      console.log(pg, w, 'live h', lh, 'local h', ch);
    }
    await ctx.close();
  }
  await browser.close(); srv.close();
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
