import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { DEFAULT_SETTINGS, GlassMaterialCanvas, type ButtonSettings } from './index'

interface MaterialButtonProps {
  children: ReactNode
  settings?: ButtonSettings
  className?: string
}

/**
 * A control with the exact geometry/typography of the shadcn/ui button
 * (size default: h-9, px-4, py-2, text-sm font-medium, rounded-md) but with
 * the Figma glass material inherited and rendered independently at the
 * button's own dimensions — the shader geometry is size-relative, so the
 * material re-renders for this shape rather than being a scaled screenshot.
 */
export function MaterialButton({ children, settings = DEFAULT_SETTINGS, className }: MaterialButtonProps) {
  const el = useRef<HTMLButtonElement>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)

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
      className={
        // shadcn Button (variant outline geometry, material replaces bg/border)
        "relative inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap outline-none " +
        (className ?? '')
      }
    >
      {size && <GlassMaterialCanvas settings={settings} width={size.w} height={size.h} />}
      <span className="relative z-10 text-black">{children}</span>
    </button>
  )
}
