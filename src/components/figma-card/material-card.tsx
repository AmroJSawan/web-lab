import { lazy, Suspense } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useCardSettings } from './card-settings'

const CardSurface = lazy(() =>
  import('./card-surface').then((m) => ({ default: m.CardSurface })),
)

/**
 * The Materials-Raw card content on the DEFAULT shadcn Card — canonical
 * anatomy (CardHeader/Title/Description/Content/Footer), default radius,
 * default border box, default Badge and Button geometry.
 *
 * The inherited Figma surfaces are PAINT-ONLY: swapping them has zero impact
 * on the form factor. The WebGL material clips to the card's real measured
 * corner radius; badge/button materials change only colors and shadows
 * (borders stay in the box via color swaps / inset rings, never new borders).
 */
export function MaterialCard() {
  const settings = useCardSettings()
  const cardSurface = settings.showCardSurface
  const badgeSurface = settings.showBadgeSurface
  const buttonSurface = settings.showButtonSurface

  return (
    <Card
      className={cn(
        // Default shadcn card form factor — identical in both modes
        'relative w-full max-w-[853px] overflow-hidden',
        'transition-colors duration-500',
        cardSurface && 'border-transparent bg-transparent',
      )}
    >
      {/* Inherited card surface: paint behind content, clipped to the default radius */}
      {cardSurface && (
        <Suspense fallback={null}>
          <CardSurface settings={settings} />
        </Suspense>
      )}

      <CardHeader className="relative z-10">
        {/* Default shadcn Badge; material mode changes colors only */}
        <Badge
          variant="secondary"
          className={cn(
            'mb-2 w-fit transition-colors duration-500',
            badgeSurface &&
              'border-white/60 bg-white/30 text-foreground shadow-sm backdrop-blur-md',
          )}
        >
          <span className="size-1.5 rounded-full bg-foreground" />
          Housing &amp; Property Category
        </Badge>
        <CardTitle className="text-2xl">Housing &amp; Property</CardTitle>
      </CardHeader>

      <CardContent className="relative z-10">
        <CardDescription
          className={cn(
            'max-w-[520px] text-base leading-relaxed transition-colors duration-500',
            cardSurface && 'text-[#4b4b4b]',
          )}
        >
          A government services directory organised into repeated category groups.
          Each group follows the same dimensions, spacing, card anatomy, and action
          placement, allowing users to learn the structure once and scan every
          following section without reinterpreting the interface.
        </CardDescription>
      </CardContent>

      <CardFooter className="relative z-10">
        {/* Default shadcn Button (size default); material mode is paint-only:
            gradient background + inset rim via shadows, no added borders */}
        <Button
          className={cn(
            'transition-all duration-500',
            buttonSurface &&
              'text-white bg-[radial-gradient(120%_140%_at_30%_-20%,#3a3a3a_0%,#111_45%,#000_100%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15),inset_0_1px_0_0_rgba(255,255,255,0.2),0_8px_20px_-8px_rgba(0,0,0,0.55)] hover:brightness-125',
          )}
        >
          See more
        </Button>
      </CardFooter>
    </Card>
  )
}
