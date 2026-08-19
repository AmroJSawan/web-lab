import { useSyncExternalStore } from 'react'
import { DEFAULT_SETTINGS, type ButtonSettings } from './index'

// Shared settings store: every material instance on the page (the lab button,
// the shadcn-clone MaterialButton, any future ones) inherits the same live
// calibration state.
let current: ButtonSettings = DEFAULT_SETTINGS
const listeners = new Set<() => void>()

export function setSharedSettings(next: ButtonSettings): void {
  current = next
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function useSharedSettings(): ButtonSettings {
  return useSyncExternalStore(subscribe, () => current)
}
