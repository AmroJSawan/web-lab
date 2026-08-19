import { DEFAULT_SETTINGS, FigmaButton, type ButtonSettings } from './index'
import { MaterialButton } from './material-button'
import { setSharedSettings, useSharedSettings } from './settings-store'

const LAYER_TOGGLES: Array<{ key: keyof ButtonSettings; label: string }> = [
  { key: 'showA', label: 'FX shader 02 (wave layer)' },
  { key: 'showWave', label: 'Pattern Refraction effect' },
  { key: 'showB', label: 'Solid (blurred pill)' },
  { key: 'showGlass', label: 'Glass refraction + specular' },
  { key: 'showGlassFill', label: 'Glass fill (15% gradient)' },
  { key: 'showInnerShadow', label: 'Inner shadow' },
  { key: 'showStroke', label: 'Frame stroke' },
  { key: 'showText', label: 'Text "Hello"' },
]

const SLIDERS: Array<{
  key: keyof ButtonSettings
  label: string
  min: number
  max: number
  step: number
}> = [
  { key: 'prStrength', label: 'PR Strength (Figma: 61)', min: -1, max: 1, step: 0.01 },
  { key: 'prSmoothness', label: 'PR Smoothness (Figma: 0)', min: 0, max: 1, step: 0.01 },
  { key: 'prFrost', label: 'PR Frost (Figma: 100)', min: 0, max: 1, step: 0.01 },
  { key: 'prDispersion', label: 'PR Dispersion (Figma: 0)', min: 0, max: 1, step: 0.01 },
  { key: 'prStripWidth', label: 'PR Strip width (Figma R: 12)', min: 0.01, max: 1, step: 0.01 },
  { key: 'prAngle', label: 'PR Angle (Figma A: 472)', min: 0, max: 720, step: 1 },
  { key: 'prGain', label: 'PR displacement gain', min: 1, max: 100, step: 0.5 },
  { key: 'blurSigma', label: 'Solid blur sigma (px)', min: 0, max: 120, step: 0.5 },
  { key: 'glassScale', label: 'Glass refraction K (px)', min: 0, max: 120, step: 1 },
  { key: 'glassDisp', label: 'Glass dispersion K (px)', min: 0, max: 120, step: 1 },
  { key: 'specGain', label: 'Specular gain', min: 0, max: 2, step: 0.01 },
]

/** QA harness: the full-size button plus per-layer visibility and calibration controls. */
export function FigmaButtonLab() {
  const settings = useSharedSettings()

  const set = (key: keyof ButtonSettings, value: boolean | number) =>
    setSharedSettings({ ...settings, [key]: value })

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="w-full max-w-[820px] px-2">
        <FigmaButton fit settings={settings} />
      </div>

      {/* Same material on the real shadcn button geometry, driven by the same
          controls — the small-scale QA reference next to the full-size one. */}
      <div className="flex items-center gap-3">
        <MaterialButton>shadcn/ui docs</MaterialButton>
        <span className="text-xs text-muted-foreground">shadcn button, same material + controls</span>
      </div>

      <div className="grid w-full max-w-3xl gap-6 rounded-xl border bg-card p-5 sm:grid-cols-2">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Layers</legend>
          {LAYER_TOGGLES.map(({ key, label }) => (
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
            onClick={() => setSharedSettings(DEFAULT_SETTINGS)}
          >
            Reset to defaults
          </button>
        </fieldset>
      </div>
    </div>
  )
}
