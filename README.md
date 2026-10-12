# Abdul Aziz Tours & Consultancy · website

Static site. No build step, no backend. Open it through a local server (the `file://` route blocks some browser features).

## Run locally

From the folder that contains `index.html`:

```bash
python -m http.server 8080
```

Then open http://localhost:8080.

## Publish on GitHub Pages

This folder is the repository root. Pages serves `index.html` from the root of the `main` branch.

1. Push the repository (see the deployment guide you were given).
2. On GitHub, open the repo, then Settings, then Pages (under "Code and automation").
3. Under "Build and deployment", set Source to "Deploy from a branch", Branch to `main`, folder to `/ (root)`, and click Save.
4. After about a minute the site is live at `https://t4j44.github.io/Aziz-Consultancy-/`.

Every `git push` to `main` republishes the site.

## Files

- `index.html`: all copy, both languages inline. Each text is wrapped in `<span lang="bn">` and `<span lang="en">`, and the language switch shows one.
- `styles.css`: tokens (top of file) and layout. Values match `DESIGN.md`.
- `app.js`: language switch, mobile menu, owner config, enquiry form.
- `data/content.js`: owner settings only. Change these, not the markup.
- `DESIGN.md`: design system. Read before editing.
- `assets/`: logo files (`logo-original.webp`, `logo-full.webp`, `logo-mark.webp`), favicons, social image, `route-map.svg`.
- `assets/photos/`: slots for owner photos. Not wired yet, see its README.
- `tools/build_assets.py`: rebuilds `route-map.svg`, favicons and the social image. Needs the Natural Earth 110m land file (`ne_land.json`) and Pillow.
- `_rejected/`: AI-looking photos removed from the page. Keep out of the site.

## Owner settings (`data/content.js`)

| Setting | What it does | Default |
|---|---|---|
| `WHATSAPP_NUMBER` | Shows WhatsApp buttons and sends form messages to WhatsApp. Digits only, e.g. `8801345652683`. | empty (hidden) |
| `PHONE_PRIMARY`, `PHONE_SECONDARY` | Call links | the two confirmed numbers |
| `SHOW_GREECE_PAYMENT_TERMS` | Shows the Greece "no advance, pay after visa" line | `false` until confirmed |
| `LICENSE_NO` | Shows the recruiting licence row | empty (hidden) |
| `OFFICE_HOURS`, `OFFICE_EMAIL` | Show their rows | empty (hidden) |
| `FACEBOOK_URL`, `MAPS_URL` | Links | the page and the map search |

## Items marked `OWNER TO CONFIRM` in `index.html`

- The five "How we work" steps are generic wording. Confirm or rewrite them.
- The address says "near the Fisheries Office". The source notes disagree (beside or below). Confirm.

## Credits and sources

- Land data: Natural Earth 110m land, public domain (naturalearthdata.com).
- Logo: supplied by the owner.
- Fonts: Google Fonts (Playfair Display, Instrument Sans, Noto Serif Bengali, Noto Sans Bengali), SIL Open Font License or Apache 2.0.

## Motion and 3D (Stage 2)

- `assets/motion.js` (GSAP + ScrollTrigger + Lenis): hero intro, reveals on entry, the route pin, the Method line that fills as you scroll, the Proof quote lighting up word by word, the footer wordmark wipe, magnetic buttons and the logo plate tilt. Runs only if GSAP loads and the visitor has not asked for reduced motion. Lenis runs on desktop with a fine pointer only.
- `assets/globe.js` (three.js): the 3D route globe in the hero. A navy body, dotted land, gold arcs drawn in sequence, a model plane flying the arc being drawn, and beacons at Shaistagonj and the seven destinations. It loads only on desktop (960px and up) when WebGL is available and the page is not in reduced motion. It renders only while it is on screen.
- The hero pins for 1170px of scroll. The scroll position drives how far the route is drawn.
- Phones and reduced motion get no globe and no pin. Phones keep the reveals; reduced motion gets the static page.

### Vendored libraries (pinned)

| File | Package | Version | Licence |
|---|---|---|---|
| `assets/vendor/gsap.min.js` | gsap | 3.15.0 | GSAP Standard "no charge" licence |
| `assets/vendor/ScrollTrigger.min.js` | gsap | 3.15.0 | GSAP Standard "no charge" licence |
| `assets/vendor/lenis.min.js` | lenis | 1.3.26 | MIT (`LICENSE-lenis.txt`) |
| `assets/vendor/three.lite.module.js` | three | 0.186.1 | MIT (`LICENSE-three.txt`), tree-shaken |

Rebuild the three.js bundle. Install the packages in a scratch folder, copy the entry there, and write the output into the site:

```bash
npm i three@0.186.1 esbuild
cp <path-to-site>/tools/three-entry.js entry.js
npx esbuild entry.js --bundle --minify --format=esm --legal-comments=inline --outfile=<path-to-site>/assets/vendor/three.lite.module.js
```

`assets/globe-dots.json` is the land grid for the globe, sampled from Natural Earth 110m land. `tools/build_globe.py` regenerates it.

### Checks

- `tools/capture-stage1.mjs`: section screenshots for review (Stage 1).
- `tools/check-stage2.mjs`: WebGL globe, pin range, Lenis, reveals after a full scroll, reduced motion, phone fallback, no-WebGL fallback, console errors. Writes `screenshots-stage2/` in the project root. Both scripts need Edge or Chrome: `BROWSER_EXE="C:/path/to/msedge.exe" node tools/check-stage2.mjs`, run from the project root.

## Still open

- Domain: `og:image` and the sitemap use placeholders. Add the canonical URL, the real domain in `sitemap.xml`, and the Sitemap line in `robots.txt` after the owner confirms a domain.
- Photos: the slots in `assets/photos/` are not wired yet.
- Lighthouse: not run.
