import { lazy, Suspense } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useCardSettings } from './card-settings'

const CardSurface = lazy(() =>
  import('./card-surface').then((m) => ({ default: m.CardSurface })),
)

/**
 * The Materials-Raw card (Figma 1:1351) built on shadcn primitives, with
 * SWAPPABLE surfaces. The Card, Badge, and Button are the default shadcn
 * elements; each surface can render either its plain shadcn default or the
 * surface inherited from the Figma reference:
 *   - Card background  -> flowing sand-glass material (WebGL) | bg-card
 *   - Badge background -> light frosted glass                 | secondary
 *   - Button background-> glossy dark glass                   | primary
 * The lab's per-surface toggles (or the Swap control) flip them live.
 */
export function MaterialCard() {
  const settings = useCardSettings()
  const cardSurface = settings.showCardSurface
  const badgeSurface = settings.showBadgeSurface
  const buttonSurface = settings.showButtonSurface

  return (
    <Card
      className={cn(
        'relative w-full max-w-[853px] overflow-hidden p-0 transition-all duration-500',
        cardSurface
          ? 'rounded-[29px] border-0 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)]'
          : 'rounded-xl border bg-card shadow-sm',
      )}
    >
      {/* Inherited card surface (only in material mode) */}
      {cardSurface && (
        <Suspense fallback={<div className="absolute inset-0 bg-background" />}>
          <CardSurface settings={settings} />
        </Suspense>
      )}

      <CardContent className="relative z-10 flex flex-col gap-0 p-8">
        {/* shadcn Badge; surface swappable */}
        <Badge
          variant="secondary"
          className={cn(
            'h-auto gap-2 self-start transition-all duration-500',
            badgeSurface
              ? 'rounded-[19px] border border-white/60 bg-white/25 px-4 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur-md'
              : 'px-2 py-0.5',
          )}
        >
          <span className={cn('rounded-full bg-foreground', badgeSurface ? 'size-2' : 'size-1.5')} />
          Housing &amp; Property Category
        </Badge>

        <h2 className="mt-16 text-4xl font-bold tracking-tight text-foreground">
          Housing &amp; Property
        </h2>

        <p
          className={cn(
            'mt-6 max-w-[520px] text-base leading-relaxed transition-colors duration-500',
            cardSurface ? 'text-[#4b4b4b]' : 'text-muted-foreground',
          )}
        >
          A government services directory organised into repeated category groups.
          Each group follows the same dimensions, spacing, card anatomy, and action
          placement, allowing users to learn the structure once and scan every
          following section without reinterpreting the interface.
        </p>

        {/* shadcn Button; surface swappable */}
        <Button
          className={cn(
            'mt-14 self-start transition-all duration-500',
            buttonSurface
              ? 'h-auto rounded-[21px] border border-white/15 px-7 py-3 text-base font-normal text-white bg-[radial-gradient(120%_140%_at_30%_-20%,#3a3a3a_0%,#111_45%,#000_100%)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_10px_24px_-8px_rgba(0,0,0,0.55)] hover:brightness-125'
              : '',
          )}
        >
          See more
        </Button>
      </CardContent>
    </Card>
  )
}
