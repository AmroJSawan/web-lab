# web-lab

A minimal, fast base for modern web interfaces. Static output, deployed to GitHub Pages on every push to `main`.

**Live:** https://amrojsawan.github.io/web-lab/

## Stack

| Layer | Tool | Why |
|---|---|---|
| Build | [Vite 8](https://vite.dev) | Fastest builds, static-by-default output, smallest bundles |
| UI runtime | [React 19](https://react.dev) | Concurrent rendering, broadest component ecosystem |
| Types | TypeScript (strict) | Correctness |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) | CSS-first config, oklch color tokens |
| Components | [shadcn/ui](https://ui.shadcn.com) | Owned-source components, Radix primitives, full theme token system |
| Shaders / 3D | [Three.js](https://threejs.org) + [React Three Fiber](https://r3f.docs.pmnd.rs) + [drei](https://drei.docs.pmnd.rs) | GLSL shaders, WebGL, liquid-glass and material effects — lazy-loaded so the core page stays light |
| Animation | [Motion](https://motion.dev) | Hardware-accelerated springs and gestures |

Core page weighs ~111 kB gzip; the WebGL chunk (~234 kB gzip) loads lazily only where a shader is used.

## Develop

```bash
npm install
npm run dev       # dev server with HMR
npm run build     # type-check + production build to dist/
npm run preview   # serve the production build locally
```

## Add components

```bash
npx shadcn@latest add <component>
```

## Failed experiments

**Browser-chrome color matching (2026-08-19, removed).** Goal: make the page background automatically match the exact color of the browser toolbar it sits inside, with no interaction and no permissions. Outcome: **failed** — not achievable on the web platform. Findings, for the record:

- No API exposes browser-UI pixels to a page. The legacy CSS system colors (`ActiveCaption`, `Window`, `Menu`, …) that once leaked OS chrome colors are standardized to fixed aliases of `Canvas` in Chromium as anti-fingerprinting hardening; `AccentColor` is scoped to installed PWAs for the same reason.
- Every pixel-reading path is gated: EyeDropper needs a user click per pick, `getDisplayMedia` needs a share approval per session. Both worked but require interaction, which failed the "automatic" requirement.
- Heuristic per-browser toolbar palettes work for default themes but silently break on custom browser themes, and per-platform values drift with browser versions.
- The reverse channel (`theme-color`, honored by Safari/mobile) is the only exact mechanism, and it only works where the browser tints itself from the page.

Conclusion: pages cannot know their surrounding chrome color by design. Use the standard token-based light/dark theme and let browsers that tint from the page do so.

## Deploy

Push to `main`. The GitHub Actions workflow in `.github/workflows/deploy.yml` builds and publishes `dist/` to GitHub Pages. `base` is set to `/web-lab/` in `vite.config.ts`.
