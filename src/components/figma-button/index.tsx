import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { FRAME_H, FRAME_W, fragmentShader, vertexShader } from './shader'
import '@fontsource/noto-kufi-arabic/400.css'

// Calibration values for Figma internals that aren't published; tuned against
// reference/figma-button@2x.png.
const CALIBRATION = {
  uWaveAmp: 58,
  uWaveLen: 145,
  uWaveAngle: (112 * Math.PI) / 180, // A = 472deg == 112deg
  uWaveOrigin: new THREE.Vector2(0.48, 0.5),
  uFrostBlur: 10,
  uFrostGrain: 0.025,
  uBlurSigma: 55, // Figma LAYER_BLUR 97.19 -> measured sigma ~0.568 * B
  uGlassScale: 28,
}

function GlassQuad() {
  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        premultipliedAlpha
        uniforms={{
          uSize: { value: new THREE.Vector2(FRAME_W, FRAME_H) },
          uPageBg: { value: new THREE.Color('#1e1e1e') },
          uPageBgAlpha: { value: 0 },
          ...Object.fromEntries(Object.entries(CALIBRATION).map(([k, v]) => [k, { value: v }])),
        }}
      />
    </mesh>
  )
}

/**
 * Pixel-parity replica of Figma frame 48751:1336 ("Frame 19"): wave pattern
 * refraction + blurred solid + glass + gradient rim, with the text layer on
 * top in DOM exactly as in the Figma layer stack.
 */
export function FigmaButton({ scale = 1 }: { scale?: number }) {
  return (
    <div
      className="relative"
      style={{ width: FRAME_W * scale, height: FRAME_H * scale }}
    >
      <div
        className="absolute inset-0"
        style={{ width: FRAME_W, height: FRAME_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}
      >
        <Canvas
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true, premultipliedAlpha: true }}
          style={{ width: FRAME_W, height: FRAME_H }}
          orthographic
        >
          <GlassQuad />
        </Canvas>
        {/* Text node 48751:1352 "Hello": Noto Kufi Arabic 400 @110.68px,
            letter-spacing -6%, box 243x210 at (269.78, 21.84), v-centered */}
        <div
          className="pointer-events-none absolute flex items-center"
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
    </div>
  )
}
