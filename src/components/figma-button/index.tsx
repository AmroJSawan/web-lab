import { Canvas } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { FRAME_H, FRAME_W, fragmentShader, vertexShader } from './shader'
import '@fontsource/noto-kufi-arabic/400.css'

export interface ButtonSettings {
  // Pattern Refraction — exact Figma parameters (node values as fractions)
  prStrength: number
  prSmoothness: number
  prFrost: number
  prDispersion: number
  prStripWidth: number
  prAngle: number // degrees
  // Engine internals still calibrated
  blurSigma: number
  glassScale: number
  specGain: number
  showA: boolean
  showWave: boolean
  showB: boolean
  showGlass: boolean
  showGlassFill: boolean
  showInnerShadow: boolean
  showStroke: boolean
  showText: boolean
}

// Tuned against reference/figma-button@2x.png. Figma-published values live in
// the shader as constants; these cover the unpublished internals.
export const DEFAULT_SETTINGS: ButtonSettings = {
  prStrength: 0.61, // Strength 61
  prSmoothness: 0, // Smoothness 0
  prFrost: 1, // Frost 100
  prDispersion: 0, // Dispersion 0
  prStripWidth: 0.12, // Transform R 12
  prAngle: 472, // Transform A 472deg
  blurSigma: 55, // Figma LAYER_BLUR 97.19 -> measured sigma ~0.568 * B
  glassScale: 28,
  specGain: 0.45,
  showA: true,
  showWave: true,
  showB: true,
  showGlass: true,
  showGlassFill: true,
  showInnerShadow: true,
  showStroke: true,
  showText: true,
}

function settingsToUniforms(s: ButtonSettings): Record<string, number> {
  return {
    uPRStrength: s.prStrength,
    uPRSmooth: s.prSmoothness,
    uPRFrost: s.prFrost,
    uPRDispersion: s.prDispersion,
    uPRStripWidth: Math.max(0.001, s.prStripWidth),
    uPRAngle: s.prAngle,
    uBlurSigma: s.blurSigma,
    uGlassScale: s.glassScale,
    uSpecGain: s.specGain,
    uShowA: s.showA ? 1 : 0,
    uShowWave: s.showWave ? 1 : 0,
    uShowB: s.showB ? 1 : 0,
    uShowGlass: s.showGlass ? 1 : 0,
    uShowGlassFill: s.showGlassFill ? 1 : 0,
    uShowInnerShadow: s.showInnerShadow ? 1 : 0,
    uShowStroke: s.showStroke ? 1 : 0,
  }
}

function GlassQuad({ settings }: { settings: ButtonSettings }) {
  const material = useRef<THREE.ShaderMaterial>(null)

  useEffect(() => {
    if (!material.current) return
    const uniforms = material.current.uniforms
    for (const [key, value] of Object.entries(settingsToUniforms(settings))) {
      if (uniforms[key]) uniforms[key].value = value
    }
  }, [settings])

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        premultipliedAlpha
        uniforms={{
          uSize: { value: new THREE.Vector2(FRAME_W, FRAME_H) },
          uPageBg: { value: new THREE.Color('#1e1e1e') },
          uPageBgAlpha: { value: 0 },
          uPRCenter: { value: new THREE.Vector2(0.48, 0.5) }, // Transform X 48% Y 50%
          ...Object.fromEntries(
            Object.entries(settingsToUniforms(DEFAULT_SETTINGS)).map(([k, v]) => [k, { value: v }]),
          ),
        }}
      />
    </mesh>
  )
}

interface FigmaButtonProps {
  scale?: number
  fit?: boolean // scale down to the container width when it is narrower
  settings?: ButtonSettings
}

/**
 * Pixel-parity replica of Figma frame 48751:1336 ("Frame 19"): wave pattern
 * refraction + blurred solid + glass + gradient rim, with the text layer on
 * top in DOM exactly as in the Figma layer stack.
 */
export function FigmaButton({ scale = 1, fit = false, settings = DEFAULT_SETTINGS }: FigmaButtonProps) {
  const container = useRef<HTMLDivElement>(null)
  const [fitScale, setFitScale] = useState(1)

  useLayoutEffect(() => {
    if (!fit || !container.current) return
    const el = container.current
    const measure = () => {
      const parentWidth = el.parentElement?.clientWidth ?? FRAME_W
      setFitScale(Math.min(1, parentWidth / FRAME_W))
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (el.parentElement) observer.observe(el.parentElement)
    return () => observer.disconnect()
  }, [fit])

  const s = fit ? fitScale * scale : scale

  return (
    <div ref={container} className="relative" style={{ width: FRAME_W * s, height: FRAME_H * s }}>
      {/* The shader draws in normalized UV, so the canvas can render at any
          size directly — no CSS transform (R3F measures transformed rects,
          which would double-apply the scale). */}
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, premultipliedAlpha: true }}
        style={{ position: 'absolute', inset: 0 }}
        orthographic
      >
        <GlassQuad settings={settings} />
      </Canvas>
      {/* Text node 48751:1352 "Hello": Noto Kufi Arabic 400 @110.68px,
          letter-spacing -6%, box 243x210 at (269.78, 21.84), v-centered.
          Laid out at full frame size, scaled as one plane. */}
      {settings.showText && (
        <div
          className="pointer-events-none absolute left-0 top-0"
          style={{ width: FRAME_W, height: FRAME_H, transform: `scale(${s})`, transformOrigin: 'top left' }}
        >
          <div
            className="absolute flex items-center"
            style={{
              left: 269.776,
              top: 21.836,
              width: 243,
              height: 210,
              fontFamily: '"Noto Kufi Arabic", sans-serif',
              fontWeight: 400,
              fontSize: 110.678,
              letterSpacing: '-0.06em',
              color: '#000',
              whiteSpace: 'nowrap',
            }}
          >
            Hello
          </div>
        </div>
      )}
    </div>
  )
}
