# DESIGN.md · Abdul Aziz Tours & Consultancy

Structure follows the awesome-design-md format (nine sections). Every decision in the site follows this file.

## 1. Visual theme and atmosphere

Quiet, editorial and confident. Dark navy "cinematic" acts alternate with ivory "editorial" acts. The owner's logo, navy and gold, is the only ornament. Type does most of the work. There are no stock photos, no fake dashboards, no glass on cards, and no decorative 3D.

Density: low. One message per section. Lines and whitespace separate content, not boxes.

Tone: plain, specific, honest. Say what the office does and what the owner must confirm.

## 2. Colour palette and roles

Six colour roles. Gold is the single accent.

| Token | Hex | Role | Use |
|---|---|---|---|
| `--deep` | `#040F2B` | Dark ground | Arrival, Method, Contact, footer |
| `--navy` | `#062665` | Brand navy | Logo, headings on paper, primary button fill on paper |
| `--navy-ink` | `#051B4A` | Ink on paper | Body and headings on ivory/paper |
| `--paper` | `#FAF8F2` | Light ground | Routes, Services, Proof |
| `--ivory` | `#F5F3EC` | Text on dark | Headings and body on deep |
| `--gold` | `#CB8711` | Accent | Buttons, rules, map arcs (never small text on paper) |

Derived, not roles: `--gold-hi #FAD158` (small gold text on deep, map endpoints), `--gold-deep #9F5E06` (brand "Consultancy" on white), `--royal #0B50A3` (kicker text on paper, very sparingly), `--ink-muted #4B5873` (secondary text on paper), ivory at 74% opacity (secondary text on deep).

Rules:
- No pure black. No purple. No cream-and-brass palette.
- Gold text only on deep. On paper, use navy ink and a gold rule.
- Gradients: none in Stage 1. A single gold gradient is allowed later, on the footer wordmark only.

Contrast (WCAG 2.x, measured on the tokens above):

| Pair | Ratio | Result |
|---|---|---|
| Ivory on deep | 17.06:1 | AA |
| Muted ivory (74%) on deep | 9.52:1 | AA |
| Gold highlight on deep | 12.93:1 | AA |
| Placeholder text on field | 6.56:1 | AA |
| Navy ink on paper | 15.67:1 | AA |
| Muted ink on paper | 6.72:1 | AA |
| Royal kicker on paper | 7.35:1 | AA |
| Navy ink on gold button | 5.56:1 | AA |
| Paper on navy button | 13.43:1 | AA |
| Gold deep on white pill | 5.15:1 | AA |
| Gold on deep (decorative only) | 6.33:1 | not used for small text |

## 3. Typography

| Role | English | Bangla |
|---|---|---|
| Display (h1, h2, chapter names) | Playfair Display 500 | Noto Serif Bengali 600 |
| Text (body, UI) | Instrument Sans 400/500/600 | Noto Sans Bengali 400/500 |

Two families per language. Space Grotesk and any third family are removed.

Scale (fluid with `clamp`):

| Token | Size | Line height (EN / BN) | Use |
|---|---|---|---|
| `display-xl` | 3rem to 7rem | 0.98 / 1.35 | Arrival headline |
| `display-l` | 2.4rem to 4.6rem | 1.05 / 1.3 | Section headings |
| `display-m` | 2.4rem to 2.8rem | 1.1 / 1.3 | Chapter names |
| `title` | 1.35rem to 1.6rem | 1.3 / 1.5 | Group titles, service names |
| `body` | 1.0625rem (17px) | 1.6 / 1.8 | Paragraphs |
| `small` | 0.875rem | 1.5 / 1.7 | Labels, legends, meta |

Bangla rules:
- No outlined or stroked text. No letter-spacing. No `text-transform`.
- Headline line height at least 1.3. Body line height 1.8.
- Body at least 17px on mobile.
- Conjuncts and matras must render intact. Check each heading in screenshots.

English rules: display text tracks tighter as size grows (-0.02em at h1). Paragraphs measure 45 to 75 characters. Kickers use uppercase with 0.16em tracking.

## 4. Components

- **Header pill.** Fixed, white, fully rounded. Logo mark and live text "Aziz Consultancy / SHAISTAGONJ" on the left. Four links, language toggle and Call button on the right. Below 960px it collapses to a menu button and a sheet.
- **Buttons.** Pill shape, minimum 44px height.
  - Gold: gold fill, navy-ink text. Hover: `--gold-hi`.
  - Ghost (on deep): ivory outline, ivory text.
  - Ink (on paper): navy fill, paper text.
  - Link: underlined, no padding.
  - Focus: 2px outline, `--gold-hi` on deep, `--navy` on paper, 3px offset.
- **Route chapter.** Name in display-m, status line beside it, spec list below (two columns on desktop, one on mobile), one action button. Separated by a hairline. Group heads are sticky on desktop.
- **Specs list.** Definition list. Label in small muted text, value in body.
- **Service row.** Three columns on desktop: name, subtitle, description. Hairline between rows.
- **Method step.** Gold numeral in display type, title, one-line description. Hairline above each step.
- **Update row.** Date in small muted text (left), topic and text (right). Hairline between rows.
- **Route map.** Dotted land (Natural Earth 110m, cropped), gold arcs from Shaistagonj, gold endpoints. The map is an image. Every city name appears in the legend below it, so the map needs no labels to be readable.
- **Form.** Fields with visible labels, 48px height, 16px text (avoids iOS zoom). Phone validation: `01` followed by 9 digits. Submit creates a message: opens WhatsApp when a number is configured, otherwise shows the message with Copy and Call buttons.
- **Logo plate.** White rounded panel holding `logo-full.webp`. Used wherever the full logo appears on a dark section.
- **Sticky bar (mobile).** Fixed bottom bar with Call and WhatsApp (WhatsApp only when configured).
- **Floating call (desktop).** Fixed gold pill, bottom right. Calls the primary number.

