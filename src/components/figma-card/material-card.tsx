import { lazy, Suspense } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const CardSurface = lazy(() =>
  import('./card-surface').then((m) => ({ default: m.CardSurface })),
)

/**
 * The Materials-Raw card (Figma 1:1351) rebuilt on shadcn primitives. The Card,
 * Badge, and Button components are the DEFAULT shadcn elements — layout,
 * typography, radius, spacing, semantics all theirs. Only the SURFACES are
 * inherited from the Figma reference:
 *   - Card background  -> warm flowing glass material (WebGL, card-material.ts)
 *   - Badge background -> light frosted glass (CSS backdrop-blur + gradient rim)
 *   - Button background-> glossy dark glass (CSS gradient + sheen + gradient rim)
 */
export function MaterialCard() {
  return (
    <Card className="relative w-full max-w-[853px] overflow-hidden rounded-[29px] border-0 p-0 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)]">
      {/* Inherited card surface */}
      <Suspense fallback={<div className="absolute inset-0 bg-background" />}>
        <CardSurface />
      </Suspense>

      <CardContent className="relative z-10 flex flex-col gap-0 p-8">
        {/* Frosted-glass badge (shadcn Badge, surface inherited) */}
        <Badge
          variant="secondary"
          className={cn(
            'h-auto gap-2 self-start rounded-[19px] border px-4 py-2 text-sm font-medium text-foreground',
            'border-white/60 bg-white/25 shadow-sm backdrop-blur-md',
          )}
        >
          <span className="size-2 rounded-full bg-foreground" />
          Housing &amp; Property Category
        </Badge>

        <h2 className="mt-16 text-4xl font-bold tracking-tight text-foreground">
          Housing &amp; Property
        </h2>

        <p className="mt-6 max-w-[520px] text-base leading-relaxed text-[#4b4b4b]">
          A government services directory organised into repeated category groups.
          Each group follows the same dimensions, spacing, card anatomy, and action
          placement, allowing users to learn the structure once and scan every
          following section without reinterpreting the interface.
        </p>

        {/* Glossy dark-glass button (shadcn Button, surface inherited) */}
        <Button
          className={cn(
            'mt-14 h-auto self-start rounded-[21px] border px-7 py-3 text-base font-normal',
            'border-white/15 text-white',
            'bg-[radial-gradient(120%_140%_at_30%_-20%,#3a3a3a_0%,#111_45%,#000_100%)]',
            'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_10px_24px_-8px_rgba(0,0,0,0.55)]',
            'hover:brightness-125',
          )}
        >
          See more
        </Button>
      </CardContent>
    </Card>
  )
}
