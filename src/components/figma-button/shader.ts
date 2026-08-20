// Pixel-parity replica of the Figma button frame 48751:1336.
// Every constant below is read from the file via the Plugin API — see
// reference/figma-button-spec.md for the raw dump. The only tuned values are
// the ones Figma does not publish (wave displacement function, blur kernel
// factor, glass edge profile); those are exposed as uniforms for calibration
// against reference/figma-button@2x.png.

export const FRAME_W = 781.66
export const FRAME_H = 254.789

export const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`

export const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform vec2 uSize;        // frame size in Figma px (781.66 x 254.789)
  uniform vec3 uPageBg;      // page background behind the frame
  uniform float uPageBgAlpha;

  // --- Pattern Refraction uniforms (exact port of Figma's shader via
  //     fand/vfx-js pattern-refraction.ts, "Ported from Figma") ---
  uniform float uPRStrength;   // Figma Strength / 100
  uniform float uPRSmooth;     // Figma Smoothness / 100
  uniform float uPRFrost;      // Figma Frost / 100
  uniform float uPRDispersion; // Figma Dispersion / 100
  uniform float uPRStripWidth; // Figma Transform R / 100
  uniform float uPRAngle;      // Figma Transform A, degrees (unclamped)
  uniform vec2  uPRCenter;     // Figma Transform X/Y as fractions
  uniform float uPRGain;       // displacement gain: Figma's real amplitude vs the port's normalized constant

  // --- remaining calibration uniforms (engine internals) ---
  uniform float uBlurSigma;  // gaussian sigma for Figma LAYER_BLUR 97.19
  uniform float uGlassScale; // K_REFRACT: px scale for the refraction offset
  uniform float uGlassDisp;  // K_DISP: px scale for chromatic dispersion width
  uniform float uSpecGain;   // specular rim gain multiplier
  uniform sampler2D uWaveTex; // baked FX wave layer (frame-aligned 2x, straight alpha)
  uniform float uWaveProcedural; // 1 = procedural chain, 0 = baked ground truth

  // --- per-layer QA toggles (1 = visible) ---
  uniform float uShowA;          // "FX shader 02" wave layer
  uniform float uShowWave;       // the Pattern Refraction effect itself (off = plain fill)
  uniform float uShowB;          // "Solid" blurred pill
  uniform float uShowGlass;      // GLASS refraction/specular
  uniform float uShowGlassFill;  // Glass layer's 15% gradient fill
  uniform float uShowInnerShadow;
  uniform float uShowStroke;

  // ============ SDF helpers ============
  float sdRoundRect(vec2 p, vec2 center, vec2 halfSize, float r) {
    r = min(r, min(halfSize.x, halfSize.y));
    vec2 q = abs(p - center) - halfSize + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  // Gaussian cdf approximation for analytically blurred edges
  float blurredStep(float d, float sigma) {
    // ~erf-based smooth step: 0 inside (d<<0), 1 outside
    return clamp(0.5 + 0.5 * d / (sigma * 1.6), 0.0, 1.0);
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  #define TAU 6.28318530718

  mat2 rot2d(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, s, -s, c);
  }

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
      mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  // ============ Layer A: "FX shader 02" rectangle ============
  // Rect: x -46.858, y -0.045, w 863.848, h 254.881, radius=pill.
  // Fill: vertical linear gradient, white @ 45.19% -> #ABABAB @ 100%.
  #define UNIT (uSize.y / 254.789)
  // Bleed margin (px): half the centered stroke + antialias headroom.
  #define BLEED_PX (0.02 * uSize.y)
  #define A_POS (vec2(-0.059947, -0.000177) * uSize)
  #define A_SIZE (vec2(1.105145, 1.000361) * uSize)

  vec3 gradA(vec2 p) {
    float t = clamp((p.y - A_POS.y) / A_SIZE.y, 0.0, 1.0);
    float m = clamp((t - 0.4519) / (1.0 - 0.4519), 0.0, 1.0);
    return mix(vec3(1.0), vec3(0.6709), m);
  }

  vec4 rasterA(vec2 p) {
    float d = sdRoundRect(p, A_POS + A_SIZE * 0.5, A_SIZE * 0.5, A_SIZE.y * 0.5);
    float alpha = 1.0 - smoothstep(-0.75, 0.75, d);
    return vec4(gradA(p), alpha);
  }

  // Pattern Refraction (Waves) — exact port of Figma's shader math
  // (fand/vfx-js pattern-refraction.ts, "Ported from Figma"). Works in the
  // layer's own normalized UV space. Node values: Strength 61, Smoothness 0,
  // Frost 100, Dispersion 0, Edge wrap Zero, Transform X48% Y50% R12 A472deg.
  vec2 patternSampleUV(vec2 uv, float stGrid, float stDisp) {
    vec2 q = rot2d(-radians(uPRAngle)) * (uv - uPRCenter);
    float count = 1.0 / uPRStripWidth;

    // Waves: bend the lens grid along y. Frequency scales with 1/stripWidth.
    float gx = q.x;
    float bendPhase = (q.y + 0.5) * TAU / (5.0 * uPRStripWidth);
    gx += sin(bendPhase) * stGrid * 0.5 * uPRStripWidth;

    float n = fract(gx * count) * 2.0 - 1.0;
    float sharp = sign(n) * pow(abs(n), 8.0);
    float soft = sin(n * TAU * 0.5) * n * n; // waves variant keeps bend at boundary
    float shape = mix(sharp, soft, uPRSmooth);
    float disp = 0.3 * uPRStripWidth * stDisp * shape * uPRGain;
    q.x += disp;
    // Refraction follows the bent grid: y shift = x shift times grid slope.
    q.y += disp * cos(bendPhase) * stGrid * 0.5 * TAU / 5.0;
    return rot2d(radians(uPRAngle)) * q + uPRCenter;
  }

  vec4 rasterA_uv(vec2 uv) {
    // Edge wrap: Zero — transparent outside the layer bounds
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(0.0);
    return rasterA(A_POS + uv * A_SIZE);
  }

  vec4 layerA(vec2 p) {
    if (uShowA < 0.5) return vec4(0.0);
    if (uShowWave < 0.5) return rasterA(p);
    if (uWaveProcedural < 0.5) {
      // Ground truth: the FX layer exactly as Figma renders it (matte grain
      // preserved through mipmapped minification — no plastic sheen).
      vec2 tuv = vec2(p.x / uSize.x, 1.0 - p.y / uSize.y);
      if (tuv.x < 0.0 || tuv.x > 1.0 || tuv.y < 0.0 || tuv.y > 1.0) return vec4(0.0);
      return texture2D(uWaveTex, tuv);
    }
    vec2 uv = (p - A_POS) / A_SIZE;
    vec2 uvR = patternSampleUV(uv, uPRStrength, uPRStrength * (1.0 + uPRDispersion));
    vec2 uvG = patternSampleUV(uv, uPRStrength, uPRStrength);
    vec2 uvB = patternSampleUV(uv, uPRStrength, uPRStrength * (1.0 - uPRDispersion));

    if (uPRFrost > 0.0) {
      // Frost: jitter the sample with value noise for a frosted-glass blur.
      vec2 j = (vec2(
        valueNoise(uv * 1024.0),
        valueNoise(uv * 1024.0 + 19.0)
      ) - 0.5) * uPRFrost * 0.05;
      uvR += j;
      uvG += j;
      uvB += j;
    }

    vec4 cg = rasterA_uv(uvG);
    return vec4(rasterA_uv(uvR).r, cg.g, rasterA_uv(uvB).b, cg.a);
  }

  // ============ Layer B: "Solid" pill with LAYER_BLUR 97.19 ============
  // Rect: x 167.169, y 49.574, w 389.677, h 155.640, radius=pill.
  // Fill affine gradient (from Figma gradientTransform), #D3D3D3 -> #FFFFFF.
  #define B_POS (vec2(0.213865, 0.194570) * uSize)
  #define B_SIZE (vec2(0.498525, 0.610866) * uSize)

  vec3 gradB(vec2 p) {
    vec2 n = (p - B_POS) / B_SIZE;
    float t = clamp(-3.3447 * n.x - 0.0785 * n.y + 3.8493, 0.0, 1.0);
    return mix(vec3(0.8274), vec3(1.0), t);
  }

  vec4 layerB(vec2 p) {
    if (uShowB < 0.5) return vec4(0.0);
    float d = sdRoundRect(p, B_POS + B_SIZE * 0.5, B_SIZE * 0.5, B_SIZE.y * 0.5);
    float alpha = 1.0 - blurredStep(d, uBlurSigma * UNIT);
    return vec4(gradB(p), alpha);
  }

  // ============ Backdrop = page bg, then A, then B ============
  vec4 over(vec4 top, vec4 bottom) {
    float a = top.a + bottom.a * (1.0 - top.a);
    vec3 rgb = a > 0.0 ? (top.rgb * top.a + bottom.rgb * bottom.a * (1.0 - top.a)) / a : vec3(0.0);
    return vec4(rgb, a);
  }

  vec4 backdrop(vec2 p) {
    vec4 c = vec4(uPageBg, uPageBgAlpha);
    c = over(layerA(p), c);
    c = over(layerB(p), c);
    return c;
  }

  // ============ Layer C: "Glass" — GLASS effect + fill + inner shadow ============
  // Rect: full frame, radius 27.669.
  // GLASS: frost radius 17, refraction 0.34, depth 100, lightAngle -45deg,
  //        lightIntensity 0.8, dispersion 0.39, splay 0.4.
  // Fill: vertical white->#999999 gradient at 15% opacity.
  // INNER_SHADOW: white 25%, offset (0, 4.612), blur 74.016.
  #define GLASS_R (0.108596 * uSize.y)
  #define GLASS_DEPTH (0.392482 * uSize.y)

  // Squircle edge height field (Apple/Figma liquid glass): rises steeply at the
  // border, flattens toward the interior. inside = -sdf, clamped to [0, depth].
  float glassHeight(float inside) {
    float x = clamp(inside / GLASS_DEPTH, 0.0, 1.0);
    return pow(1.0 - pow(1.0 - x, 4.0), 0.25);
  }
  float glassH(vec2 p, vec2 center, vec2 halfSize) {
    float inside = -sdRoundRect(p, center, halfSize, GLASS_R);
    return glassHeight(max(inside, 0.0));
  }

  vec4 glassLayer(vec2 p) {
    vec2 center = uSize * 0.5;
    vec2 halfSize = uSize * 0.5;
    float d = sdRoundRect(p, center, halfSize, GLASS_R);
    if (d > 0.0 || uShowGlass < 0.5) {
      vec4 c0 = backdrop(p);
      if (d <= 0.0) {
        if (uShowGlassFill > 0.5) {
          float gt0 = clamp(p.y / uSize.y, 0.0, 1.0);
          c0 = over(vec4(mix(vec3(1.0), vec3(0.6), gt0), 0.15), c0);
        }
        if (uShowInnerShadow > 0.5) {
          float ds0 = sdRoundRect(p - vec2(0.0, 4.612 * UNIT), center, halfSize, GLASS_R);
          float sh0 = 1.0 - blurredStep(-ds0, 74.016 * UNIT * 0.5);
          c0.rgb = mix(c0.rgb, vec3(1.0), 0.25 * sh0 * c0.a);
        }
      }
      return c0;
    }

    // === Surface normal from the squircle height gradient (finite difference).
    // Flat interior -> N≈(0,0,1) (no distortion); rim -> N tilts outward.
    float inside = -d;
    float e = 1.5 * UNIT;
    float hR = glassH(p + vec2(e, 0.0), center, halfSize);
    float hL = glassH(p - vec2(e, 0.0), center, halfSize);
    float hU = glassH(p + vec2(0.0, e), center, halfSize);
    float hD = glassH(p - vec2(0.0, e), center, halfSize);
    // Height is 0..1; scale to px by GLASS_DEPTH so the gradient has real slope.
    vec2 hGrad = vec2(hR - hL, hU - hD) / (2.0 * e) * GLASS_DEPTH;
    vec3 N = normalize(vec3(-hGrad, 1.0));

    // Edge band weight: 1 at the border, 0 at the inner end of the depth band.
    float edge = 1.0 - smoothstep(0.0, GLASS_DEPTH, inside);

    // === Refraction offset: Snell-consistent, along the bevel normal.
    // Figma refraction 0.34; physical bend per surface = 1 - 1/IOR (IOR 1.5).
    const float REFR = 0.34;
    const float refrPow = 1.0 - 1.0 / 1.5;             // 0.3333
    float mag = REFR * refrPow * uGlassScale * UNIT;   // px; uGlassScale = K_REFRACT
    vec2 refrOff = N.xy * mag;

    // === Dispersion 0.39: R/G/B split about the refracted sample along N.xy,
    // peaking at the rim.
    const float DISP = 0.39;
    float caS = DISP * uGlassDisp * UNIT * (edge * 0.85 + 0.15);
    vec2 caD = N.xy * caS;

    // === Frost radius 17 -> gaussian sigma ~ 17*0.568. Premultiplied taps.
    float frostSigma = 17.0 * 0.568 * UNIT;
    vec3 acc = vec3(0.0);
    float accA = 0.0;
    const int FT = 6;
    for (int i = 0; i < FT; i++) {
      float a = 6.28318 * (float(i) + 0.5) / float(FT);
      vec2 j = vec2(cos(a), sin(a)) * frostSigma * (0.35 + 0.65 * hash(p + float(i) * 3.1));
      vec4 sR = backdrop(p + refrOff + caD + j);
      vec4 sG = backdrop(p + refrOff + j);
      vec4 sB = backdrop(p + refrOff - caD + j);
      acc.r += sR.r * sR.a;
      acc.g += sG.g * sG.a;
      acc.b += sB.b * sB.a;
      accA += sG.a;
    }
    float alpha = accA / float(FT);
    vec3 refracted = alpha > 0.001 ? acc / float(FT) / alpha : vec3(0.0);

    vec4 c = vec4(refracted, alpha);

    // === Specular: Blinn-Phong against N, light placed by lightAngle -45deg,
    // intensity 0.8; Splay 0.4 widens the lobe (low exponent = broad).
    vec3 L = normalize(vec3(cos(radians(-45.0)), sin(radians(-45.0)), 0.6));
    vec3 V = vec3(0.0, 0.0, 1.0);
    vec3 Hh = normalize(L + V);
    float shininess = mix(120.0, 8.0, 0.4);            // Splay 0.4
    float spec = pow(max(dot(N, Hh), 0.0), shininess) * 0.8 * uSpecGain;
    // Fresnel rim: grazing angles (N tilted away from view) brighten.
    float fres = pow(1.0 - abs(N.z), 4.0) * 0.8 * uSpecGain;
    c.rgb += spec + fres * 0.25;

    // Fill: vertical white -> #999 gradient, 15% opacity
    if (uShowGlassFill > 0.5) {
      float gt = clamp(p.y / uSize.y, 0.0, 1.0);
      vec3 fillCol = mix(vec3(1.0), vec3(0.6), gt);
      c = over(vec4(fillCol, 0.15), c);
    }

    // Inner shadow: white 25%, offset (0, 4.612), blur 74.016 (sigma ~ b/2)
    if (uShowInnerShadow > 0.5) {
      float ds = sdRoundRect(p - vec2(0.0, 4.612 * UNIT), center, halfSize, GLASS_R);
      float sh = 1.0 - blurredStep(-ds, 74.016 * UNIT * 0.5); // glow pulling in from edges
      c.rgb = mix(c.rgb, vec3(1.0), 0.25 * sh * c.a);
    }

    return c;
  }

  // ============ Frame: clip + centered gradient stroke ============
  // radius 97.996, stroke weight 6.917 CENTER.
  // Stroke gradient: #D4D4D4 0% -> #E0E1F8 49.04% -> #FFFFFF 100%,
  // t = 0.6875*nx + 0.0843*ny + 0.0979 (from gradientTransform).
  #define FRAME_R (0.384618 * uSize.y)
  #define STROKE_W (0.027149 * uSize.y)

  vec3 strokeGrad(vec2 p) {
    vec2 nrm = p / uSize;
    float t = clamp(0.6875 * nrm.x + 0.0843 * nrm.y + 0.0979, 0.0, 1.0);
    vec3 c1 = vec3(0.8314);
    vec3 c2 = vec3(0.8784, 0.8824, 0.9725);
    vec3 c3 = vec3(1.0);
    return t < 0.4904 ? mix(c1, c2, t / 0.4904) : mix(c2, c3, (t - 0.4904) / (1.0 - 0.4904));
  }

  void main() {
    // Figma y-down coordinates over a domain extended by BLEED on every side,
    // so the centered stroke's outer half is not cut by the canvas bounds.
    vec2 p = vec2(vUv.x, 1.0 - vUv.y) * (uSize + 2.0 * BLEED_PX) - BLEED_PX;

    vec4 c = glassLayer(p);

    // Clip content to the frame's rounded rect
    float dFrame = sdRoundRect(p, uSize * 0.5, uSize * 0.5, FRAME_R);
    float clipA = 1.0 - smoothstep(-0.75, 0.75, dFrame);
    c.a *= clipA;

    // Centered stroke straddles the frame edge
    if (uShowStroke > 0.5) {
      float band = abs(dFrame) - STROKE_W * 0.5;
      float strokeA = 1.0 - smoothstep(-0.75, 0.75, band);
      c = over(vec4(strokeGrad(p), strokeA), c);
    }

    gl_FragColor = vec4(c.rgb * c.a, c.a);  // premultiplied
  }
`
