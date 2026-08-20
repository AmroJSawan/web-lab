/**
 * CSS/SVG liquid glass, ported from the user's reference stylesheet:
 *   .glass-filter   -> backdrop distortion via SVG filter #lg-dist
 *   .glass-overlay  -> rgba(255,255,255,0.25) wash
 *   .glass-specular -> inset 1px 1px 0 + inset 0 0 5px rgba(255,255,255,0.75)
 * Paint-only, absolutely positioned; zero impact on the host's form factor.
 *
 * The #lg-dist displacement (feTurbulence -> feDisplacementMap) rides on
 * backdrop-filter, which accepts SVG filters in Chromium only — Safari and
 * Firefox gracefully degrade to the overlay + specular without distortion.
 */
export function LiquidGlass() {
  return (
    <>
      <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="lg-dist" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.008 0.008"
              numOctaves="2"
              seed="92"
              result="noise"
            />
            <feGaussianBlur in="noise" stdDeviation="2" result="blurred" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="blurred"
              scale="70"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* .glass-filter */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          backdropFilter: 'url(#lg-dist) blur(0px)',
          WebkitBackdropFilter: 'blur(0px)',
          isolation: 'isolate',
        }}
      />
      {/* .glass-overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{ background: 'rgba(255, 255, 255, 0.25)' }}
      />
      {/* .glass-specular */}
      <div
        className="pointer-events-none absolute inset-0 z-[3] overflow-hidden rounded-[inherit]"
        style={{
          boxShadow:
            'inset 1px 1px 0 rgba(255, 255, 255, 0.75), inset 0 0 5px rgba(255, 255, 255, 0.75)',
        }}
      />
    </>
  )
}
