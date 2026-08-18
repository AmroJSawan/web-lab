type Scheme = 'light' | 'dark'

interface EyeDropperResult {
  sRGBHex: string
}

declare global {
  interface Window {
    EyeDropper?: new () => { open(): Promise<EyeDropperResult> }
  }
}

const CALIBRATION_KEY = 'browser-fill-calibration'

export type Calibration = Partial<Record<Scheme, string>>

export function loadCalibration(): Calibration {
  try {
    return JSON.parse(localStorage.getItem(CALIBRATION_KEY) ?? '{}') as Calibration
  } catch {
    return {}
  }
}

export function saveCalibration(calibration: Calibration): void {
  localStorage.setItem(CALIBRATION_KEY, JSON.stringify(calibration))
}

export function supportsEyeDropper(): boolean {
  return typeof window.EyeDropper === 'function'
}

/**
 * Let the user pick any pixel on screen — browser toolbar included — via the
 * EyeDropper API. Resolves to the picked hex, or null if unsupported or the
 * user cancels.
 */
export async function pickScreenColor(): Promise<string | null> {
  if (!window.EyeDropper) return null
  try {
    const result = await new window.EyeDropper().open()
    return result.sRGBHex
  } catch {
    return null
  }
}

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

export function supportsScreenSample(): boolean {
  return typeof navigator.mediaDevices?.getDisplayMedia === 'function'
}

/**
 * Automated toolbar sampling: capture one frame of the screen, locate the
 * browser-chrome strip directly above this page's viewport from the window's
 * screen position, and return the dominant color of that strip. The capture
 * stream is stopped immediately after the single frame. Resolves to a hex
 * color, or null if the user declines, the window has no visible chrome, or
 * the captured surface doesn't include it.
 */
export async function sampleToolbarColor(): Promise<string | null> {
  if (!supportsScreenSample()) return null
  let stream: MediaStream | null = null
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: { displaySurface: 'monitor' },
      audio: false,
    })
    const video = document.createElement('video')
    video.srcObject = stream
    video.muted = true
    await video.play()
    await new Promise((resolve) => setTimeout(resolve, 200)) // let a real frame arrive

    const chromeHeight = window.outerHeight - window.innerHeight
    if (chromeHeight <= 0 || video.videoWidth === 0) return null

    const scale = video.videoWidth / screen.width
    const screenOrigin = screen as { availLeft?: number; availTop?: number }
    // A 3px-tall strip at the very bottom of the chrome, just above the viewport.
    const y = Math.round((window.screenY - (screenOrigin.availTop ?? 0) + chromeHeight - 6) * scale)
    const x0 = Math.round((window.screenX - (screenOrigin.availLeft ?? 0) + 8) * scale)
    const width = Math.round((window.outerWidth - 16) * scale)

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null
    ctx.drawImage(video, 0, 0)
    const strip = ctx.getImageData(x0, Math.max(0, y - 1), Math.max(1, width), 3).data

    // The most frequent color wins: chrome background dominates over icons,
    // text, and bookmark chips crossing the strip.
    const counts = new Map<number, number>()
    for (let i = 0; i < strip.length; i += 4) {
      const key = (strip[i] << 16) | (strip[i + 1] << 8) | strip[i + 2]
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    let bestKey = -1
    let bestCount = 0
    for (const [key, count] of counts) {
      if (count > bestCount) {
        bestKey = key
        bestCount = count
      }
    }
    if (bestKey < 0) return null
    return `#${bestKey.toString(16).padStart(6, '0')}`
  } catch {
    return null
  } finally {
    stream?.getTracks().forEach((track) => track.stop())
  }
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
