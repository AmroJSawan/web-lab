import { useSyncExternalStore } from 'react'
import { ButtonExperiment } from '@/pages/button-experiment'
import { CardExperiment } from '@/pages/card-experiment'
import { CarouselExperiment } from '@/pages/carousel-experiment'
import { cn } from '@/lib/utils'

// Minimal hash router — no dependency, works on GitHub Pages sub-path.
function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}
function useHash() {
  return useSyncExternalStore(
    subscribe,
    () => window.location.hash || '#/button',
  )
}

const NAV = [
  { hash: '#/button', label: 'Button' },
  { hash: '#/card', label: 'Card' },
  { hash: '#/carousel', label: 'Carousel' },
]

export default function App() {
  const hash = useHash()
  const route = hash.startsWith('#/carousel')
    ? 'carousel'
    : hash.startsWith('#/card')
      ? 'card'
      : 'button'

  return (
    <div className="min-h-svh text-foreground">
      <nav className="sticky top-0 z-50 flex items-center gap-1 border-b bg-background/70 px-6 py-3 backdrop-blur">
        <span className="mr-3 text-sm font-semibold">web-lab</span>
        {NAV.map((item) => {
          const active = `#/${route}` === item.hash
          return (
            <a
              key={item.hash}
              href={item.hash}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm transition-colors',
                active ? 'bg-muted font-medium' : 'text-muted-foreground hover:bg-muted/60',
              )}
            >
              {item.label}
            </a>
          )
        })}
      </nav>

      {route === 'carousel' ? (
        <CarouselExperiment />
      ) : route === 'card' ? (
        <CardExperiment />
      ) : (
        <ButtonExperiment />
      )}
    </div>
  )
}
