import { useSyncExternalStore } from 'react'

const media = matchMedia('(prefers-color-scheme: dark)')

function subscribe(callback: () => void) {
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}

/** The browser's current color scheme, updating live when the OS/browser theme changes. */
export function useSystemTheme(): 'light' | 'dark' {
  return useSyncExternalStore(subscribe, () => (media.matches ? 'dark' : 'light'))
}
