import { Canvas, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { cardFragmentShader, cardVertexShader } from './card-material'
import {
  cardSettingsToUniforms,
  DEFAULT_CARD_SETTINGS,
  type CardSettings,
} from './card-settings'

interface QuadProps {
  width: number
  height: number
  radius: number
  settings: CardSettings
  onReady?: () => void
}

function CardQuad({ width, height, radius, settings, onReady }: QuadProps) {
  const material = useRef<THREE.ShaderMaterial>(null)
  const invalidate = useThree((s) => s.invalidate)
  const fired = useRef(false)

  useEffect(() => {
    if (!material.current) return
    const u = material.current.uniforms
    u.uSize.value.set(width, height)
    u.uRadius.value = radius
    for (const [k, v] of Object.entries(cardSettingsToUniforms(settings))) {
      if (u[k]) u[k].value = v
    }
    invalidate()
    if (!fired.current) {
      fired.current = true
      requestAnimationFrame(() => onReady?.())
    }
  }, [width, height, radius, settings, invalidate, onReady])

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        vertexShader={cardVertexShader}
        fragmentShader={cardFragmentShader}
        transparent
        premultipliedAlpha
        uniforms={{
          uSize: { value: new THREE.Vector2(width, height) },
          uRadius: { value: radius },
          ...Object.fromEntries(
            Object.entries(cardSettingsToUniforms(DEFAULT_CARD_SETTINGS)).map(([k, v]) => [
              k,
              { value: v },
            ]),
          ),
        }}
      />
    </mesh>
  )
}

interface CardSurfaceProps {
  radius?: number
  settings?: CardSettings
  fadeIn?: boolean
  onReady?: () => void
}

/** Full-bleed WebGL material surface, clipped by the parent's rounded corners. */
export function CardSurface({
  radius = 29,
  settings = DEFAULT_CARD_SETTINGS,
  fadeIn = true,
  onReady,
}: CardSurfaceProps) {
  const wrap = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  const [painted, setPainted] = useState(!fadeIn)

  useLayoutEffect(() => {
    if (!wrap.current) return
    const el = wrap.current
    const measure = () => {
      const parent = el.parentElement
      if (parent) setSize({ w: parent.clientWidth, h: parent.clientHeight })
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (el.parentElement) observer.observe(el.parentElement)
    return () => observer.disconnect()
  }, [])

  const scaledRadius = size ? radius * (size.w / 853.01) : radius

  return (
    <div
      ref={wrap}
      className="pointer-events-none absolute inset-0"
      style={{ opacity: painted ? 1 : 0, transition: 'opacity 500ms ease' }}
    >
      {size && (
        <Canvas
          dpr={[1, 2]}
          frameloop="demand"
          gl={{ antialias: true, alpha: true, premultipliedAlpha: true }}
          style={{ position: 'absolute', inset: 0 }}
          orthographic
        >
          <CardQuad
            width={size.w}
            height={size.h}
            radius={scaledRadius}
            settings={settings}
            onReady={() => {
              setPainted(true)
              onReady?.()
            }}
          />
        </Canvas>
      )}
    </div>
  )
}
