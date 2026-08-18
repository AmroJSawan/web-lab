type Scheme = 'light' | 'dark'

/**
 * Desktop browsers paint their toolbar from their own UI theme and expose no
 * API for pages to read that color (and desktop Chrome/Edge/Firefox ignore
 * <meta theme-color>). These are each browser's default toolbar fills per
 * scheme — the best available match so the page blends into the frame above
 * it. Adjust here if a custom browser theme is in use.
 *
 * Safari and mobile browsers are absent on purpose: they tint their chrome
 * from the page itself (theme-color / sampled background), so the native
 * Canvas color plus a matching theme-color is already exact there.
 */
const DESKTOP_TOOLBAR: Record<string, Record<Scheme, string>> = {
  chrome: { light: '#ffffff', dark: '#282828' },
  edge: { light: '#f7f7f7', dark: '#2b2b2b' },
  firefox: { light: '#f9f9fb', dark: '#2b2a33' },
}

function desktopBrowser(): string | null {
  const ua = navigator.userAgent
  if (ua.includes('Mobile') || ua.includes('Android')) return null
  if (ua.includes('Firefox/')) return 'firefox'
  if (ua.includes('Edg/')) return 'edge'
  if (ua.includes('OPR/')) return null // Opera: no reliable default, fall back to Canvas
  if (ua.includes('Chrome/')) return 'chrome'
  return null // Safari and everything else
}

/**
 * The browser's own native background color for a given scheme, resolved from
 * the CSS system color `Canvas` — the exact color the browser paints behind
 * pages. Returned as a computed `rgb(...)` string.
 */
function resolveCanvas(scheme: Scheme): string {
  const probe = document.createElement('div')
  probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;background-color:Canvas'
  probe.style.colorScheme = scheme
  document.documentElement.appendChild(probe)
  const color = getComputedStyle(probe).backgroundColor
  probe.remove()
  return color
}

/**
 * The fill that best matches the browser chrome the page sits inside, per
 * browser and color scheme.
 */
export function resolveBrowserFill(scheme: Scheme): string {
  const browser = desktopBrowser()
  if (browser && DESKTOP_TOOLBAR[browser]) return DESKTOP_TOOLBAR[browser][scheme]
  return resolveCanvas(scheme)
}
