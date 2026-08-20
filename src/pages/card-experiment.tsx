import { motion } from 'motion/react'
import { CardLab } from '@/components/figma-card/card-lab'

export function CardExperiment() {
  return (
    <main className="mx-auto flex min-h-svh max-w-5xl flex-col items-center justify-center gap-6 px-6 py-16">
      <p className="text-sm text-muted-foreground">
        Experiment 02: Figma material card — shadcn primitives, inherited surfaces
      </p>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full"
      >
        <CardLab />
      </motion.div>
    </main>
  )
}
