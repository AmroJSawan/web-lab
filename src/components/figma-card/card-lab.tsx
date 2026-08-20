import { MaterialCard } from './material-card'
import {
  DEFAULT_CARD_SETTINGS,
  setCardSettings,
  useCardSettings,
  type CardSettings,
} from './card-settings'

const SURFACE_TOGGLES: Array<{ key: keyof CardSettings; label: string }> = [
  { key: 'showWarm', label: 'Warm flow material' },
  { key: 'showRim', label: 'Glass rim refraction' },
  { key: 'showSpec', label: 'Glass specular + fresnel' },
  { key: 'showInner', label: 'Inner shadow glow' },
  { key: 'showFill', label: 'Glass fill (20%)' },
  { key: 'showStroke', label: 'Gradient stroke' },
  { key: 'showBadgeSurface', label: 'Badge frosted glass' },
  { key: 'showButtonSurface', label: 'Button dark glass' },
]

const SLIDERS: Array<{
  key: keyof CardSettings
  label: string
  min: number
  max: number
  step: number
}> = [
  { key: 'warm', label: 'Warm intensity', min: 0, max: 2, step: 0.01 },
  { key: 'peach', label: 'Peach amount', min: 0, max: 2, step: 0.01 },
  { key: 'green', label: 'Green band amount', min: 0, max: 1.5, step: 0.01 },
  { key: 'bandFreq', label: 'Flow band frequency', min: 2, max: 40, step: 0.5 },
  { key: 'bandStr', label: 'Flow band strength', min: 0, max: 1, step: 0.01 },
  { key: 'warp', label: 'Domain warp', min: 0, max: 3, step: 0.01 },
  { key: 'specGain', label: 'Specular gain', min: 0, max: 2, step: 0.01 },
  { key: 'rimRefract', label: 'Rim refraction (px)', min: 0, max: 80, step: 0.5 },
]

/** QA harness: the material card plus per-surface toggles and calibration controls. */
export function CardLab() {
  const settings = useCardSettings()
  const set = (key: keyof CardSettings, value: boolean | number) =>
    setCardSettings({ ...settings, [key]: value })

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <MaterialCard />

      <div className="grid w-full max-w-3xl gap-6 rounded-xl border bg-card p-5 sm:grid-cols-2">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Surfaces</legend>
          {SURFACE_TOGGLES.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-foreground"
                checked={settings[key] as boolean}
                onChange={(e) => set(key, e.target.checked)}
              />
              {label}
            </label>
          ))}
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-medium">Calibration</legend>
          {SLIDERS.map(({ key, label, min, max, step }) => (
            <label key={key} className="flex flex-col gap-1 text-sm">
              <span className="flex justify-between text-xs text-muted-foreground">
                <span>{label}</span>
                <span className="tabular-nums">{settings[key] as number}</span>
              </span>
              <input
                type="range"
                className="accent-foreground"
                min={min}
                max={max}
                step={step}
                value={settings[key] as number}
                onChange={(e) => set(key, Number(e.target.value))}
              />
            </label>
          ))}
          <button
            type="button"
            className="mt-1 self-start rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
            onClick={() => setCardSettings(DEFAULT_CARD_SETTINGS)}
          >
            Reset to defaults
          </button>
        </fieldset>
      </div>
    </div>
  )
}
