// Dark glass surface for the "See more" button — same glass model as the card
// (squircle bevel, Snell refraction, Blinn-Phong + Fresnel), fed by the
// button's own Figma layer stack (node 1:1373 "colored animated"):
//   FX shader 02: pill, vertical #E7E7E7(45%) -> #101010 gradient
//   FX shader 3 : light sheen strip
//   Solid       : dark pill #313131 -> #000, LAYER_BLUR 51.9
//   Glass       : refraction .32, depth 12.65, light -45deg, intensity .8,
//                 dispersion .37, splay .4, frost 0
//                 + INNER_SHADOW white 25% (0, 1.01) blur 16.24
//                 + fill black 20%
//   stroke      : #D4D4D4 -> #E0E1F8 -> #FFF gradient, 1.52 centered
// Design space: 147.4 x 61.34 px.

export const buttonGlassVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`

export const buttonGlassFragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform vec2  uSize;      // rendered px
  uniform float uRadius;    // corner radius in DESIGN px (measured from the DOM)
  uniform float uGlassScale;
  uniform float uGlassDisp;
  uniform float uSpecGain;

  #define TAU 6.28318530718
  #define DESIGN vec2(147.4, 61.34)

  float sdRoundRect(vec2 p, vec2 b, float r) {
    r = min(r, min(b.x, b.y));
    vec2 q = abs(p) - b + r;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
  }

  // FX shader 02: pill 143.2x42.25 at (12.9, 8.25), vertical gradient
  vec4 layerFx02(vec2 pd) {
    vec2 pos = vec2(12.9, 8.25);
    vec2 sz = vec2(143.19, 42.25);
    float d = sdRoundRect(pd - pos - sz*0.5, sz*0.5, sz.y*0.5);
    float a = 1.0 - smoothstep(-0.75, 0.75, d);
    float t = clamp(((pd.y - pos.y)/sz.y - 0.4519) / (1.0 - 0.4519), 0.0, 1.0);
    vec3 col = mix(vec3(0.906), vec3(0.063), t);
    return vec4(col, a);
  }

  // Solid: dark blurred pill 125.5x39.97 at (19.73, 10.53), blur 51.9
  vec4 layerSolidD(vec2 pd) {
    vec2 pos = vec2(19.73, 10.53);
    vec2 sz = vec2(125.48, 39.97);
    float d = sdRoundRect(pd - pos - sz*0.5, sz*0.5, sz.y*0.5);
    float sigma = 51.91 * 0.568;
    // Tighter falloff than the generic erf approx: the reference keeps a deep
    // near-black core with light only at the extreme rim.
    float a = clamp(0.5 - 0.5 * d / (sigma * 0.85), 0.0, 1.0);
    a = pow(a, 0.75);
    float t = clamp((pd.x - pos.x)/sz.x, 0.0, 1.0);
    vec3 col = mix(vec3(0.193), vec3(0.0), t);
    return vec4(col, a);
  }

  vec4 over(vec4 top, vec4 bottom) {
    float a = top.a + bottom.a * (1.0 - top.a);
    vec3 rgb = a > 0.0 ? (top.rgb*top.a + bottom.rgb*bottom.a*(1.0-top.a)) / a : vec3(0.0);
    return vec4(rgb, a);
  }

  vec4 backdrop(vec2 pd) {
    vec4 c = vec4(0.0);
    c = over(layerFx02(pd), c);
    c = over(layerSolidD(pd), c);
    return c;
  }

  #define G_DEPTH 12.65
  float glassHeight(float inside){
    float x = clamp(inside / G_DEPTH, 0.0, 1.0);
    return pow(1.0 - pow(1.0 - x, 4.0), 0.25);
  }
  float glassH(vec2 pd){
    float inside = -sdRoundRect(pd - DESIGN*0.5, DESIGN*0.5, uRadius);
    return glassHeight(max(inside, 0.0));
  }

  vec3 strokeGrad(vec2 uv){
    float t = clamp(0.6875*uv.x + 0.0843*uv.y + 0.0979, 0.0, 1.0);
    vec3 c1=vec3(0.8314), c2=vec3(0.8784,0.8824,0.9725), c3=vec3(1.0);
    return t<0.4904 ? mix(c1,c2,t/0.4904) : mix(c2,c3,(t-0.4904)/(1.0-0.4904));
  }

  void main() {
    vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
    vec2 pd = uv * DESIGN;
    float d = sdRoundRect(pd - DESIGN*0.5, DESIGN*0.5, uRadius);

    vec4 c;
    if (d <= 0.0) {
      float inside = -d;
      float e = 0.75;
      vec2 hg = vec2(glassH(pd+vec2(e,0.0)) - glassH(pd-vec2(e,0.0)),
                     glassH(pd+vec2(0.0,e)) - glassH(pd-vec2(0.0,e))) / (2.0*e) * G_DEPTH;
      vec3 N = normalize(vec3(-hg, 1.0));
      float edge = 1.0 - smoothstep(0.0, G_DEPTH, inside);

      // refraction .32, same Snell scaling as the card (uGlassScale shared)
      float mag = 0.32 * (1.0 - 1.0/1.5) * uGlassScale * 0.35; // scaled to button size
      vec2 refr = N.xy * mag;
      float caS = 0.37 * uGlassDisp * 0.35 * (edge*0.85 + 0.15);
      vec2 caD = N.xy * caS;

      vec4 sR = backdrop(pd + refr + caD);
      vec4 sG = backdrop(pd + refr);
      vec4 sB = backdrop(pd + refr - caD);
      float alpha = sG.a;
      vec3 rgb = vec3(sR.r, sG.g, sB.b);
      c = vec4(rgb, alpha);

      // specular: light -45deg, intensity .8, splay .4 + fresnel
      vec3 L = normalize(vec3(cos(radians(-45.0)), sin(radians(-45.0)), 0.6));
      vec3 Hh = normalize(L + vec3(0.0,0.0,1.0));
      float shin = mix(120.0, 8.0, 0.4);
      float spec = pow(max(dot(N,Hh),0.0), shin) * 0.8 * uSpecGain;
      float fres = pow(1.0 - abs(N.z), 4.0) * 0.8 * uSpecGain;
      c.rgb += spec + fres * 0.25;

      // glass fill: black 20%
      c = over(vec4(vec3(0.0), 0.20), c);

      // inner shadow: white 25%, offset (0, 1.01), blur 16.24
      float ds = sdRoundRect(pd - vec2(0.0, 1.01) - DESIGN*0.5, DESIGN*0.5, uRadius);
      float sh = 1.0 - clamp(0.5 + 0.5*(-ds)/(16.24*0.5*1.6), 0.0, 1.0);
      c.rgb = mix(c.rgb, vec3(1.0), 0.25 * sh);
    } else {
      c = vec4(0.0);
    }

    float mask = 1.0 - smoothstep(-0.75, 0.75, d);
    c.a *= mask;

    // stroke: gradient, 1.52 centered
    float band = abs(d) - 1.52 * 0.5;
    float strokeA = 1.0 - smoothstep(-0.6, 0.6, band);
    c = over(vec4(strokeGrad(uv), strokeA), c);

    gl_FragColor = vec4(c.rgb * c.a, c.a);
  }
`
