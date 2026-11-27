// Render each page in a clean headless Edge, scroll it fully, step the slideshow, and dump every media URL + layout text.
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path');
const out = process.argv[2];
const BASE = 'https://haijak.wixsite.com/astra-projections';
const pages = { home: BASE, services: BASE + '/services', contact: BASE + '/contact' };
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const result = {};
  for (const [name, url] of Object.entries(pages)) {
    const page = await ctx.newPage();
    const net = new Set();
    page.on('request', r => { const u = r.url(); if (/wixstatic|vimeo|filesusr|\.mp4/.test(u)) net.add(u); });
    page.on('response', async r => {
      if (!/siteassets\.parastorage\.com/.test(r.url())) return;
      try { const t = await r.text(); fs.writeFileSync(path.join(out, `sa_${name}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.json`), t); } catch (e) {}
    });
    await page.goto(url, { waitUntil: 'load', timeout: 90000 });
    await page.waitForTimeout(4000);
    for (let y = 0; y < 12000; y += 600) { await page.mouse.wheel(0, 600); await page.waitForTimeout(250); }
    // click through every slideshow navigation dot / arrow to load all slides
    const dots = await page.$$('[data-testid="slideShowNavigation"] button, nav[aria-label*="lide"] button, [data-hook*="navigation"] button');
    for (const d of dots) { try { await d.click({ timeout: 2000 }); await page.waitForTimeout(700); } catch (e) {} }
    await page.waitForTimeout(1500);
    const dom = await page.evaluate(() => {
      const abs = s => s;
      const imgs = [...document.querySelectorAll('img')].map(i => ({ src: i.currentSrc || i.src, alt: i.alt, w: i.getBoundingClientRect().width | 0, h: i.getBoundingClientRect().height | 0, y: (i.getBoundingClientRect().top + scrollY) | 0, x: i.getBoundingClientRect().left | 0 }));
      const bgs = [...document.querySelectorAll('*')].map(e => getComputedStyle(e).backgroundImage).filter(b => b && b !== 'none' && b.includes('url('));
      const vids = [...document.querySelectorAll('video, source')].map(v => v.currentSrc || v.src).filter(Boolean);
      const frames = [...document.querySelectorAll('iframe')].map(f => f.src);
      const links = [...document.querySelectorAll('a')].map(a => [a.innerText.trim().slice(0, 50), a.href]);
      return { imgs, bgs: [...new Set(bgs)], vids, frames, links, height: document.body.scrollHeight, dots: document.querySelectorAll('[data-testid="slideShowNavigation"] button').length };
    });
    dom.net = [...net];
    result[name] = dom;
    await page.screenshot({ path: path.join(out, `full_${name}.png`), fullPage: true });
    console.log(name, 'imgs', dom.imgs.length, 'bgs', dom.bgs.length, 'vids', dom.vids.length, 'frames', dom.frames.length, 'net', dom.net.length, 'h', dom.height, 'dots', dom.dots);
    await page.close();
  }
  fs.writeFileSync(path.join(out, 'dom.json'), JSON.stringify(result, null, 1));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
