// Surface material for the card, inherited from Figma node 1:1351 (Materials Raw).
// The card's own layout/typography/border come from the shadcn Card; only this
// flowing warm glass SURFACE is inherited. Reproduces the reference's layer
// stack: white base, a warm peach/green domain-warped flow biased to the right
// (FX shader 4), soft wave streaks, a glass rim + inner shadow, and the same
// gradient stroke as the button experiment.

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

  uniform vec2  uSize;      // px
  uniform float uRadius;    // corner radius px
  uniform float uWarm;      // 0..1 warm-material intensity
  uniform float uSpecGain;  // glass rim specular gain

  #define UNIT (uSize.y / 524.37)

  // ---- helpers ----
  float sdRoundRect(vec2 p, vec2 b, float r) {
    r = min(r, min(b.x, b.y));
    vec2 q = abs(p) - b + r;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
  }
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
  float vnoise(vec2 p){
    vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),
               mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);
  }

  // Warm flowing material (FX shader 4): domain-warped soft bands, white base,
  // pale-green mid, peach on the right, strongest toward the lower-right.
  vec3 warmMaterial(vec2 uv) {
    vec3 white     = vec3(1.0);
    vec3 paleGreen = vec3(0.855, 0.906, 0.855);
    vec3 peach     = vec3(0.929, 0.601, 0.383);
    vec3 cream     = vec3(0.984, 0.945, 0.905);

    // domain warp for the organic flow
    vec2 p = uv;
    float w = sin(p.y * 5.0 + p.x * 2.2) * 0.07
            + sin(p.y * 9.5 - p.x * 1.4) * 0.035
            + (vnoise(p * 3.0) - 0.5) * 0.06;
    float fx = p.x + w;

    // soft flowing streaks along the flow direction
    float bands = 0.5 + 0.5 * sin(fx * 13.0 + sin(p.y * 3.2) * 1.6);
    bands = mix(0.5, bands, 0.7);

    // right-biased warm mask, plus a lower-right boost
    float warm = smoothstep(0.28, 0.98, fx);
    warm *= mix(0.7, 1.2, smoothstep(0.1, 1.0, p.y));

    // faint green band left of the warm zone
    float green = exp(-pow((fx - 0.44) / 0.15, 2.0)) * 0.65;

    vec3 col = white;
    col = mix(col, paleGreen, green * (0.45 + 0.55 * bands) * uWarm);
    col = mix(col, cream, warm * 0.4 * uWarm);
    col = mix(col, peach, clamp(warm * (0.32 + 0.68 * bands) * 0.9, 0.0, 1.0) * uWarm);
    return col;
  }

  // squircle glass edge for the card rim
  float glassHeight(float inside, float depth){
    float x = clamp(inside/depth, 0.0, 1.0);
    return pow(1.0 - pow(1.0 - x, 4.0), 0.25);
  }

  // gradient stroke: #D4D4D4 -> #E0E1F8 (49%) -> #FFFFFF, same transform basis
  vec3 strokeGrad(vec2 uv){
    float t = clamp(0.6875*uv.x + 0.0843*uv.y + 0.0979, 0.0, 1.0);
    vec3 c1=vec3(0.8314), c2=vec3(0.8784,0.8824,0.9725), c3=vec3(1.0);
    return t<0.4904 ? mix(c1,c2,t/0.4904) : mix(c2,c3,(t-0.4904)/(1.0-0.4904));
  }

  void main() {
    vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
    vec2 p = uv * uSize;
    vec2 center = uSize * 0.5;
    vec2 hsize = uSize * 0.5;
    float d = sdRoundRect(p - center, hsize, uRadius);

    vec3 base = warmMaterial(uv);

    // Glass rim: light refraction of the material + specular + inner-shadow glow.
    float depth = 120.82 * UNIT;
    float inside = -d;
    float e = 1.5 * UNIT;
    float hR = glassHeight(max(-sdRoundRect(p+vec2(e,0)-center,hsize,uRadius),0.0), depth);
    float hL = glassHeight(max(-sdRoundRect(p-vec2(e,0)-center,hsize,uRadius),0.0), depth);
    float hU = glassHeight(max(-sdRoundRect(p+vec2(0,e)-center,hsize,uRadius),0.0), depth);
    float hD = glassHeight(max(-sdRoundRect(p-vec2(0,e)-center,hsize,uRadius),0.0), depth);
    vec2 hGrad = vec2(hR-hL, hU-hD)/(2.0*e)*depth;
    vec3 N = normalize(vec3(-hGrad, 1.0));
    float edge = 1.0 - smoothstep(0.0, depth, inside);

    // refract the material slightly along the rim normal
    float mag = 0.84 * (1.0 - 1.0/1.5) * 26.0 * UNIT;
    vec2 refr = N.xy * mag / uSize;
    vec3 col = warmMaterial(uv + vec2(refr.x, -refr.y));
    col = mix(base, col, edge);

    // specular (lightAngle 293deg) + fresnel, whitening the rim
    vec3 L = normalize(vec3(cos(radians(293.0)), sin(radians(293.0)), 0.6));
    vec3 H = normalize(L + vec3(0,0,1));
    float shin = mix(120.0, 8.0, 0.4);
    float spec = pow(max(dot(N,H),0.0), shin) * uSpecGain;
    float fres = pow(1.0 - abs(N.z), 4.0) * uSpecGain;
    col += spec + fres * 0.2;

    // inner shadow: white 25%, blur 77.6 -> soft inward glow from edges
    float sh = 1.0 - clamp(0.5 + 0.5*(-sdRoundRect(p - vec2(0.0, 4.83*UNIT) - center, hsize, uRadius))/(77.57*UNIT*0.5*1.6), 0.0, 1.0);
    col = mix(col, vec3(1.0), 0.25 * sh);

    // Glass fill: white->#999 vertical, 20% opacity
    vec3 fillCol = mix(vec3(1.0), vec3(0.6), uv.y);
    col = mix(col, fillCol, 0.20);

    // clip to the card rounded rect
    float mask = 1.0 - smoothstep(-1.0, 1.0, d);

    // centered gradient stroke (weight 2.42)
    float sw = 2.42 * UNIT;
    float band = abs(d) - sw * 0.5;
    float strokeA = 1.0 - smoothstep(-0.75, 0.75, band);
    col = mix(col, strokeGrad(uv), strokeA);

    gl_FragColor = vec4(col * mask, mask);
  }
`
