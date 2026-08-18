import { lazy, Suspense } from 'react'
import { motion } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const ShaderBackground = lazy(() =>
  import('@/components/shader-background').then((m) => ({ default: m.ShaderBackground })),
)

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
    <div className="dark min-h-svh text-foreground">
      <Suspense fallback={<div className="fixed inset-0 -z-10 bg-[#0a0b17]" />}>
        <ShaderBackground />
      </Suspense>

      <main className="mx-auto flex min-h-svh max-w-3xl flex-col items-center justify-center gap-8 px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full"
        >
          <Card className="border-white/10 bg-white/5 shadow-2xl shadow-black/40 backdrop-blur-2xl">
            <CardHeader>
              <Badge variant="secondary" className="mb-2 w-fit bg-white/10 text-white/80">
                Live on GitHub Pages
              </Badge>
              <CardTitle className="text-3xl tracking-tight text-white">web-lab</CardTitle>
              <CardDescription className="text-white/60">
                A minimal, fast base for modern interfaces: real GLSL shaders in the
                background, glass surfaces in the foreground, and a full component
                system ready underneath.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {stack.map((item) => (
                  <li
                    key={item.name}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  >
                    <p className="text-sm font-medium text-white">{item.name}</p>
                    <p className="text-xs text-white/50">{item.role}</p>
                  </li>
                ))}
              </ul>
              <div className="flex gap-3">
                <Button asChild className="bg-white text-black hover:bg-white/85">
                  <a href="https://github.com/AmroJSawan/web-lab">Repository</a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
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
