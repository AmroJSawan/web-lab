import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { GlassMaterialCanvas, type ButtonSettings } from './index'
import { useSharedSettings } from './settings-store'
import { cn } from '@/lib/utils'

interface MaterialButtonProps {
  children: ReactNode
  settings?: ButtonSettings
  className?: string
}

/**
 * A control with the exact geometry/typography of the shadcn/ui button
 * (size default: h-9, px-4, py-2, text-sm font-medium, rounded-md) but with
 * the Figma glass material inherited and rendered independently at the
 * button's own dimensions.
 *
 * Progressive loading: it first paints instantly as a plain shadcn outline
 * button; once the shader has rendered its first frame, the material fades in
 * and the plain border/background fade out.
 */
export function MaterialButton({ children, settings, className }: MaterialButtonProps) {
  const el = useRef<HTMLButtonElement>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  const [materialReady, setMaterialReady] = useState(false)
  // Inherit the live shared calibration unless explicitly overridden
  const shared = useSharedSettings()
  const applied = settings ?? shared

  useLayoutEffect(() => {
    if (!el.current) return
    const measure = () => {
      const rect = el.current!.getBoundingClientRect()
      setSize({ w: rect.width, h: rect.height })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el.current)
    return () => observer.disconnect()
  }, [])

  return (
    <button
      ref={el}
      type="button"
      className={cn(
        // shadcn Button geometry + typography (variant outline, size default)
        'relative inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap outline-none',
        // plain shadcn outline visuals until the material has painted
        'border shadow-xs transition-colors duration-500',
        materialReady ? 'border-transparent bg-transparent shadow-none' : 'border-input bg-background',
        className,
      )}
    >
      {size && (
        <GlassMaterialCanvas
          settings={applied}
          width={size.w}
          height={size.h}
          fadeIn
          onReady={() => setMaterialReady(true)}
        />
      )}
      <span className={cn('relative z-10', materialReady ? 'text-black' : 'text-foreground')}>
        {children}
      </span>
    </button>
  )
}
