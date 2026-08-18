/**
 * The browser's own native background color for a given scheme, resolved from
 * the CSS system color `Canvas` — the exact color the browser paints behind
 * pages. Returned as a computed `rgb(...)` string.
 */
export function resolveBrowserCanvas(scheme: 'light' | 'dark'): string {
  const probe = document.createElement('div')
  probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;background-color:Canvas'
  probe.style.colorScheme = scheme
  document.documentElement.appendChild(probe)
  const color = getComputedStyle(probe).backgroundColor
  probe.remove()
  return color
}

/** Parse a computed `rgb(...)` string into 0–1 channel values for shader uniforms. */
export function toShaderColor(color: string): [number, number, number] {
  const channels = color.match(/\d+(?:\.\d+)?/g)
  if (!channels || channels.length < 3) return [1, 1, 1]
  return [Number(channels[0]) / 255, Number(channels[1]) / 255, Number(channels[2]) / 255]
}
