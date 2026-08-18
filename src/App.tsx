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
import { useSystemTheme } from '@/hooks/use-system-theme'
import { resolveBrowserCanvas } from '@/lib/browser-canvas'
import { useEffect, useMemo } from 'react'

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
  const theme = useSystemTheme()
  const browserCanvas = useMemo(() => resolveBrowserCanvas(theme), [theme])

  useEffect(() => {
    // Tint the browser chrome with the exact same color the page rests on.
    const meta = document.querySelector<HTMLMetaElement>(
      `meta[name="theme-color"][media="(prefers-color-scheme: ${theme})"]`,
    )
    meta?.setAttribute('content', browserCanvas)
  }, [theme, browserCanvas])

  return (
    <div className="min-h-svh text-foreground">
      <main className="mx-auto flex min-h-svh max-w-3xl flex-col items-center justify-center gap-8 px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full"
        >
          <Card className="border-foreground/10 bg-background/40 shadow-2xl shadow-black/10 backdrop-blur-2xl dark:bg-white/5 dark:shadow-black/40">
            <CardHeader>
              <Badge variant="secondary" className="mb-2 w-fit bg-foreground/10">
                Follows your browser theme
              </Badge>
              <CardTitle className="text-3xl tracking-tight">web-lab</CardTitle>
              <CardDescription>
                A minimal, fast base for modern interfaces. The page rests on your
                browser's own background color and follows its light or dark scheme,
                live.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {stack.map((item) => (
                  <li
                    key={item.name}
                    className="rounded-lg border border-foreground/10 bg-background/30 px-3 py-2 dark:bg-white/5"
                  >
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.role}</p>
                  </li>
                ))}
              </ul>
              <div className="flex gap-3">
                <Button asChild>
                  <a href="https://github.com/AmroJSawan/web-lab">Repository</a>
                </Button>
                <Button asChild variant="outline" className="bg-transparent">
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
