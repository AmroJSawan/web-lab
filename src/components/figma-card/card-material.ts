// Surface material for the card — exact reconstruction of Figma node 1:1351
// ("Moodboard3", Materials Raw). Rebuilt from the real layer stack after
// in-Figma isolation (reference/card/fx4-only@2x.png, solid-only@2x.png):
//
//   white frame fill
//   -> "Solid"       1021x163 pill, rotated -90.9deg at the right edge,
//                    white->gray gradient, LAYER_BLUR 101.85
//   -> "FX shader 4" 698x491 pill, rotated -90.5deg covering the right half,
//                    peach(78%)->white gradient, FOUR chained Pattern
//                    Refraction effects (exact vfx-js port math):
//                      E1 waves  s51  sm58 frost32          (default transform)
//                      E2 waves  s50  sm36 r27.5 a90
//                      E3 lentic s100 sm0  frost92 disp4 r8.16 a45 x64
//                      E4 waves  s50  sm0  disp4  r5.93 a63.74
//   -> "Glass"       refraction .84 depth 120.8 light 293deg int 1.0
//                    dispersion .5 splay .4 frost 15.7 + inner shadow
//                    + 20% white->#999 fill
//   -> gradient stroke (centered, 2.42)
//
// All constants from the Plugin API dump; the only tuned values are the shared
// displacement gain / strip-width mapping calibrated on the button experiment.

