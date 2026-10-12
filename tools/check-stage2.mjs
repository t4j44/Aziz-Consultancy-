// Stage 2 checks: WebGL globe, pinned hero, Lenis, reveals, reduced motion, phone fallback.
// Run from the project root:  BROWSER_EXE="C:/path/to/msedge.exe" node site/tools/check-stage2.mjs
// Starts a throwaway static server on 127.0.0.1:8092 and stops it when done.
import puppeteer from 'puppeteer-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(here, '..');
const OUT = path.resolve(SITE, '..', 'screenshots-stage2');
const EXE = process.env.BROWSER_EXE;
const PORT = 8092;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png',
  '.ico': 'image/x-icon', '.json': 'application/json'
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

const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: true,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
});

const report = [];
const log = (line) => { report.push(line); console.log(line); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function openPage({ width, height, reduce = false, lang = 'bn' }) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  if (reduce) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.evaluateOnNewDocument((l) => { try { localStorage.setItem('aziz-lang', l); } catch (e) { /* ignore */ } }, lang);
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('requestfailed', (r) => errors.push('requestfailed: ' + r.url() + ' ' + (r.failure() && r.failure().errorText)));
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle0', timeout: 60000 });
  await sleep(2500);
  return { page, errors };
}

try {
  // 1 · Desktop with motion
  {
    const { page, errors } = await openPage({ width: 1440, height: 900 });
    const state = await page.evaluate(() => ({
      motion: document.documentElement.classList.contains('motion'),
      lenis: document.documentElement.classList.contains('lenis'),
      hasST: !!window.ScrollTrigger,
      canvas: !!document.querySelector('[data-stage] canvas'),
      live: document.querySelector('[data-stage]').classList.contains('is-live'),
      pinSpacer: !!document.querySelector('.pin-spacer'),
      triggers: window.ScrollTrigger ? window.ScrollTrigger.getAll().length : 0,
      heroDistance: (() => { const s = document.querySelector('.pin-spacer'); return s ? s.getBoundingClientRect().height : 0; })()
    }));
    log(`desktop 1440: ${JSON.stringify(state)}`);

    const range = await page.evaluate(() => {
      const hero = document.querySelector('.act-arrival');
      const st = window.ScrollTrigger.getAll().find((t) => t.pin && t.trigger === hero);
      return st ? { start: st.start, end: st.end } : null;
    });
    if (!range) throw new Error('hero pin not found');
    const pinLen = range.end - range.start;
    log(`hero pin range y=${Math.round(range.start)}..${Math.round(range.end)} (${Math.round(pinLen)}px of scroll)`);

    const marks = [0, 0.5, 1];
    for (const m of marks) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.round(range.start + pinLen * m));
      await sleep(2200);
      const file = path.join(OUT, `desktop-1440-progress-${Math.round(m * 100)}.png`);
      const top = await page.evaluate(() => Math.round(document.querySelector('.act-arrival').getBoundingClientRect().top));
      await page.screenshot({ path: file });
      log(`saved ${path.basename(file)}; hero top at this mark = ${top}px (0 means pinned)`);
    }

    // Method (pinned line fill) and Proof (word-by-word quote) at mid-scroll
    for (const [sel, name] of [['#method', 'method'], ['.act-proof', 'proof']]) {
      await page.evaluate((s) => {
        const el = document.querySelector(s);
        window.scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * 0.35);
      }, sel);
      await sleep(2200);
      const file = path.join(OUT, `desktop-1440-${name}.png`);
      await page.screenshot({ path: file });
      log(`saved ${path.basename(file)}`);
    }

    const after = await page.evaluate(() => ({ scrollW: document.documentElement.scrollWidth - innerWidth }));
    log(`desktop overflow ${after.scrollW}px; errors ${errors.length}`);
    errors.slice(0, 8).forEach((e) => log('  ' + e));
    await page.close();
  }

  // 2 · Language switch keeps pins and reveals working
  {
    const { page, errors } = await openPage({ width: 1440, height: 900 });
    await page.evaluate(() => document.getElementById('lang-toggle').click());
    await sleep(1200);
    const lang = await page.evaluate(() => document.documentElement.lang);
    log(`language switched to ${lang}; errors ${errors.length}`);
    errors.slice(0, 5).forEach((e) => log('  ' + e));
    await page.close();
  }

  // 3 · Reduced motion: static page, no globe, no pin
  {
    const { page, errors } = await openPage({ width: 1440, height: 900, reduce: true });
    const state = await page.evaluate(() => ({
      motion: document.documentElement.classList.contains('motion'),
      canvas: !!document.querySelector('[data-stage] canvas'),
      pinSpacer: !!document.querySelector('.pin-spacer'),
      revealsHidden: [...document.querySelectorAll('[data-reveal]')].filter((e) => getComputedStyle(e).opacity === '0').length
    }));
    log(`reduced motion: ${JSON.stringify(state)}; errors ${errors.length}`);
    await page.close();
  }

  // 4 · Phone: reveals and text effects, no globe, no pin. Scroll the whole page, then
  //     confirm nothing is left hidden.
  {
    const { page, errors } = await openPage({ width: 390, height: 844 });
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 400) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await sleep(120);
    }
    await sleep(1600);
    const hidden = await page.evaluate(() => [...document.querySelectorAll('[data-reveal]')]
      .filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.99).length);
    log(`phone reveals still hidden after full scroll: ${hidden}`);

    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(1800);
    await page.screenshot({ path: path.join(OUT, 'phone-393-hero.png') });
    log('saved phone-393-hero.png');
    const state = await page.evaluate(() => ({
      motion: document.documentElement.classList.contains('motion'),
      canvas: !!document.querySelector('[data-stage] canvas'),
      pinSpacer: !!document.querySelector('.pin-spacer'),
      overflow: document.documentElement.scrollWidth - innerWidth
    }));
    log(`phone 390: ${JSON.stringify(state)}; errors ${errors.length}`);
    errors.slice(0, 5).forEach((e) => log('  ' + e));
    await page.close();
  }

  // 5 · Desktop, English, no-WebGL simulation: page still renders, flat map kept
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.evaluateOnNewDocument(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
        if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null;
        return orig.call(this, type, ...rest);
      };
    });
    const errors = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle0', timeout: 60000 });
    await sleep(2000);
    const state = await page.evaluate(() => ({
      motion: document.documentElement.classList.contains('motion'),
      canvas: !!document.querySelector('[data-stage] canvas'),
      pinSpacer: !!document.querySelector('.pin-spacer'),
      flatMapVisible: getComputedStyle(document.querySelector('[data-stage] img')).opacity
    }));
    log(`no-WebGL fallback: ${JSON.stringify(state)}; errors ${errors.length}`);
    errors.slice(0, 5).forEach((e) => log('  ' + e));
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}

fs.writeFileSync(path.join(OUT, 'check-report.txt'), report.join('\n') + '\n');
