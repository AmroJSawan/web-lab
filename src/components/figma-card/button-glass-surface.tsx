import { Canvas, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { buttonGlassFragmentShader, buttonGlassVertexShader } from './button-glass'
import type { CardSettings } from './card-settings'

interface QuadProps {
  width: number
  height: number
  radius: number // design px
  settings: CardSettings
}

function ButtonQuad({ width, height, radius, settings }: QuadProps) {
  const material = useRef<THREE.ShaderMaterial>(null)
  const invalidate = useThree((s) => s.invalidate)

  useEffect(() => {
    if (!material.current) return
    const u = material.current.uniforms
    u.uSize.value.set(width, height)
    u.uRadius.value = radius
    u.uGlassScale.value = settings.glassScale
    u.uGlassDisp.value = settings.glassDisp
    u.uSpecGain.value = settings.specGain
    invalidate()
  }, [width, height, radius, settings, invalidate])

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        vertexShader={buttonGlassVertexShader}
        fragmentShader={buttonGlassFragmentShader}
        transparent
        premultipliedAlpha
        uniforms={{
          uSize: { value: new THREE.Vector2(width, height) },
          uRadius: { value: radius },
          uGlassScale: { value: settings.glassScale },
          uGlassDisp: { value: settings.glassDisp },
          uSpecGain: { value: settings.specGain },
        }}
      />
    </mesh>
  )
}

/** Paint-only dark glass surface for the shadcn Button (same glass model as the card). */
export function ButtonGlassSurface({ settings }: { settings: CardSettings }) {
  const wrap = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<{ w: number; h: number; r: number } | null>(null)

  useLayoutEffect(() => {
    if (!wrap.current) return
    const el = wrap.current
    const measure = () => {
      const parent = el.parentElement
      if (!parent) return
      const radiusPx = parseFloat(getComputedStyle(parent).borderTopLeftRadius) || 8
      setSize({ w: parent.clientWidth, h: parent.clientHeight, r: radiusPx })
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (el.parentElement) observer.observe(el.parentElement)
    return () => observer.disconnect()
  }, [])

  // real DOM radius -> design-space px so the glass follows the default form
  const designRadius = size ? size.r * (147.4 / size.w) : 21

  return (
    <div ref={wrap} className="pointer-events-none absolute inset-0">
      {size && (
        <Canvas
          dpr={[1, 2]}
          frameloop="demand"
          gl={{ antialias: true, alpha: true, premultipliedAlpha: true }}
          style={{ position: 'absolute', inset: 0 }}
          orthographic
        >
          <ButtonQuad width={size.w} height={size.h} radius={designRadius} settings={settings} />
        </Canvas>
      )}
    </div>
  )
}
