import type { UkRegion } from '@studyou/types'
import { motion } from 'framer-motion'
import { cn } from '../lib/utils'

const swift = [0.16, 1, 0.3, 1] as const

/*
  Stylised tile cartogram of the twelve UK regions, the pattern used by
  UK statistical publications. Tiles sit roughly where the regions do
  (Scotland top, Northern Ireland west, London in the south east block)
  and every tile is a real button, so the map is fully keyboard operable
  and each label carries its own university count.
*/
const TILES: { region: UkRegion; short: string; col: number; row: number }[] = [
  { region: 'Scotland', short: 'Scotland', col: 3, row: 1 },
  { region: 'Northern Ireland', short: 'N. Ireland', col: 1, row: 2 },
  { region: 'North West', short: 'North West', col: 2, row: 2 },
  { region: 'North East', short: 'North East', col: 3, row: 2 },
  { region: 'Wales', short: 'Wales', col: 1, row: 3 },
  { region: 'West Midlands', short: 'W. Midlands', col: 2, row: 3 },
  { region: 'Yorkshire and the Humber', short: 'Yorkshire', col: 3, row: 3 },
  { region: 'East Midlands', short: 'E. Midlands', col: 2, row: 4 },
  { region: 'East of England', short: 'East England', col: 3, row: 4 },
  { region: 'South West', short: 'South West', col: 1, row: 5 },
  { region: 'London', short: 'London', col: 2, row: 5 },
  { region: 'South East', short: 'South East', col: 3, row: 5 },
]

interface UkRegionMapProps {
  selected: string[]
  counts: Record<string, number>
  onToggle: (region: string) => void
}

export function UkRegionMap({ selected, counts, onToggle }: UkRegionMapProps) {
  return (
    <fieldset
      className="grid grid-cols-3 gap-1.5 w-full max-w-[340px] border-0"
      aria-label="UK regions, select one or more"
    >
      {TILES.map((tile, index) => {
        const active = selected.includes(tile.region)
        const count = counts[tile.region] ?? 0
        return (
          <motion.button
            key={tile.region}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03, duration: 0.25, ease: swift }}
            onClick={() => onToggle(tile.region)}
            aria-pressed={active}
            aria-label={`${tile.region}, ${count} universities`}
            style={{ gridColumn: tile.col, gridRow: tile.row }}
            className={cn(
              'aspect-square rounded-md border p-2 flex flex-col items-start justify-between text-left transition-all duration-[120ms] hover:-translate-y-0.5',
              active
                ? 'border-transparent text-white shadow-md bg-accent-solid [background-image:var(--accent-gradient)]'
                : 'bg-surface border-hairline-strong text-ink-secondary hover:bg-surface-secondary hover:text-ink shadow-sm',
            )}
          >
            <span
              className={cn(
                'text-body-lg font-bold tabular-nums leading-none',
                active ? 'text-white' : 'text-ink',
              )}
            >
              {count}
            </span>
            <span className="text-micro font-semibold leading-tight">{tile.short}</span>
          </motion.button>
        )
      })}
    </fieldset>
  )
}
