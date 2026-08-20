import { motion } from 'motion/react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { MaterialCard } from '@/components/figma-card/material-card'
import { DEFAULT_CARD_SETTINGS, type CardSettings } from '@/components/figma-card/card-settings'

// Each slide shows the same card in a different surface preset.
const PRESETS: Array<{ name: string; settings: CardSettings }> = [
  {
    name: 'Neutral + liquid glass (current default)',
    settings: DEFAULT_CARD_SETTINGS,
  },
  {
    name: 'Figma peach',
    settings: { ...DEFAULT_CARD_SETTINGS, fxNeutral: 0 },
  },
  {
    name: 'Clear — no glass',
    settings: { ...DEFAULT_CARD_SETTINGS, showLiquidGlass: false },
  },
  {
    name: 'WebGL glass (researched model)',
    settings: {
      ...DEFAULT_CARD_SETTINGS,
      showLiquidGlass: false,
      showGlass: true,
      showGlassFill: true,
      showInner: true,
    },
  },
  {
    name: 'shadcn default',
    settings: {
      ...DEFAULT_CARD_SETTINGS,
      showCardSurface: false,
      showBadgeSurface: false,
      showButtonSurface: false,
    },
  },
]

export function CarouselExperiment() {
  return (
    <main className="mx-auto flex min-h-svh max-w-5xl flex-col items-center justify-center gap-6 px-6 py-16">
      <p className="text-sm text-muted-foreground">
        Experiment 03: the material card as a carousel — one card, five surface presets
      </p>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full"
      >
        <Carousel opts={{ loop: true }} className="mx-auto w-[calc(100%-6rem)]">
          <CarouselContent>
            {PRESETS.map(({ name, settings }) => (
              <CarouselItem key={name} className="flex flex-col items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground">{name}</span>
                <MaterialCard settings={settings} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </motion.div>
    </main>
  )
}
