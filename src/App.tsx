import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
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
      <main className="mx-auto flex min-h-svh max-w-3xl flex-col items-center justify-center gap-8 px-6 py-16">
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
              <div className="flex gap-3">
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
