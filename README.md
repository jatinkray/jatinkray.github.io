# jatinkray.github.io

Personal portfolio & résumé site for **Jatin Kumar Ray** — Staff Engineer, SRE &
Platform Leadership (Dubai, UAE).

Served by GitHub Pages from the `main` branch at
<https://jatinkray.github.io/>.

## Design concept — "The Reliability Report"

The page is designed as a modern **ops report of the candidate**: a terminal-style
hero console, live-uptime status cards, an impact bento grid, SLO-style capability
meters, case-study build panels, and a mission-log career timeline. Type system is
Space Grotesk (display) + Inter (body) + JetBrains Mono (data); palette is
emerald-ops on deep graphite with gold signal highlights. Dark-first with a light
theme toggle. No phone number appears anywhere on the page by design.

## What's on the page

| Section | Content |
|---------|---------|
| **00 · Hero console** | Terminal-style `whoami` card with typing animation, KPI summary, CV/LinkedIn CTAs; status stack with Live Systems uptime card, 1B+ calls/day sparkline, and a 99.5% availability dial |
| **01 · Signals** | Impact bento: 14+ yrs · 1B+ calls/day · $2M/yr savings · 500 nodes; animated capability meters (K8s, observability, SLO governance, leadership); operating principles; multi-cloud tags |
| **02 · Capabilities** | Six staff-level value propositions: platform building, engineering leadership, reliability governance, FinOps, AI-native operations (MCP), builder's track record |
| **03 · Builds** | Case studies for two live open-source products (below) with tabbed console screenshots, custom SVG architecture diagrams, benchmark KPIs, and fact cards |
| **04 · Mission log** | Six-role career timeline: Careem → Hungerstation → Carrefour → McKinsey → G4S → AON, each with achievements and impact chips |
| **05 · Stack & credentials** | Skills tags (Platform, Observability, Reliability, Cloud, Languages, Leadership), 7 certifications, education |
| **06 · Contact** | Email + LinkedIn + CV CTA card |

### Portfolio products

1. **Parqtel** — ultra-lightweight Rust observability engine; OTLP metrics/logs/traces
   → compressed Parquet with PromQL-compatible query API, Grafana datasource, alerting,
   and 7 MCP tool-servers for AI incident response.
   Site: <https://parqtel.com> · Source: <https://github.com/parqtel/parqtel-oss>

2. **LocalSight** — local-first, privacy-by-design AI video intelligence platform for
   NVR/IP-camera fleets; local ONNX inference, behavior analytics, ANPR, envelope
   encryption, hardened CI/CD.
   Site: <https://localsightx.github.io> · Source: <https://github.com/localsightX/localsight>

## Structure

```
.
├── index.html                    # The entire one-page site
├── public/Jatin_Kumar_Ray_CV.pdf # Downloadable résumé
├── assets/
│   ├── css/style.css             # Design system (dark + light themes)
│   ├── js/main.js                # Typing, theme, reveals, counters, meters, dial,
│   │                             #   scrollspy, tabs, lightbox
│   ├── fonts/                    # Space Grotesk + Inter + JetBrains Mono (self-hosted)
│   └── img/
│       ├── favicon.svg           # Heartbeat brand mark
│       ├── og-image.png          # 1200×630 social card
│       └── shots/                # Product console screenshots (optimized JPEG)
└── scripts/
    ├── review.cjs                # Puppeteer local-review (screenshots + checks)
    └── og-src.html               # Source used to render the OG image
```

## Design notes

- **No build step** — plain HTML/CSS/JS, served statically (`.nojekyll` present).
  Asset paths are relative so the page also works from the filesystem or a subpath.
- **Dark-first, light toggle** — tokens follow the system theme; the header button
  persists the user's choice in `localStorage`.
- **Self-hosted fonts** — no external requests; fully functional offline/air-gapped.
- **Accessible** — focus-visible styles, ARIA labels, `prefers-reduced-motion`
  disables all animation (typing, reveals, flows, counters), keyboard-operable
  lightbox, unique H1, semantic landmarks.
- **Mobile-safe** — architecture diagrams scroll horizontally inside their panels;
  the page never overflows horizontally on 390px viewports.
- **SEO** — canonical URL, OG/Twitter cards, Person JSON-LD with `sameAs` links.

## Local preview

```bash
python3 -m http.server 8899
# open http://localhost:8899
```

Full automated review (desktop/mobile screenshots, console-error capture,
interaction tests, overflow checks):

```bash
node scripts/review.cjs   # needs the local server running + system Chrome
```

## Editing

- All content lives in `index.html` — metrics in the bento, KPIs in the case
  banners, missions in the log. Search for the section you want to change.
- Colors/typography: CSS custom properties at the top of `assets/css/style.css`
  (`--ops` is the emerald accent; `--gold` is the signal highlight).
- Screenshots: replace JPEGs under `assets/img/shots/` (keep ~1360px width).

## Deployment

Push to `main`. GitHub Pages serves the root; the PDF is served from `public/`.
No CI required.
