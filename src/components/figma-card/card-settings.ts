import { useSyncExternalStore } from 'react'

export interface CardSettings {
  // warm material
  warm: number
  peach: number
  green: number
  bandFreq: number
  bandStr: number
  warp: number
  // glass rim
  specGain: number
  rimRefract: number
  // surface toggles
  showWarm: boolean
  showRim: boolean
  showSpec: boolean
  showInner: boolean
  showFill: boolean
  showStroke: boolean
  // DOM surface toggles
  showBadgeSurface: boolean
  showButtonSurface: boolean
}

// Defaults tuned against reference/card/figma-card@2x.png.
export const DEFAULT_CARD_SETTINGS: CardSettings = {
  warm: 1,
  peach: 0.9,
  green: 0.65,
  bandFreq: 13,
  bandStr: 0.7,
  warp: 1,
  specGain: 0.5,
  rimRefract: 26,
  showWarm: true,
  showRim: true,
  showSpec: true,
  showInner: true,
  showFill: true,
  showStroke: true,
  showBadgeSurface: true,
  showButtonSurface: true,
}

export function cardSettingsToUniforms(s: CardSettings): Record<string, number> {
  return {
    uWarm: s.warm,
    uPeach: s.peach,
    uGreen: s.green,
    uBandFreq: s.bandFreq,
    uBandStr: s.bandStr,
    uWarp: s.warp,
    uSpecGain: s.specGain,
    uRimRefract: s.rimRefract,
    uShowWarm: s.showWarm ? 1 : 0,
    uShowRim: s.showRim ? 1 : 0,
    uShowSpec: s.showSpec ? 1 : 0,
    uShowInner: s.showInner ? 1 : 0,
    uShowFill: s.showFill ? 1 : 0,
    uShowStroke: s.showStroke ? 1 : 0,
  }
}

// Shared store so the card and its controls stay in sync.
let current: CardSettings = DEFAULT_CARD_SETTINGS
const listeners = new Set<() => void>()

export function setCardSettings(next: CardSettings): void {
  current = next
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function useCardSettings(): CardSettings {
  return useSyncExternalStore(subscribe, () => current)
}
