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

  // Soft flowing gradient field
  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

    float t = uTime * 0.08;
    float wave =
      sin(p.x * 3.0 + t * 2.0) * 0.25 +
      sin(p.y * 4.0 - t * 3.0) * 0.25 +
      sin((p.x + p.y) * 5.0 + t) * 0.15;

    vec3 deep = vec3(0.03, 0.04, 0.09);
    vec3 indigo = vec3(0.16, 0.14, 0.42);
    vec3 cyan = vec3(0.10, 0.42, 0.52);

    float d = length(p - vec2(sin(t) * 0.4, cos(t * 0.7) * 0.3));
    vec3 color = mix(indigo, deep, smoothstep(0.0, 1.1, d + wave));
    color = mix(color, cyan, smoothstep(0.5, 0.0, length(p + vec2(cos(t * 0.9) * 0.5, sin(t * 0.6) * 0.35))) * 0.5);

    // subtle grain to avoid banding
    float grain = fract(sin(dot(uv * uResolution, vec2(12.9898, 78.233))) * 43758.5453) * 0.03;
    gl_FragColor = vec4(color + grain, 1.0);
  }
`

function GradientPlane() {
  const material = useRef<THREE.ShaderMaterial>(null)

  useFrame((state) => {
    if (!material.current) return
    material.current.uniforms.uTime.value = state.clock.elapsedTime
    material.current.uniforms.uResolution.value.set(state.size.width, state.size.height)
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
        }}
      />
    </mesh>
  )
}

export function ShaderBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas dpr={[1, 2]} gl={{ antialias: false, powerPreference: 'high-performance' }}>
        <GradientPlane />
      </Canvas>
    </div>
  )
}
