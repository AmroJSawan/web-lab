/**
 * Desktop Chrome paints its toolbar from its own UI theme and exposes no API
 * for pages to read that color (it also ignores <meta theme-color>). These are
 * Chrome's default toolbar fills per scheme — the best available match so the
 * page blends into the frame above it. Adjust here if your Chrome theme differs.
 */
const CHROME_TOOLBAR: Record<'light' | 'dark', string> = {
  light: '#ffffff',
  dark: '#282828',
}

function isDesktopChrome(): boolean {
  const ua = navigator.userAgent
  return ua.includes('Chrome/') && !ua.includes('Edg/') && !ua.includes('OPR/') && !ua.includes('Mobile')
}

/**
 * The browser's own native background color for a given scheme, resolved from
 * the CSS system color `Canvas` — the exact color the browser paints behind
 * pages. Returned as a computed `rgb(...)` string.
 */
function resolveCanvas(scheme: 'light' | 'dark'): string {
  const probe = document.createElement('div')
  probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;background-color:Canvas'
  probe.style.colorScheme = scheme
  document.documentElement.appendChild(probe)
  const color = getComputedStyle(probe).backgroundColor
  probe.remove()
  return color
}

/**
 * The fill that best matches the browser chrome the page sits inside:
 * Chrome's toolbar color on desktop Chrome, the native Canvas color elsewhere
 * (Safari and mobile browsers tint their chrome from the page, so Canvas plus
 * a matching theme-color is already exact there).
 */
export function resolveBrowserFill(scheme: 'light' | 'dark'): string {
  if (isDesktopChrome()) return CHROME_TOOLBAR[scheme]
  return resolveCanvas(scheme)
}
