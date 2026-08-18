import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uDark; // 1.0 = dark scheme, 0.0 = light scheme
  uniform vec3 uBase;  // the browser's own Canvas color — the resting background

  // Soft flowing tint over the browser's native background color
  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

    float t = uTime * 0.08;
    float wave =
      sin(p.x * 3.0 + t * 2.0) * 0.25 +
      sin(p.y * 4.0 - t * 3.0) * 0.25 +
      sin((p.x + p.y) * 5.0 + t) * 0.15;

    vec3 primary = mix(vec3(0.72, 0.74, 0.96), vec3(0.16, 0.14, 0.42), uDark);
    vec3 accent = mix(vec3(0.62, 0.84, 0.92), vec3(0.10, 0.42, 0.52), uDark);

    vec3 color = uBase;
    float blob1 = smoothstep(1.1, 0.0, length(p - vec2(sin(t) * 0.4, cos(t * 0.7) * 0.3)) + wave);
    float blob2 = smoothstep(0.5, 0.0, length(p + vec2(cos(t * 0.9) * 0.5, sin(t * 0.6) * 0.35)));

    // Fade tint out toward the top edge so the page meets the browser chrome
    // at exactly the browser's own color.
    float edgeFade = smoothstep(1.0, 0.82, uv.y);
    color = mix(color, primary, blob1 * 0.4 * edgeFade);
    color = mix(color, accent, blob2 * 0.35 * edgeFade);

    // subtle grain to avoid banding
    float grain = fract(sin(dot(uv * uResolution, vec2(12.9898, 78.233))) * 43758.5453) * 0.02;
    gl_FragColor = vec4(color + grain * edgeFade, 1.0);
  }
`

interface GradientPlaneProps {
  dark: boolean
  base: [number, number, number]
}

function GradientPlane({ dark, base }: GradientPlaneProps) {
  const material = useRef<THREE.ShaderMaterial>(null)
  const target = useRef(new THREE.Color())

  useFrame((state, delta) => {
    if (!material.current) return
    const uniforms = material.current.uniforms
    uniforms.uTime.value = state.clock.elapsedTime
    uniforms.uResolution.value.set(state.size.width, state.size.height)
    // Ease between palettes instead of hard-switching
    uniforms.uDark.value = THREE.MathUtils.damp(uniforms.uDark.value, dark ? 1 : 0, 6, delta)
    target.current.setRGB(base[0], base[1], base[2])
    uniforms.uBase.value.lerp(target.current, 1 - Math.exp(-6 * delta))
  })

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uResolution: { value: new THREE.Vector2(1, 1) },
          uDark: { value: dark ? 1 : 0 },
          uBase: { value: new THREE.Color(base[0], base[1], base[2]) },
        }}
      />
    </mesh>
  )
}

export function ShaderBackground(props: GradientPlaneProps) {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas dpr={[1, 2]} gl={{ antialias: false, powerPreference: 'high-performance' }}>
        <GradientPlane {...props} />
      </Canvas>
    </div>
  )
}
