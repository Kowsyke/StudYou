import type { University } from '@studyou/types'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { ExternalLink, Heart, RotateCcw, X } from 'lucide-react'
import { EmptyState } from './EmptyState'
import { Button } from './ui/button'

function formatGbpWhole(pence: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(pence / 100)
}

/* Tinder style deck: drag right to shortlist, left to skip. The two
   buttons perform the same actions for keyboard users. */
export function SwipeDeck({
  deck,
  total,
  onShortlist,
  onSkip,
  onReset,
}: {
  deck: University[]
  total: number
  onShortlist: (u: University) => void
  onSkip: (u: University) => void
  onReset: () => void
}) {
  const top = deck[0]

  if (!top) {
    return (
      <EmptyState
        icon={RotateCcw}
        title="You have seen every match"
        body="Every university in this filter has been shortlisted or skipped. Reset the skipped pile or change your filters."
        action={
          <Button variant="secondary" onClick={onReset}>
            <RotateCcw size={14} />
            Reset skipped
          </Button>
        }
      />
    )
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-caption text-ink-tertiary">
        {total - deck.length + 1} of {total} in this filter. Drag right to shortlist, left to skip.
      </p>
      <div className="relative w-[340px] h-[300px]">
        {deck
          .slice(0, 3)
          .reverse()
          .map((u, index, visible) => {
            const position = visible.length - 1 - index
            return position === 0 ? (
              <SwipeCard key={u.id} university={u} onShortlist={onShortlist} onSkip={onSkip} />
            ) : (
              <div
                key={u.id}
                aria-hidden="true"
                className="absolute inset-0 bg-surface border border-hairline rounded-lg shadow-md"
                style={{
                  transform: `translateY(${position * 10}px) scale(${1 - position * 0.04})`,
                  zIndex: -position,
                  opacity: 1 - position * 0.25,
                }}
              />
            )
          })}
      </div>
      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={() => onSkip(top)}>
          <X size={14} />
          Skip
        </Button>
        <button
          onClick={() => onShortlist(top)}
          aria-label={`Shortlist ${top.name}`}
          className="group sheen inline-flex items-center gap-2 h-9 px-4 rounded-full text-body font-semibold bg-surface text-danger border border-hairline-strong shadow-sm transition-all duration-[120ms] hover:border-danger hover:shadow-md active:scale-[0.96]"
        >
          <Heart
            size={16}
            className="transition-all duration-200 fill-transparent group-hover:fill-current group-hover:scale-110 group-active:scale-125"
          />
          Shortlist
        </button>
      </div>
    </div>
  )
}

export function SwipeCard({
  university: u,
  onShortlist,
  onSkip,
}: {
  university: University
  onShortlist: (u: University) => void
  onSkip: (u: University) => void
}) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-9, 9])
  const shortlistOpacity = useTransform(x, [40, 140], [0, 1])
  const skipOpacity = useTransform(x, [-140, -40], [1, 0])

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      style={{ x, rotate }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 120) onShortlist(u)
        else if (info.offset.x < -120) onSkip(u)
      }}
      whileDrag={{ scale: 1.02 }}
      className="absolute inset-0 bg-surface border border-hairline rounded-lg shadow-lg p-5 flex flex-col gap-3 cursor-grab active:cursor-grabbing select-none"
    >
      <motion.span
        style={{ opacity: shortlistOpacity }}
        className="absolute top-4 right-4 inline-flex items-center gap-1 text-caption font-bold uppercase tracking-[0.05em] text-danger border-2 border-danger rounded-sm px-2 py-1 rotate-6"
      >
        <Heart size={12} className="fill-current" />
        Shortlist
      </motion.span>
      <motion.span
        style={{ opacity: skipOpacity }}
        className="absolute top-4 left-4 text-caption font-bold uppercase tracking-[0.05em] text-danger border-2 border-danger rounded-sm px-2 py-1 -rotate-6"
      >
        Skip
      </motion.span>

      <span className="text-caption font-bold text-accent bg-accent-soft rounded-xs px-1.5 py-0.5 tabular-nums self-start">
        #{u.rank}
      </span>
      <div>
        <h3 className="text-body-lg font-bold text-ink leading-snug">{u.name}</h3>
        <p className="text-caption text-ink-tertiary mt-1">
          {u.city}, {u.region}
        </p>
      </div>
      {u.russellGroup && (
        <span className="text-micro font-semibold uppercase tracking-[0.05em] text-category-housing bg-category-housing-soft rounded-xs px-1.5 py-0.5 self-start">
          Russell Group
        </span>
      )}
      <p className="text-body text-ink-secondary leading-relaxed grow">{u.notes}</p>
      {u.tuitionIntlMinGbp !== null && u.tuitionIntlMaxGbp !== null && (
        <p className="text-caption text-ink-secondary tabular-nums">
          {formatGbpWhole(u.tuitionIntlMinGbp)} to {formatGbpWhole(u.tuitionIntlMaxGbp)} per year
          international, indicative.
        </p>
      )}
      <div className="flex items-center gap-3 border-t border-hairline pt-3 text-xs font-medium">
        <a
          href={u.internationalUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-accent hover:underline rounded-xs"
          onPointerDownCapture={(e) => e.stopPropagation()}
        >
          International
          <ExternalLink size={10} />
        </a>
        <a
          href={u.ugAdmissionsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-accent hover:underline rounded-xs ml-auto"
          onPointerDownCapture={(e) => e.stopPropagation()}
        >
          Apply
          <ExternalLink size={10} />
        </a>
      </div>
    </motion.div>
  )
}
