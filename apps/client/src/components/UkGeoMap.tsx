import { motion } from 'framer-motion'
import { useState } from 'react'
import { UK_GEO_REGIONS, UK_MAP_VIEWBOX } from './ukGeoData'

interface UkGeoMapProps {
  selected: string[]
  counts: Record<string, number>
  onToggle: (region: string) => void
  onHover?: (region: string | null) => void
}

/*
  The real UK, twelve interactive regions from ONS boundaries. Hovering
  lifts a region and sharpens its label, selecting fills it with the
  accent. Every region is keyboard operable: tab to it, space or enter
  toggles. Base styling lives in index.css under .geo-region.

  Two structural details that are load bearing:

  1. Labels are painted in a second pass, after every region path. SVG
     paints in document order with no z-index, so a label living inside
     its own group was covered by the next region's path. That clipped
     "North West" to "North W", "W. Midlands" to "l. Midlands" and
     "London" to "ondon".

  2. The hover lift uses the CSS `translate` property, not `transform`.
     Framer Motion writes an inline `transform` onto every region for the
     selected-state pulse, and an inline style always beats a class rule,
     so `.geo-region:hover { transform: ... }` silently never applied.
     `translate` is a separate property that composes with `transform`
     rather than replacing it, so the two no longer fight.
*/
export function UkGeoMap({ selected, counts, onToggle, onHover }: UkGeoMapProps) {
  // Held here rather than in the parent so hover feedback works the same
  // on every screen. Previously the Universities page did not pass an
  // onHover handler and so had no hover response at all.
  const [hovered, setHovered] = useState<string | null>(null)

  const setHover = (region: string | null) => {
    setHovered(region)
    onHover?.(region)
  }

  return (
    <svg
      viewBox={UK_MAP_VIEWBOX}
      className="w-full max-w-[380px] select-none"
      style={{ overflow: 'visible' }}
      // biome-ignore lint/a11y/useSemanticElements: an SVG map cannot be replaced with a fieldset, the group role communicates the region collection to assistive tech.
      role="group"
      aria-label="UK regions map, select one or more regions"
    >
      <title>Interactive map of UK regions</title>

      {/* Pass one: the interactive region shapes. */}
      {UK_GEO_REGIONS.map((geo) => {
        const active = selected.includes(geo.region)
        // The shape's own lift is pure CSS (:hover / :focus-visible), so no
        // hovered flag is needed here. Only the detached label layer, which
        // CSS cannot reach from this element, is driven from React state.
        const count = counts[geo.region] ?? 0
        return (
          <motion.g
            key={geo.region}
            // biome-ignore lint/a11y/useSemanticElements: SVG shapes cannot be native buttons, so the group carries the button role with full keyboard handling.
            role="button"
            tabIndex={0}
            aria-pressed={active}
            aria-label={`${geo.region}, ${count} universities`}
            className={`geo-region ${active ? 'geo-region-active' : ''}`}
            onClick={() => onToggle(geo.region)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onToggle(geo.region)
              }
            }}
            onMouseEnter={() => setHover(geo.region)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(geo.region)}
            onBlur={() => setHover(null)}
            animate={{
              scale: active ? 1.012 : 1,
              filter: active
                ? 'drop-shadow(0 0 3px rgba(67,100,247,0.32))'
                : 'drop-shadow(0 0 0px transparent)',
            }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
          >
            {geo.paths.map((d) => (
              <path key={d.slice(0, 24)} d={d} />
            ))}
          </motion.g>
        )
      })}

      {/* Pass two: every label, above every path, so none can be covered.
          pointer-events none keeps the shapes underneath fully clickable. */}
      <g className="geo-label-layer" style={{ pointerEvents: 'none' }}>
        {UK_GEO_REGIONS.map((geo) => {
          const active = selected.includes(geo.region)
          const isHovered = hovered === geo.region
          const count = counts[geo.region] ?? 0
          return (
            <g key={geo.region} className={isHovered ? 'geo-lift' : undefined}>
              <text
                x={geo.label[0]}
                y={geo.label[1]}
                className={`geo-label ${isHovered ? 'geo-label-on' : ''} ${
                  active ? 'geo-label-selected' : ''
                }`}
                textAnchor="middle"
              >
                {geo.short}
              </text>
              <text
                x={geo.label[0]}
                y={geo.label[1] + 11}
                className={`geo-count ${isHovered ? 'geo-count-on' : ''} ${
                  active ? 'geo-count-selected' : ''
                }`}
                textAnchor="middle"
              >
                {count}
              </text>
            </g>
          )
        })}
      </g>
    </svg>
  )
}