## 5. Layout and spacing

- Base unit 4px. Common steps: 8, 12, 16, 24, 32, 48, 64, 96, 128.
- Container 1240px max. Gutter `clamp(20px, 4vw, 48px)`.
- Section padding `clamp(88px, 12vw, 160px)` top and bottom.
- Spacing above headings is larger than below.
- Grids: arrival 1 column, then 1.25fr with the map at 960px. Routes group 0.8fr / 1.4fr. Contact 1fr / 1fr.
- Breakpoints: 960px (desktop layout), 640px (two-column specs).

## 6. Depth and elevation

No card shadows. Depth comes from:
- The header pill's soft shadow (the only elevation on the page).
- Hairline rules: gold at 38% on deep, navy at 14% on paper.
- A faint grain overlay on dark acts (SVG noise, 7% opacity).

Stage 2 adds motion and one 3D scene. Rules:

- One WebGL scene on the whole page: the hero globe, desktop (960px and up) only, loaded on demand, rendered only while on screen.
- Motion animates `transform` and `opacity` only. Reveals run once, on entry.
- Pinning is used once, in the hero, and it drives the route. No other pinned section.
- The logo is never animated, recoloured or given effects. The logo plate may tilt with the pointer (fine pointers only).
- Reduced motion turns off the globe, the pin, reveals, Lenis and the gradient wordmark. The page is complete without them.

## 7. Do's and don'ts

**Do**
- Use only facts from `content.md`. Mark anything unconfirmed in the HTML comment as `OWNER TO CONFIRM`.
- Keep Bangla natural, not word-for-word translated. Keep English brand names in English.
- Keep English numerals in English text and Bangla numerals in Bangla text.
- Write all copy into the HTML, in both languages, so the page reads without JavaScript.

**Don't**
- Glass on cards. Neon, bulb, liquid or glow effects on the logo.
- Photo textures labelled 3D. AI-generated or unverified photos presented as real.
- Gradient text on body copy. Outlined Bangla text. Numbered `01 / 06` counters.
- "Scroll to explore" cues. Fake dashboards or telemetry labels. Coordinate pills. IATA codes.
- Identical card grids. Carousels. Emoji as icons.
- Banned words: telemetry, radar, console, dossier, corridor, flight deck, signature, voyage, trajectory, hub (as a label), unfiltered, seamless, elevate, unlock, curated, bespoke, tailored, empower, game-changer, premier, prestigious, world-class, leading, verified, official (unless the source says it), journey (except the owner's tagline).
- Em dashes in English copy.
- Claims with no source: "legal part-time rights", "adheres strictly to embassy protocols", "scholarship matching", "police verification clearance as a service", "happiest country".

## 8. Responsive behaviour

- Breakpoints 640px and 960px. Mobile first.
- Touch targets 44px or larger.
- Below 960px: nav becomes a sheet, floating call hides, sticky bar appears.
- Route map scales to width. Labels are not drawn in the image, so the legend below carries the names at every width.
- No horizontal scroll at any width from 320px to 1920px.
- Reduced motion: Stage 1 has no motion. Stage 2 must show the route complete under `prefers-reduced-motion`.

## 9. Agent prompt guide

Quick reference for future edits.

- Background deep `#040F2B`, text ivory `#F5F3EC`, accent gold `#CB8711`, gold highlight `#FAD158`.
- Background paper `#FAF8F2`, text navy ink `#051B4A`, muted `#4B5873`.
- Fonts: Playfair Display and Instrument Sans (English), Noto Serif Bengali and Noto Sans Bengali (Bangla).
- Pill buttons, 44px minimum, hairline dividers, no card shadows.
- Facts only from `content.md`. Do not add claims. Mark unconfirmed items `OWNER TO CONFIRM`.

## Page grammar and fingerprint check

Grammar: chaptered editorial, five acts (Arrival, Routes, Method, Proof, Landing).

| Dimension | Generic travel template | This page |
|---|---|---|
| Page structure | Long single column of stacked sections | Five acts, alternating dark and light |
| Navigation | Full-width bar with dropdowns | White floating pill, live logo, five links |
| Hero | Stock photo, headline, button | Headline, facts as text, owner's map of routes |
| Act shapes | Three-up card grids | Sticky group heads, spec lists, hairline rows |
| Closing section | Banner CTA | Contact with white logo plate, form and fallback |
| Signature move | Image parallax | One flight arc drawn from Shaistagonj (Stage 2) |

Differs on six of six dimensions. The brief requires four.

## Stage 3: influences and refinements

Sources: Lamborghini and Runway (awesome-design-md), ShaderGradient, Liquid Glass JS, scroll-craft. Details and credits are in README.md.

- **Hero background:** a slow three-colour gradient (deep navy, royal navy, a little gold at the crests) drawn by `assets/gradient.js`, with still grain. Text always sits on a dark area; edges stay deep.
- **Glass:** only the header pill and the phone dock. Blur 18–20px, saturation 1.6–1.7, a 1px lit rim (inset highlight), and enough opacity that text keeps 4.5:1.
- **Sheets:** each act after the hero slides over the one before it with a 28px top radius. Dark acts carry a 1px gold edge light.
- **Gold:** primary actions, the footer wordmark sheen, and small kickers. Ghost buttons use a half-opacity outline.
- **Phone:** headline, description and buttons, then the globe, then the figures. Spec lists are ruled rows. The dock is a compact glass capsule, not a full-width bar. The footer has its own room for the dock.
- **Cache:** own assets carry `?v=`; bump it on every deploy.
