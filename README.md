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

## Deploy

Push to `main`. The GitHub Actions workflow in `.github/workflows/deploy.yml` builds and publishes `dist/` to GitHub Pages. `base` is set to `/web-lab/` in `vite.config.ts`.
