// Captures section screenshots of the site for review (Stage 1 approval).
// Run from the project root:  BROWSER_EXE="C:/path/to/msedge.exe" node site/tools/capture-stage1.mjs
// Starts a throwaway static server on 127.0.0.1:8091 and stops it when done.
import puppeteer from 'puppeteer-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(here, '..');
const OUT = path.resolve(SITE, '..', 'screenshots-stage1');
const EXE = process.env.BROWSER_EXE;
const PORT = 8091;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json'
};

fs.mkdirSync(OUT, { recursive: true });

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(SITE, urlPath === '/' ? 'index.html' : urlPath);
  if (!file.startsWith(SITE) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    return res.end('not found');
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const runs = [
  { name: 'desktop-1440-bn', width: 1440, height: 900, lang: 'bn', sections: ['#top', '#routes', '#services', '#method', '.act-proof', '#contact', '.site-footer'] },
  { name: 'desktop-1440-en', width: 1440, height: 900, lang: 'en', sections: ['#top', '#routes', '#contact'] },
  { name: 'mobile-390-bn', width: 390, height: 844, lang: 'bn', sections: ['#top', '#routes', '#method', '#contact'] },
  { name: 'mobile-390-en', width: 390, height: 844, lang: 'en', sections: ['#top', '#contact'] }
];

const browser = await puppeteer.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox'] });
const report = [];

try {
  for (const run of runs) {
    const page = await browser.newPage();
    await page.setViewport({ width: run.width, height: run.height, deviceScaleFactor: 1 });
    await page.evaluateOnNewDocument((lang) => {
      try { localStorage.setItem('aziz-lang', lang); } catch (e) { /* ignore */ }
    }, run.lang);

    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({ content: '.sticky-bar,.float-call{display:none!important}' });

    for (const sel of run.sections) {
      const el = await page.$(sel);
      if (!el) { report.push(`${run.name}: missing ${sel}`); continue; }
      // The fixed header would sit over section captures; keep it only on the hero capture.
      await page.addStyleTag({ content: sel === '#top' ? '.site-header{display:block!important}' : '.site-header{display:none!important}' });
      const file =`${run.name}-${sel.replace(/[#.]/g, '').replace(/[^a-z0-9-]/gi, '-')}.png`;
      await el.screenshot({ path: path.join(OUT, file) });
      report.push(`saved ${file}`);
    }

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    report.push(`${run.name}: horizontal overflow ${overflow}px, console/page errors: ${errors.length}`);
    if (errors.length) report.push(`  ${errors.slice(0, 3).join(' | ')}`);
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}

console.log(report.join('\n'));
