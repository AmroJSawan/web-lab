import { Button } from '@/components/ui/button'
import { MaterialCard } from './material-card'
import {
  DEFAULT_CARD_SETTINGS,
  setCardSettings,
  useCardSettings,
  type CardSettings,
} from './card-settings'

const SURFACE_TOGGLES: Array<{ key: keyof CardSettings; label: string }> = [
  { key: 'showCardSurface', label: 'Card material surface' },
  { key: 'showSolid', label: 'Solid (blurred strip)' },
  { key: 'showFx', label: 'FX shader 4 (sand layer)' },
  { key: 'showFxFx', label: 'Pattern Refraction chain' },
  { key: 'fxProcedural', label: 'Procedural FX (vs baked ground truth)' },
  { key: 'showGlass', label: 'Glass refraction + specular' },
  { key: 'showGlassFill', label: 'Glass fill (20%)' },
  { key: 'showInner', label: 'Inner shadow glow' },
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
  { key: 'fxGain', label: 'PR displacement gain', min: 1, max: 100, step: 0.5 },
  { key: 'fxStrip', label: 'PR strip-width factor', min: 0.2, max: 8, step: 0.1 },
  { key: 'fxFrost', label: 'PR frost scale', min: 0, max: 3, step: 0.05 },
  { key: 'fxDisp', label: 'PR dispersion scale', min: 0, max: 5, step: 0.1 },
  { key: 'glassScale', label: 'Glass refraction K (px)', min: 0, max: 120, step: 1 },
  { key: 'glassDisp', label: 'Glass dispersion K (px)', min: 0, max: 120, step: 1 },
  { key: 'glassFrost', label: 'Glass frost smoothness', min: 0, max: 6, step: 0.1 },
  { key: 'specGain', label: 'Specular gain', min: 0, max: 2, step: 0.01 },
]

/** QA harness: the material card plus per-surface toggles and calibration controls. */
export function CardLab() {
  const settings = useCardSettings()
  const set = (key: keyof CardSettings, value: boolean | number) =>
    setCardSettings({ ...settings, [key]: value })

  const allMaterial =
    settings.showCardSurface && settings.showBadgeSurface && settings.showButtonSurface
  const swap = () =>
    setCardSettings({
      ...settings,
      showCardSurface: !allMaterial,
      showBadgeSurface: !allMaterial,
      showButtonSurface: !allMaterial,
    })

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          Surfaces: <span className="font-medium text-foreground">{allMaterial ? 'Figma material' : 'shadcn default'}</span>
        </span>
        <Button variant="outline" size="sm" onClick={swap}>
          Swap surfaces
        </Button>
      </div>
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
