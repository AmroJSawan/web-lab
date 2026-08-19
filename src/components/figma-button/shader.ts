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

  // --- calibration uniforms (Figma-unpublished internals) ---
  uniform float uWaveAmp;    // px displacement at Strength 61
  uniform float uWaveLen;    // px wavelength from Transform R=12
  uniform float uWaveAngle;  // radians, from A=472deg
  uniform vec2  uWaveOrigin; // fraction of layer size, from Transform X/Y = 48%/50%
  uniform float uFrostBlur;  // px blur radius from Frost=100
  uniform float uFrostGrain; // grain amount from Frost=100
  uniform float uBlurSigma;  // gaussian sigma for Figma LAYER_BLUR 97.19
  uniform float uGlassScale; // px offset at refraction=1 with depth profile=1

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

  // ============ Layer A: "FX shader 02" rectangle ============
  // Rect: x -46.858, y -0.045, w 863.848, h 254.881, radius=pill.
  // Fill: vertical linear gradient, white @ 45.19% -> #ABABAB @ 100%.
  const vec2 A_POS = vec2(-46.858, -0.045);
  const vec2 A_SIZE = vec2(863.848, 254.881);

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

  // Pattern Refraction (Waves): displace sampling of layer A's own raster.
  // Strength 61, Smoothness 0, Frost 100, Dispersion 0, Edge wrap Zero,
  // Transform X 48% Y 50% R 12 A 472deg (== 112deg).
  vec2 waveDisplace(vec2 p) {
    vec2 origin = A_POS + uWaveOrigin * A_SIZE;
    vec2 q = p - origin;
    vec2 dir = vec2(cos(uWaveAngle), sin(uWaveAngle));
    vec2 perp = vec2(-dir.y, dir.x);
    float along = dot(q, dir);
    float across = dot(q, perp);
    // Crossed sines make the classic figma wave sheet: primary ridge along
    // the pattern axis, secondary modulation across it.
    float phase = along / uWaveLen;
    float wobble = sin(across / (uWaveLen * 1.9) + phase * 0.7);
    float w1 = sin(phase * 6.28318 + wobble * 1.2);
    float w2 = cos(phase * 6.28318 * 0.5 - wobble * 1.7);
    return perp * (w1 * uWaveAmp) + dir * (w2 * uWaveAmp * 0.55);
  }

  vec4 layerA(vec2 p) {
    vec2 pd = p + waveDisplace(p);
    // Frost 100: blur + grain haze over the refracted raster
    vec4 acc = vec4(0.0);
    const int TAPS = 8;
    for (int i = 0; i < TAPS; i++) {
      float a = 6.28318 * (float(i) + 0.5) / float(TAPS);
      float r = uFrostBlur * (0.4 + 0.6 * hash(p + float(i)));
      acc += rasterA(pd + vec2(cos(a), sin(a)) * r);
    }
    vec4 c = acc / float(TAPS);
    float grain = (hash(p * 1.7) - 0.5) * uFrostGrain;
    c.rgb = clamp(c.rgb + grain, 0.0, 1.0);
    return c;
  }

  // ============ Layer B: "Solid" pill with LAYER_BLUR 97.19 ============
  // Rect: x 167.169, y 49.574, w 389.677, h 155.640, radius=pill.
  // Fill affine gradient (from Figma gradientTransform), #D3D3D3 -> #FFFFFF.
  const vec2 B_POS = vec2(167.169, 49.574);
  const vec2 B_SIZE = vec2(389.677, 155.640);

  vec3 gradB(vec2 p) {
    vec2 n = (p - B_POS) / B_SIZE;
    float t = clamp(-3.3447 * n.x - 0.0785 * n.y + 3.8493, 0.0, 1.0);
    return mix(vec3(0.8274), vec3(1.0), t);
  }

  vec4 layerB(vec2 p) {
    float d = sdRoundRect(p, B_POS + B_SIZE * 0.5, B_SIZE * 0.5, B_SIZE.y * 0.5);
    float alpha = 1.0 - blurredStep(d, uBlurSigma);
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
  const float GLASS_R = 27.669;
  const float GLASS_DEPTH = 100.0;

  vec4 glassLayer(vec2 p) {
    vec2 center = uSize * 0.5;
    vec2 halfSize = uSize * 0.5;
    float d = sdRoundRect(p, center, halfSize, GLASS_R);
    if (d > 0.0) return backdrop(p);

    // Edge profile: dome over the band [-depth, 0] measured inward. A softer
    // falloff than the raw circle derivative avoids the "picture frame" look.
    float t = clamp(-d / GLASS_DEPTH, 0.0, 1.0);      // 0 at edge, 1 at inner limit
    float slope = pow(1.0 - t, 1.8);
    // SDF normal (points outward); wide epsilon rounds the corner seams
    float e = 6.0;
    vec2 n = normalize(vec2(
      sdRoundRect(p + vec2(e, 0.0), center, halfSize, GLASS_R) - sdRoundRect(p - vec2(e, 0.0), center, halfSize, GLASS_R),
      sdRoundRect(p + vec2(0.0, e), center, halfSize, GLASS_R) - sdRoundRect(p - vec2(0.0, e), center, halfSize, GLASS_R)
    ));

    float mag = 0.34 * uGlassScale * slope;            // refraction 0.34
    // Dispersion 0.39: three taps at diverging refraction magnitudes
    float disp = 0.39 * 0.35;
    vec2 offR = n * mag * (1.0 - disp);
    vec2 offG = n * mag;
    vec2 offB = n * mag * (1.0 + disp);

    // Frost radius 17 -> gaussian sigma ~ 17*0.568
    float frostSigma = 17.0 * 0.568;
    vec3 acc = vec3(0.0);
    float accA = 0.0;
    const int FT = 6;
    for (int i = 0; i < FT; i++) {
      float a = 6.28318 * (float(i) + 0.5) / float(FT);
      vec2 j = vec2(cos(a), sin(a)) * frostSigma * (0.35 + 0.65 * hash(p + float(i) * 3.1));
      acc.r += backdrop(p + offR + j).r;
      vec4 g = backdrop(p + offG + j);
      acc.g += g.g;
      accA += g.a;
      acc.b += backdrop(p + offB + j).b;
    }
    vec3 refracted = acc / float(FT);
    float alpha = accA / float(FT);

    vec4 c = vec4(refracted, alpha);

    // Specular rim: light from lightAngle -45deg, intensity 0.8, splay 0.4.
    vec2 lightDir = vec2(cos(radians(-45.0)), sin(radians(-45.0)));
    float facing = dot(-n, lightDir);                  // rim facing the light
    float splay = mix(2.6, 0.9, 0.4);                  // splay widens angular falloff
    float rim = pow(clamp(abs(facing), 0.0, 1.0), splay);
    float rimBand = pow(1.0 - t, 3.0);                 // strongest at the very edge
    float spec = 0.8 * 0.45 * rim * rimBand;
    c.rgb += vec3(spec);

    // Fill: vertical white -> #999 gradient, 15% opacity
    float gt = clamp(p.y / uSize.y, 0.0, 1.0);
    vec3 fillCol = mix(vec3(1.0), vec3(0.6), gt);
    c = over(vec4(fillCol, 0.15), c);

    // Inner shadow: white 25%, offset (0, 4.612), blur 74.016 (sigma ~ b/2)
    float ds = sdRoundRect(p - vec2(0.0, 4.612), center, halfSize, GLASS_R);
    float sh = 1.0 - blurredStep(-ds, 74.016 * 0.5);   // glow pulling in from edges
    c.rgb = mix(c.rgb, vec3(1.0), 0.25 * sh * c.a);

    return c;
  }

  // ============ Frame: clip + centered gradient stroke ============
  // radius 97.996, stroke weight 6.917 CENTER.
  // Stroke gradient: #D4D4D4 0% -> #E0E1F8 49.04% -> #FFFFFF 100%,
  // t = 0.6875*nx + 0.0843*ny + 0.0979 (from gradientTransform).
  const float FRAME_R = 97.996;
  const float STROKE_W = 6.917;

  vec3 strokeGrad(vec2 p) {
    vec2 nrm = p / uSize;
    float t = clamp(0.6875 * nrm.x + 0.0843 * nrm.y + 0.0979, 0.0, 1.0);
    vec3 c1 = vec3(0.8314);
    vec3 c2 = vec3(0.8784, 0.8824, 0.9725);
    vec3 c3 = vec3(1.0);
    return t < 0.4904 ? mix(c1, c2, t / 0.4904) : mix(c2, c3, (t - 0.4904) / (1.0 - 0.4904));
  }

  void main() {
    vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uSize;  // Figma y-down coordinates

    vec4 c = glassLayer(p);

    // Clip content to the frame's rounded rect
    float dFrame = sdRoundRect(p, uSize * 0.5, uSize * 0.5, FRAME_R);
    float clipA = 1.0 - smoothstep(-0.75, 0.75, dFrame);
    c.a *= clipA;

    // Centered stroke straddles the frame edge
    float band = abs(dFrame) - STROKE_W * 0.5;
    float strokeA = 1.0 - smoothstep(-0.75, 0.75, band);
    c = over(vec4(strokeGrad(p), strokeA), c);

    gl_FragColor = vec4(c.rgb * c.a, c.a);  // premultiplied
  }
`
