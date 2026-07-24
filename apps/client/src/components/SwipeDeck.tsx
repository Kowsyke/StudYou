import type { University } from '@studyou/types'
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion'
import { ExternalLink, Heart, RotateCcw, X } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from './EmptyState'
import { Button } from './ui/button'

function formatGbpWhole(pence: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(pence / 100)
}

/* Tinder style deck: drag right to shortlist, left to skip. Buttons perform the same actions for keyboard users. */
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
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null)

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

  const triggerSwipe = (dir: 'left' | 'right') => {
    setExitDirection(dir)
    setTimeout(() => {
      if (dir === 'right') onShortlist(top)
      else onSkip(top)
      setExitDirection(null)
    }, 200)
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-caption text-ink-tertiary">
        {total - deck.length + 1} of {total} in this filter. Drag right to shortlist, left to skip.
      </p>
      <div className="relative w-[min(340px,88vw)] h-[320px]">
        <AnimatePresence mode="popLayout">
          {deck
            .slice(0, 3)
            .reverse()
            .map((u, index, visible) => {
              const position = visible.length - 1 - index
              const isTop = position === 0
              return (
                <SwipeCard
                  key={u.id}
                  university={u}
                  isTop={isTop}
                  position={position}
                  forcedExit={isTop ? exitDirection : null}
                  onShortlist={onShortlist}
                  onSkip={onSkip}
                />
              )
            })}
        </AnimatePresence>
      </div>
      <div className="flex items-center gap-4 pt-2">
        <button
          type="button"
          onClick={() => triggerSwipe('left')}
          aria-label={`Skip ${top.name}`}
          className="h-12 w-12 rounded-full border border-danger/30 bg-surface-secondary/80 text-danger shadow-md transition-transform duration-150 hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer"
        >
          <X size={20} />
        </button>
        <button
          type="button"
          onClick={() => triggerSwipe('right')}
          aria-label={`Shortlist ${top.name}`}
          className="h-14 px-6 rounded-full bg-accent-solid text-white font-bold shadow-lg shadow-accent/25 transition-transform duration-150 hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer [background-image:var(--accent-gradient)]"
        >
          <Heart size={18} className="fill-current" />
          Shortlist
        </button>
      </div>
    </div>
  )
}

export function SwipeCard({
  university: u,
  isTop,
  position,
  forcedExit,
  onShortlist,
  onSkip,
}: {
  university: University
  isTop: boolean
  position: number
  forcedExit: 'left' | 'right' | null
  onShortlist: (u: University) => void
  onSkip: (u: University) => void
}) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-18, 18])
  const shortlistOpacity = useTransform(x, [20, 120], [0, 1])
  const skipOpacity = useTransform(x, [-120, -20], [1, 0])
  const shortlistScale = useTransform(x, [20, 120], [0.8, 1.1])
  const skipScale = useTransform(x, [-120, -20], [1.1, 0.8])

  if (!isTop) {
    return (
      <motion.div
        animate={{
          y: position * 12,
          scale: 1 - position * 0.05,
          opacity: 1 - position * 0.2,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        aria-hidden="true"
        className="absolute inset-0 bg-surface border border-hairline rounded-2xl shadow-lg p-5 flex flex-col gap-3 pointer-events-none select-none"
        style={{ zIndex: -position }}
      >
        <span className="text-caption font-bold text-accent bg-accent-soft rounded-xs px-1.5 py-0.5 tabular-nums self-start">
          #{u.rank}
        </span>
        <div>
          <h3 className="text-body-lg font-bold text-ink leading-snug">{u.name}</h3>
          <p className="text-caption text-ink-tertiary mt-1">
            {u.city}, {u.region}
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      style={{ x, rotate, zIndex: 10 }}
      animate={
        forcedExit === 'right'
          ? { x: 500, rotate: 25, opacity: 0 }
          : forcedExit === 'left'
            ? { x: -500, rotate: -25, opacity: 0 }
            : { x: 0, rotate: 0 }
      }
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      onDragEnd={(_, info) => {
        const swipeThreshold = 100
        const velocityThreshold = 300
        if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
          onShortlist(u)
        } else if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
          onSkip(u)
        }
      }}
      whileDrag={{ scale: 1.03 }}
      className="absolute inset-0 bg-surface/95 backdrop-blur-md border border-hairline-strong rounded-2xl shadow-2xl p-5 flex flex-col gap-3 cursor-grab active:cursor-grabbing select-none"
    >
      {/* Shortlist Badge Overlay */}
      <motion.span
        style={{ opacity: shortlistOpacity, scale: shortlistScale }}
        className="absolute top-5 right-5 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-positive border-2 border-positive rounded-lg px-3 py-1 rotate-12 bg-positive-soft/80 shadow-md"
      >
        <Heart size={14} className="fill-current" />
        Shortlist
      </motion.span>

      {/* Skip Badge Overlay */}
      <motion.span
        style={{ opacity: skipOpacity, scale: skipScale }}
        className="absolute top-5 left-5 text-xs font-black uppercase tracking-wider text-danger border-2 border-danger rounded-lg px-3 py-1 -rotate-12 bg-danger-soft/80 shadow-md"
      >
        Skip
      </motion.span>

      <div className="flex items-center justify-between">
        <span className="text-caption font-bold text-accent bg-accent-soft border border-accent/20 rounded-md px-2 py-0.5 tabular-nums">
          Rank #{u.rank}
        </span>
        {u.russellGroup && (
          <span className="text-micro font-bold uppercase tracking-wider text-category-housing bg-category-housing-soft border border-category-housing/20 rounded-md px-2 py-0.5">
            Russell Group
          </span>
        )}
      </div>

      <div>
        <h3 className="text-title3 font-bold text-ink leading-tight">{u.name}</h3>
        <p className="text-caption font-medium text-ink-tertiary mt-1">
          {u.city}, {u.region}
        </p>
      </div>

      <p className="text-body-sm text-ink-secondary leading-relaxed grow line-clamp-3">{u.notes}</p>

      {u.tuitionIntlMinGbp !== null && u.tuitionIntlMaxGbp !== null && (
        <div className="bg-surface-secondary/40 rounded-lg p-2.5 border border-hairline/60">
          <p className="text-caption font-semibold text-ink-secondary tabular-nums">
            Tuition: {formatGbpWhole(u.tuitionIntlMinGbp)} to {formatGbpWhole(u.tuitionIntlMaxGbp)}{' '}
            / year
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 border-t border-hairline pt-3 text-xs font-semibold">
        <a
          href={u.internationalUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-accent hover:underline rounded-xs"
          onPointerDownCapture={(e) => e.stopPropagation()}
        >
          International
          <ExternalLink size={11} />
        </a>
        <a
          href={u.ugAdmissionsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-accent hover:underline rounded-xs ml-auto"
          onPointerDownCapture={(e) => e.stopPropagation()}
        >
          Admissions Portal
          <ExternalLink size={11} />
        </a>
      </div>
    </motion.div>
  )
}
