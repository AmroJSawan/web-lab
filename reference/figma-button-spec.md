# Figma button ground truth — frame 48751:1336 ("Frame 19")

Source: https://www.figma.com/design/1vZihr9iGfveZVZ1ZQtBjy/?node-id=48751-1336
Extracted 2026-08-19 via Figma MCP `use_figma` (Plugin API). Reference render: `figma-button@2x.png`.

## Frame
- 781.66 × 254.789, cornerRadius 97.996, clipsContent true, **no fill**
- Stroke: linear gradient, weight 6.917, align CENTER
  - #D4D4D4 @ 0% → #E0E1F8 @ 49.04% → #FFFFFF @ 100%
  - gradientTransform [[0.6875, 0.0843, 0.0979], [-0.7933, 0.6875, 0.5717]]

## Children (bottom → top)

### 1. "FX shader 02" (RECTANGLE, visible)
- x −46.858, y −0.045, 863.848 × 254.881, cornerRadius 512.81 (pill)
- Fill: linear gradient (vertical): #FFFFFF @ 45.19% → #ABABAB (0.6709) @ 100%
- Effect: `SHADER` id `8b149d5270f8d80ad8281db6fa72c4f467bb4ab2/417` = **Pattern refraction**
  - properties (hashed uniform ids → UI names):
    - `3019345422:2958915502` = 61 → **Strength**
    - `3968873068:2724068446` = 0 → **Smoothness** (58 on the hidden variant layer)
    - `2731431286:1351361904` = 100 → **Frost**
    - `2328503664:2300449702` = 0 → **Dispersion**
    - `4155649180:485558860` = 0 → **Edge wrap** (Zero)
    - `3777623340:1069663050` = 2 → **Pattern** (Waves)
    - `2859003244:2157541550` = {x: 48, y: 50, radius: 12, angle: 472} → **Transform**
- Library source: shader effect `f1a4fc0f-247f…` "Pattern refraction" — "Refracts a layer
  through procedural patterns (lenticular, zigzag, waves, circular, curved/flat square)
  with IOR dispersion, frost, and configurable edge wrap"

### 2. Two hidden FX shader variants (visible: false) — ignored

### 3. "Solid" (RECTANGLE, visible)
- x 167.169, y 49.574, 389.677 × 155.640, cornerRadius 387.37 (pill)
- Fill: linear gradient #D3D3D3 (0.8274) @ 0% → #FFFFFF @ 100%
  - gradientTransform [[−3.3447, −0.0785, 3.8493], [−0.0072, −1.8039, 0.8335]]
- Effect: `LAYER_BLUR` radius **97.19** (normal/uniform)
  - CSS mapping: official σ = B/2 (48.6); measured σ ≈ 0.568·B (55.2) per bjango

### 4. "Glass" (RECTANGLE, visible)
- x 0, y 0, 781.66 × 254.789, cornerRadius **27.669**
- Fill: linear gradient (vertical) #FFFFFF → #999999 (0.6), paint opacity **0.15**
- Effects:
  - `GLASS`: radius (Frost) 17, refraction 0.34, depth 100, lightAngle **−45°**,
    lightIntensity 0.8, dispersion 0.39, splay 0.4
  - `INNER_SHADOW`: #FFFFFF @ 25%, offset (0, 4.612), blur 74.016, spread 0

### 5. "Hello" (TEXT, top)
- Noto Kufi Arabic Regular, 110.678px, letter-spacing −6%, line-height auto
- box 243 × 210 at (269.776, 21.836), align left / center-vertical, fill #000000

## Rendering model notes (from multi-agent research)
- Pattern Refraction is a WGSL **shader effect**: it refracts the layer's own raster
  (not the backdrop); Edge wrap = texture address mode. Exact wave function unpublished →
  calibrated in `src/components/figma-button/shader.ts` uniforms.
- Glass is engine-internal (not a shader asset): edge-band refraction of the backdrop —
  band width = depth, interior gets only Frost (backdrop blur); specular rim at
  lightAngle/intensity, angular spread = splay; dispersion = per-channel offset.
- Figma gradients interpolate in gamma sRGB, straight (unpremultiplied) alpha.
- Figma blur value → Gaussian σ: official B/2, measured ≈ 0.568·B.
