// Phone checks on an emulated touch device, plus the "load wide, then shrink" case
// (what DevTools device mode does). Run from the project root:
//   BROWSER_EXE="C:/path/to/msedge.exe" node site/tools/check-mobile.mjs
import puppeteer from 'puppeteer-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(here, '..');
const OUT = path.resolve(SITE, '..', 'screenshots-mobile');
const EXE = process.env.BROWSER_EXE;
const PORT = 8093;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json'
};
fs.mkdirSync(OUT, { recursive: true });

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(SITE, urlPath === '/' ? 'index.html' : urlPath);
  if (!file.startsWith(SITE) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('nf'); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const browser = await puppeteer.launch({
  executablePath: EXE, headless: true,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const PHONE = { width: 393, height: 852, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

async function audit(page, label) {
  const data = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const bad = [...document.querySelectorAll('body *')].filter((e) => {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      const r = e.getBoundingClientRect();
      return r.width > 0 && (r.left < -1 || r.right > vw + 1);
    }).slice(0, 8).map((e) => `${e.tagName.toLowerCase()}.${(e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className) || ''} L${Math.round(e.getBoundingClientRect().left)} R${Math.round(e.getBoundingClientRect().right)}`);
    return {
      innerWidth, clientWidth: vw, scrollW: document.documentElement.scrollWidth, scrollX,
      htmlClass: document.documentElement.className,
      pinSpacers: document.querySelectorAll('.pin-spacer').length,
      canvas: !!document.querySelector('[data-stage] canvas'),
      bad
    };
  });
  console.log(label, JSON.stringify(data));
  return data;
}

try {
  // A · real phone emulation
  {
    const page = await browser.newPage();
    await page.setUserAgent(UA);
    await page.setViewport(PHONE);
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle0', timeout: 60000 });
    await sleep(2500);
    await audit(page, 'A phone load');
    await page.screenshot({ path: path.join(OUT, 'A-phone-hero.png') });

    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    let i = 0;
    for (let y = 0; y < total; y += 700) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await sleep(900);
      await page.screenshot({ path: path.join(OUT, `A-phone-${String(i).padStart(2, '0')}.png`) });
      i += 1;
    }
    await audit(page, 'A phone after scroll');
    console.log('A errors', errors.length, errors.slice(0, 3));
    await page.close();
  }

  // B · load wide, then shrink to phone width (DevTools device-mode case)
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle0', timeout: 60000 });
    await sleep(2500);
    await audit(page, 'B wide load');
    await page.setViewport({ ...PHONE });
    await sleep(2500);
    await audit(page, 'B after shrink');
    await page.screenshot({ path: path.join(OUT, 'B-after-shrink.png') });
    await page.evaluate(() => window.scrollTo(0, 500));
    await sleep(1200);
    await audit(page, 'B after shrink + scroll');
    await page.screenshot({ path: path.join(OUT, 'B-after-shrink-scrolled.png') });
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}
