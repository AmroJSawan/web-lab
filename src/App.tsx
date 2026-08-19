import { lazy, Suspense } from 'react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'

const FigmaButton = lazy(() =>
  import('@/components/figma-button').then((m) => ({ default: m.FigmaButton })),
)
const FigmaButtonLab = lazy(() =>
  import('@/components/figma-button/lab').then((m) => ({ default: m.FigmaButtonLab })),
)
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const stack = [
  { name: 'Vite 8', role: 'Build' },
  { name: 'React 19', role: 'UI runtime' },
  { name: 'TypeScript', role: 'Types' },
  { name: 'Tailwind v4', role: 'Styling' },
  { name: 'shadcn/ui', role: 'Components' },
  { name: 'Three.js + R3F', role: 'Shaders' },
  { name: 'Motion', role: 'Animation' },
]

export default function App() {
  return (
    <div className="min-h-svh text-foreground">
      <section className="flex flex-col items-center gap-4 px-6 pt-16">
        <p className="text-sm text-muted-foreground">
          Experiment 01: Figma shader parity — wave refraction + glass
        </p>
        <Suspense fallback={<div style={{ width: 782, height: 255 }} />}>
          <FigmaButtonLab />
        </Suspense>
      </section>

      <main className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-8 px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl tracking-tight">web-lab</CardTitle>
              <CardDescription>
                A minimal, fast base for modern interfaces, with a full component
                system underneath. Follows your system's light or dark scheme.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {stack.map((item) => (
                  <li key={item.name} className="rounded-lg border bg-muted/40 px-3 py-2">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.role}</p>
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-3">
                <Suspense fallback={<div style={{ width: 141, height: 46 }} />}>
                  <FigmaButton scale={0.18} />
                </Suspense>
                <Button asChild>
                  <a href="https://github.com/AmroJSawan/web-lab">Repository</a>
                </Button>
                <Button asChild variant="outline">
                  <a href="https://ui.shadcn.com">shadcn/ui docs</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