export const cardVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`

export const cardFragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform vec2  uSize;       // rendered px (aspect matches 853.01 x 524.37)
  uniform float uRadius;     // rendered corner radius px (unused: design-space)

  // calibration (same conventions as the button experiment)
  uniform float uFxGain;     // displacement gain (button-calibrated ~30)
  uniform float uFxStrip;    // Figma R% -> port stripWidth factor (~2.5)
  uniform float uFxFrost;    // frost jitter scale (1 = port 0.05)
  uniform float uFxDisp;     // dispersion scale (1 = Figma value)
  uniform float uGlassScale; // glass K_REFRACT px
  uniform float uGlassDisp;  // glass K_DISP px
  uniform float uSpecGain;   // glass specular gain
  uniform sampler2D uFxTex;  // baked FX-shader-4 layer (card-aligned, straight alpha)
  uniform float uFxProcedural; // 1 = experimental procedural chain, 0 = baked texture
  uniform float uGlassFrost;   // frost blur scale (1 = Figma radius 15.71)

  // per-layer toggles
  uniform float uShowSolid;
  uniform float uShowFx;
  uniform float uShowFxFx;   // the refraction chain itself (off = plain fill)
  uniform float uShowGlass;
  uniform float uShowGlassFill;
  uniform float uShowInner;
  uniform float uShowStroke;

  #define TAU 6.28318530718
  #define DESIGN vec2(853.01, 524.37)

  // ---------- helpers ----------
  float sdRoundRect(vec2 p, vec2 b, float r) {
    r = min(r, min(b.x, b.y));
    vec2 q = abs(p) - b + r;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
  }
  mat2 rot2d(float a){ float c=cos(a), s=sin(a); return mat2(c, s, -s, c); }
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
  float hash12(vec2 p){
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  float valueNoise(vec2 p){
    vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
    return mix(mix(hash12(i),hash12(i+vec2(1,0)),u.x),
               mix(hash12(i+vec2(0,1)),hash12(i+vec2(1,1)),u.x),u.y);
  }

  // ---------- Pattern Refraction (exact vfx-js "Ported from Figma" math) ----------
  // pattern: 0 lenticular, 1 waves. uv in the layer's own normalized space.
  vec2 patternSample(vec2 uv, float pattern, float stGrid, float stDisp,
                     float smoothness, vec2 pcenter, float stripW, float angle) {
    vec2 q = rot2d(-radians(angle)) * (uv - pcenter);
    float count = 1.0 / stripW;
    float gx = q.x;
    float bendPhase = (q.y + 0.5) * TAU / (5.0 * stripW);
    if (pattern > 0.5) gx += sin(bendPhase) * stGrid * 0.5 * stripW;
    float n = fract(gx * count) * 2.0 - 1.0;
    float sharp = sign(n) * pow(abs(n), 8.0);
    float soft = sin(n * TAU * 0.5);
    if (pattern > 0.5) soft *= n * n;
    float shape = mix(sharp, soft, smoothness);
    float disp = 0.3 * stripW * stDisp * shape * uFxGain;
    q.x += disp;
    if (pattern > 0.5) q.y += disp * cos(bendPhase) * stGrid * 0.5 * TAU / 5.0;
    return rot2d(radians(angle)) * q + pcenter;
  }

  // ---------- Layer: "Solid" (rotated blurred strip) ----------
  // local 1020.95 x 163.11 pill; blur 101.85 -> sigma ~ 0.568*B = 57.9
  vec4 layerSolid(vec2 pd) {
    if (uShowSolid < 0.5) return vec4(0.0);
    float lu = -0.01582*(pd.x - 928.23) + 0.99987*(pd.y + 52.84);
    float lv = -0.99987*(pd.x - 928.23) - 0.01582*(pd.y + 52.84);
    vec2 lsize = vec2(1020.95, 163.11);
    float d = sdRoundRect(vec2(lu,lv) - lsize*0.5, lsize*0.5, lsize.y*0.5);
    float sigma = 101.85 * 0.568;
    float alpha = clamp(0.5 - 0.5 * d / (sigma * 1.6), 0.0, 1.0);
    float t = clamp(-0.5184*(lu/lsize.x) - 0.0207*(lv/lsize.y) + 0.8156, 0.0, 1.0);
    vec3 col = t < 0.6036
      ? mix(vec3(1.0), vec3(0.8935), t / 0.6036)
      : mix(vec3(0.8935), vec3(0.8235), (t - 0.6036) / (1.0 - 0.6036));
    return vec4(col, alpha);
  }

  // ---------- Layer: "FX shader 4" (rotated pill, 4 chained refractions) ----------
  // local 698.03 x 491.03 pill. Fill: local-vertical gradient
  // peach(.929,.601,.383, a.78) @ .0961 -> white @ .6346, straight alpha.
  vec4 fx4Raster(vec2 luv) {
    if (luv.x < 0.0 || luv.x > 1.0 || luv.y < 0.0 || luv.y > 1.0) return vec4(0.0);
    vec2 lsize = vec2(698.03, 491.03);
    vec2 lp = luv * lsize;
    float d = sdRoundRect(lp - lsize*0.5, lsize*0.5, min(lsize.x,lsize.y)*0.5);
    float shapeA = 1.0 - smoothstep(-0.75, 0.75, d);
    float t = clamp((luv.y - 0.0961) / (0.6346 - 0.0961), 0.0, 1.0);
    vec3 col = mix(vec3(0.929, 0.601, 0.383), vec3(1.0), t);
    float a = mix(0.78, 1.0, t);
    return vec4(col, a * shapeA);
  }

  vec2 fx4Chain(vec2 luv, float dispFactor) {
    // effects list E1..E4 applied in order => sampling composes outermost-last
    // E4: waves s50 sm0 disp4 r5.93 a63.74
    luv = patternSample(luv, 1.0, 0.50, 0.50 * (1.0 + dispFactor*0.04*uFxDisp), 0.0,
                        vec2(0.5,0.5), 0.0593*uFxStrip, 63.74);
    // E3: lenticular s100 sm0 frost92 disp4 r8.16 a45 center x64
    luv = patternSample(luv, 0.0, 1.0, 1.0 * (1.0 + dispFactor*0.04*uFxDisp), 0.0,
                        vec2(0.64,0.5), 0.0816*uFxStrip, 45.0);
    luv += (vec2(valueNoise(luv*1024.0), valueNoise(luv*1024.0+19.0)) - 0.5) * 0.92 * 0.05 * uFxFrost;
    // E2: waves s50 sm36 r27.5 a90
    luv = patternSample(luv, 1.0, 0.50, 0.50, 0.36, vec2(0.5,0.5), 0.2754*uFxStrip, 90.0);
    // E1: waves s51 sm58 frost32, default transform (x50 y50 r12)
    luv = patternSample(luv, 1.0, 0.51, 0.51, 0.58, vec2(0.5,0.5), 0.12*uFxStrip, 0.0);
    luv += (vec2(valueNoise(luv*512.0+7.0), valueNoise(luv*512.0+31.0)) - 0.5) * 0.32 * 0.05 * uFxFrost;
    return luv;
  }

  vec4 layerFx4(vec2 pd) {
    if (uShowFx < 0.5) return vec4(0.0);
    if (uFxProcedural < 0.5) {
      // Ground-truth path: the layer exactly as Figma renders it, baked at 2x.
      vec2 tuv = vec2(pd.x / DESIGN.x, 1.0 - pd.y / DESIGN.y);
      if (tuv.x < 0.0 || tuv.x > 1.0 || tuv.y < 0.0 || tuv.y > 1.0) return vec4(0.0);
      return texture2D(uFxTex, tuv);
    }
    float lu = -0.00947*(pd.x - 895.36) + 0.99996*(pd.y + 39.13);
    float lv = -0.99996*(pd.x - 895.36) - 0.00947*(pd.y + 39.13);
    vec2 luv = vec2(lu / 698.03, lv / 491.03);
    if (uShowFxFx < 0.5) return fx4Raster(luv);
    // dispersion 4 on E3/E4: per-channel chains (R +, G 0, B -)
    vec2 uvR = fx4Chain(luv,  1.0);
    vec2 uvG = fx4Chain(luv,  0.0);
    vec2 uvB = fx4Chain(luv, -1.0);
    vec4 cR = fx4Raster(uvR);
    vec4 cG = fx4Raster(uvG);
    vec4 cB = fx4Raster(uvB);
    // premultiplied per-channel combine
    float a = cG.a;
    vec3 rgb = vec3(
      cR.a > 0.001 ? cR.r : 1.0,
      cG.a > 0.001 ? cG.g : 1.0,
      cB.a > 0.001 ? cB.b : 1.0
    );
    return vec4(rgb, a);
  }

  // ---------- backdrop = white, Solid, FX4 ----------
  vec4 over(vec4 top, vec4 bottom) {
    float a = top.a + bottom.a * (1.0 - top.a);
    vec3 rgb = a > 0.0 ? (top.rgb*top.a + bottom.rgb*bottom.a*(1.0-top.a)) / a : vec3(0.0);
    return vec4(rgb, a);
  }
  vec4 backdrop(vec2 pd) {
    vec4 c = vec4(1.0, 1.0, 1.0, 1.0);   // frame white fill
    c = over(layerSolid(pd), c);
    c = over(layerFx4(pd), c);
    return c;
  }

  // ---------- Glass (researched model; params from node 1:1357) ----------
  #define G_RADIUS 29.0
  #define G_DEPTH 120.82
  float glassHeight(float inside){
    float x = clamp(inside / G_DEPTH, 0.0, 1.0);
    return pow(1.0 - pow(1.0 - x, 4.0), 0.25);
  }
  float glassH(vec2 pd){
    float inside = -sdRoundRect(pd - DESIGN*0.5, DESIGN*0.5, G_RADIUS);
    return glassHeight(max(inside, 0.0));
  }

  vec3 strokeGrad(vec2 uv){
    float t = clamp(0.6875*uv.x + 0.0843*uv.y + 0.0979, 0.0, 1.0);
    vec3 c1=vec3(0.8314), c2=vec3(0.8784,0.8824,0.9725), c3=vec3(1.0);
    return t<0.4904 ? mix(c1,c2,t/0.4904) : mix(c2,c3,(t-0.4904)/(1.0-0.4904));
  }

  void main() {
    vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
    vec2 pd = uv * DESIGN;                      // design-space px
    float d = sdRoundRect(pd - DESIGN*0.5, DESIGN*0.5, G_RADIUS);

    vec4 c;
    if (uShowGlass > 0.5 && d <= 0.0) {
      float inside = -d;
      float e = 1.5;
      vec2 hg = vec2(glassH(pd+vec2(e,0.0)) - glassH(pd-vec2(e,0.0)),
                     glassH(pd+vec2(0.0,e)) - glassH(pd-vec2(0.0,e))) / (2.0*e) * G_DEPTH;
      vec3 N = normalize(vec3(-hg, 1.0));
      float edge = 1.0 - smoothstep(0.0, G_DEPTH, inside);

      float mag = 0.84 * (1.0 - 1.0/1.5) * uGlassScale;   // refraction .84
      vec2 refr = N.xy * mag;
      float caS = 0.5 * uGlassDisp * (edge*0.85 + 0.15);  // dispersion .5
      vec2 caD = N.xy * caS;

      // Deterministic gaussian frost: center + two rings (6 inner, 6 outer).
      // Smooth, grain-free blur — matches Figma's soft frosted look.
      float frostSigma = 15.71 * 0.568 * uGlassFrost;
      vec3 acc = vec3(0.0); float accA = 0.0; float accW = 0.0;
      {
        vec4 s0R = backdrop(pd + refr + caD);
        vec4 s0G = backdrop(pd + refr);
        vec4 s0B = backdrop(pd + refr - caD);
        float w0 = 1.0;
        acc += vec3(s0R.r*s0R.a, s0G.g*s0G.a, s0B.b*s0B.a) * w0;
        accA += s0G.a * w0; accW += w0;
      }
      for (int i = 0; i < 6; i++) {
        float a2 = TAU * float(i) / 6.0;
        vec2 dirv = vec2(cos(a2), sin(a2));
        // inner ring at 0.65 sigma
        {
          vec2 j = dirv * frostSigma * 0.65;
          vec4 sR = backdrop(pd + refr + caD + j);
          vec4 sG = backdrop(pd + refr + j);
          vec4 sB = backdrop(pd + refr - caD + j);
          float w = 0.8;
          acc += vec3(sR.r*sR.a, sG.g*sG.a, sB.b*sB.a) * w;
          accA += sG.a * w; accW += w;
        }
        // outer ring at 1.35 sigma, rotated half-step
        {
          vec2 j = rot2d(TAU/12.0) * dirv * frostSigma * 1.35;
          vec4 sR = backdrop(pd + refr + caD + j);
          vec4 sG = backdrop(pd + refr + j);
          vec4 sB = backdrop(pd + refr - caD + j);
          float w = 0.45;
          acc += vec3(sR.r*sR.a, sG.g*sG.a, sB.b*sB.a) * w;
          accA += sG.a * w; accW += w;
        }
      }
      float alpha = accA / accW;
      vec3 refracted = alpha > 0.001 ? acc / accW / alpha : vec3(0.0);
      c = vec4(refracted, alpha);

      // specular: light 293deg, intensity 1.0, splay .4 + fresnel
      vec3 L = normalize(vec3(cos(radians(293.0)), sin(radians(293.0)), 0.6));
      vec3 Hh = normalize(L + vec3(0.0,0.0,1.0));
      float shin = mix(120.0, 8.0, 0.4);
      float spec = pow(max(dot(N,Hh),0.0), shin) * 1.0 * uSpecGain;
      float fres = pow(1.0 - abs(N.z), 4.0) * 1.0 * uSpecGain;
      c.rgb += spec + fres * 0.25;
    } else {
      c = backdrop(pd);
    }

    if (uShowGlassFill > 0.5 && d <= 0.0) {
      // glass fill: ~vertical white->#999 at 20%
      vec3 fillCol = mix(vec3(1.0), vec3(0.6), uv.y);
      c = over(vec4(fillCol, 0.20), c);
    }
    if (uShowInner > 0.5 && d <= 0.0) {
      float ds = sdRoundRect(pd - vec2(0.0, 4.83) - DESIGN*0.5, DESIGN*0.5, G_RADIUS);
      float sh = 1.0 - clamp(0.5 + 0.5*(-ds)/(77.57*0.5*1.6), 0.0, 1.0);
      c.rgb = mix(c.rgb, vec3(1.0), 0.25 * sh);
    }

    float mask = 1.0 - smoothstep(-1.0, 1.0, d);
    c.a *= mask;

    if (uShowStroke > 0.5) {
      float band = abs(d) - 2.42 * 0.5;
      float strokeA = 1.0 - smoothstep(-0.75, 0.75, band);
      c = over(vec4(strokeGrad(uv), strokeA), c);
    }

    gl_FragColor = vec4(c.rgb * c.a, c.a);
  }
`
