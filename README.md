# jatinkray.github.io

Personal site for **Jatin Kumar Ray**, Staff SRE · Observability · AIOps (Dubai, UAE).
Served by GitHub Pages from `main` at <https://jatinkray.github.io/>.

## Design

- **Pitch:** reliability at scale (1B+ API calls/day, $2M/yr cost cut, −70% MTTR) plus
  AI-native operations: agents investigate over MCP, humans approve changes.
- **Hero:** a simulated incident replay. An alert fires, an agent queries metrics, logs,
  traces and deploys, proposes a rollback, waits for human approval, and the p99 chart
  recovers. It is labelled *Simulated*, autoplays once when visible, can be paused, and
  shows its final state without JavaScript or with reduced motion.
- **Look:** ink and paper with one signal colour (vermilion), hairline Swiss grid.
  Mona Sans (variable weight and width) for text, JetBrains Mono for data. Dark by
  default, light theme via the toggle or the OS setting.

## Sections

| Section | Content |
|---------|---------|
| Hero | Name, positioning, CTAs, four headline results with their source, incident replay |
| Companies | Careem (Uber), HungerStation, Carrefour, McKinsey, G4S, Aon |
| 01 · Scope | Six staff-level areas, each with a principle and where it happened |
| 02 · AIOps | Five-layer stack (Data → Signal → Context → Reason → Act) and the rules agents follow |
| 03 · Builds | Parqtel and LocalSight: KPIs, highlights, screenshot galleries with a lightbox |
| 04 · Experience | Seven roles, newest first |
| 05 · Toolkit | Skills, certifications, education |
| 06 · Contact | Email (with copy button), LinkedIn, GitHub, CV |

Every number on the page comes from the CV (`public/Jatin_Kumar_Ray_CV.pdf`) or the
public Parqtel and LocalSight repos. No phone number appears on the page.

## Structure

```
.
├── index.html                     # the whole site
├── public/Jatin_Kumar_Ray_CV.pdf  # downloadable CV
├── assets/
│   ├── css/style.css              # tokens (dark + light), layout, replay
│   ├── js/main.js                 # theme, replay, galleries, lightbox, scrollspy, reveal, copy
│   ├── fonts/                     # Mona Sans + JetBrains Mono (self-hosted woff2)
│   └── img/                       # favicon, og-image.png (1200×630), product screenshots
└── scripts/
    ├── review.cjs                 # Puppeteer review: screenshots + 28 checks
    └── og-src.html                # source for og-image.png
```

No build step and no external requests: plain HTML, CSS and JS with relative paths.

## Local preview and review

```bash
python3 -m http.server 8899           # from the repo root, then open http://127.0.0.1:8899
node scripts/review.cjs               # screenshots to .review/, exits 1 if a check fails
node scripts/review.cjs --og          # re-render assets/img/og-image.png
```

The review checks overflow at 320–1440 px, heading and link structure, alt text,
contrast of every text colour token in both themes, the replay (autoplay, approval gate,
pause, end state), theme toggle, gallery tabs, lightbox, scrollspy, copy email,
no-JS and reduced-motion rendering, and console errors. It needs Puppeteer and a local
Chrome; set `PUPPETEER`, `CHROME` or `BASE` to override the defaults.

## Editing

- **Copy and numbers:** all in `index.html`. Search for the section id (`#scope`,
  `#aiops`, `#builds`, `#experience`).
- **Replay script:** the `.rp-log` list in `index.html`. Each row has `data-t` (second it
  appears), `data-p` (chart progress 0–1) and `data-state` (`firing`, `investigating`,
  `approval`, `mitigating`, `resolved`). The run length is `END` in `assets/js/main.js`.
- **Colours and type:** tokens at the top of `assets/css/style.css`.
- **Screenshots:** JPEGs under `assets/img/shots/` at 16:10 (about 1400 px wide).

## Deployment

Push to `main`. GitHub Pages serves the repo root (`.nojekyll` is present).
