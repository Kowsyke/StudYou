import { motion } from 'framer-motion'
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
  toggles. Styling lives in index.css under .geo-region.
*/
export function UkGeoMap({ selected, counts, onToggle, onHover }: UkGeoMapProps) {
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
      {UK_GEO_REGIONS.map((geo) => {
        const active = selected.includes(geo.region)
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
            onMouseEnter={() => onHover?.(geo.region)}
            onMouseLeave={() => onHover?.(null)}
            animate={
              active
                ? {
                    scale: [1, 1.012, 1],
                    filter: [
                      'drop-shadow(0 0 1px rgba(67,100,247,0.15))',
                      'drop-shadow(0 0 4px rgba(67,100,247,0.35))',
                      'drop-shadow(0 0 1px rgba(67,100,247,0.15))',
                    ],
                  }
                : { scale: 1, filter: 'drop-shadow(0 0 0px transparent)' }
            }
            transition={
              active
                ? {
                    duration: 2.6,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'easeInOut',
                  }
                : { duration: 0.2 }
            }
          >
            {geo.paths.map((d) => (
              <path key={d.slice(0, 24)} d={d} />
            ))}
            <text x={geo.label[0]} y={geo.label[1]} className="geo-label" textAnchor="middle">
              {geo.short}
            </text>
            <text x={geo.label[0]} y={geo.label[1] + 11} className="geo-count" textAnchor="middle">
              {count}
            </text>
          </motion.g>
        )
      })}
    </svg>
  )
}
