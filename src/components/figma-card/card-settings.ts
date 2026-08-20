import { useSyncExternalStore } from 'react'

export interface CardSettings {
  // Pattern Refraction chain calibration (button-experiment conventions)
  fxGain: number // displacement gain
  fxStrip: number // Figma R% -> port stripWidth factor
  fxFrost: number // frost jitter scale
  fxDisp: number // dispersion scale
  // glass calibration
  glassScale: number // K_REFRACT px
  glassDisp: number // K_DISP px
  specGain: number
  // layer toggles (real Figma layers)
  showSolid: boolean
  showFx: boolean
  showFxFx: boolean // the refraction chain (off = plain peach fill)
  showGlass: boolean
  showGlassFill: boolean
  showInner: boolean
  showStroke: boolean
  // DOM surface toggles
  showBadgeSurface: boolean
  showButtonSurface: boolean
}

// Figma node values live in the shader; these are the calibration knobs,
// defaults carried over from the button-experiment calibration.
export const DEFAULT_CARD_SETTINGS: CardSettings = {
  fxGain: 28,
  fxStrip: 1.0,
  fxFrost: 0.5,
  fxDisp: 3,
  glassScale: 30,
  glassDisp: 0, // dispersion visual default off, like the button experiment
  specGain: 0.5,
  showSolid: true,
  showFx: true,
  showFxFx: true,
  showGlass: true,
  showGlassFill: true,
  showInner: true,
  showStroke: true,
  showBadgeSurface: true,
  showButtonSurface: true,
}

export function cardSettingsToUniforms(s: CardSettings): Record<string, number> {
  return {
    uFxGain: s.fxGain,
    uFxStrip: s.fxStrip,
    uFxFrost: s.fxFrost,
    uFxDisp: s.fxDisp,
    uGlassScale: s.glassScale,
    uGlassDisp: s.glassDisp,
    uSpecGain: s.specGain,
    uShowSolid: s.showSolid ? 1 : 0,
    uShowFx: s.showFx ? 1 : 0,
    uShowFxFx: s.showFxFx ? 1 : 0,
    uShowGlass: s.showGlass ? 1 : 0,
    uShowGlassFill: s.showGlassFill ? 1 : 0,
    uShowInner: s.showInner ? 1 : 0,
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
