import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { FRAME_H, FRAME_W, fragmentShader, vertexShader } from './shader'
import waveTextureUrl from './wave-texture.png'
import '@fontsource/noto-kufi-arabic/400.css'

export interface ButtonSettings {
  // Pattern Refraction — exact Figma parameters (node values as fractions)
  prStrength: number
  prSmoothness: number
  prFrost: number
  prDispersion: number
  prStripWidth: number
  prAngle: number // degrees
  prGain: number // displacement gain vs the port's normalized constant
  waveProcedural: boolean // true = procedural chain, false = baked ground truth
  // Engine internals still calibrated
  blurSigma: number
  glassScale: number
  glassDisp: number
  glassFrost: number
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

// Figma node values; engine internals tuned against reference/figma-button@2x.png.
export const DEFAULT_SETTINGS: ButtonSettings = {
  prStrength: 0.61, // Strength 61
  prSmoothness: 0, // Smoothness 0
  prFrost: 1, // Frost 100
  prDispersion: 0, // Dispersion 0
  prStripWidth: 0.3, // Transform R 12% -> ~0.3 in port UV space (calibrated vs fx-wave-only isolate)
  prAngle: 472, // Transform A 472deg
  prGain: 30, // calibrated against reference/layers/fx-wave-only@2x.png
  waveProcedural: true, // procedural Pattern Refraction chain by default (baked texture behind the toggle)
  blurSigma: 55, // Figma LAYER_BLUR 97.19 -> measured sigma ~0.568 * B
  glassScale: 6, // K_REFRACT: near-clean edge — the Figma reference shows no visible rim ring
  glassDisp: 0, // dispersion off by default (slider re-enables the rainbow fringe)
  glassFrost: 1.0, // Figma frost radius as-is
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
    uPRGain: s.prGain,
    uWaveProcedural: s.waveProcedural ? 1 : 0,
    uBlurSigma: s.blurSigma,
    uGlassScale: s.glassScale,
    uGlassDisp: s.glassDisp,
    uGlassFrost: s.glassFrost,
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

interface GlassQuadProps {
  settings: ButtonSettings
  width: number
  height: number
}

function GlassQuad({ settings, width, height }: GlassQuadProps) {
  const material = useRef<THREE.ShaderMaterial>(null)
  const invalidate = useThree((state) => state.invalidate)

  // Baked ground-truth wave layer (frame-aligned 2x export from Figma)
  const waveTexture = useMemo(() => {
    const tex = new THREE.TextureLoader().load(waveTextureUrl, () => invalidate())
    tex.minFilter = THREE.LinearMipmapLinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.generateMipmaps = true
    tex.anisotropy = 4
    return tex
  }, [invalidate])

  // Demand rendering: sync uniforms on every change, then request one frame.
  useEffect(() => {
    if (!material.current) return
    const uniforms = material.current.uniforms
    uniforms.uSize.value.set(width, height)
    for (const [key, value] of Object.entries(settingsToUniforms(settings))) {
      if (uniforms[key]) uniforms[key].value = value
    }
    invalidate()
  }, [settings, width, height, invalidate])

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
          uSize: { value: new THREE.Vector2(width, height) },
          uPageBg: { value: new THREE.Color('#1e1e1e') },
          uPageBgAlpha: { value: 0 },
          uPRCenter: { value: new THREE.Vector2(0.48, 0.5) }, // Transform X 48% Y 50%
          uWaveTex: { value: waveTexture },
          ...Object.fromEntries(
            Object.entries(settingsToUniforms(DEFAULT_SETTINGS)).map(([k, v]) => [k, { value: v }]),
          ),
        }}
      />
    </mesh>
  )
}

/** Fires once, after the shader has actually painted its first frame. */
function FirstFrame({ onReady }: { onReady?: () => void }) {
  const fired = useRef(false)
  useFrame(() => {
    if (fired.current) return
    fired.current = true
    onReady?.()
  })
  return null
}

interface GlassMaterialCanvasProps extends GlassQuadProps {
  onReady?: () => void
  fadeIn?: boolean
}

/** The Figma material rendered on a quad of arbitrary size (size-relative geometry). */
export function GlassMaterialCanvas({ settings, width, height, onReady, fadeIn = false }: GlassMaterialCanvasProps) {
  // Matches the shader's BLEED_PX: room for the centered stroke's outer half.
  const bleed = 0.02 * height
  const [painted, setPainted] = useState(!fadeIn)
  return (
    <Canvas
      dpr={[1, 2]}
      frameloop="demand"
      gl={{ antialias: true, alpha: true, premultipliedAlpha: true }}
      style={{
        position: 'absolute',
        inset: -bleed,
        pointerEvents: 'none',
        opacity: painted ? 1 : 0,
        transition: 'opacity 500ms ease',
      }}
      orthographic
    >
      <GlassQuad settings={settings} width={width} height={height} />
      <FirstFrame
        onReady={() => {
          setPainted(true)
          onReady?.()
        }}
      />
    </Canvas>
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
  const [materialReady, setMaterialReady] = useState(false)

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
    <div
      ref={container}
      className="relative transition-colors duration-500"
      style={{
        width: FRAME_W * s,
        height: FRAME_H * s,
        // Plain placeholder pill (frame geometry, shadcn-style surface) shown
        // instantly; fades out once the material has painted its first frame.
        borderRadius: 97.996 * s,
        border: materialReady ? '1px solid transparent' : '1px solid var(--input)',
        backgroundColor: materialReady ? 'transparent' : 'var(--background)',
        boxShadow: materialReady ? 'none' : '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      }}
    >
      <GlassMaterialCanvas
        settings={settings}
        width={FRAME_W * s}
        height={FRAME_H * s}
        fadeIn
        onReady={() => setMaterialReady(true)}
      />
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
              color: materialReady ? '#000' : 'var(--foreground)',
              transition: 'color 500ms ease',
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
