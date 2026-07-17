import { UK_REGIONS, type University } from '@studyou/types'
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion'
import {
  ArrowUpRight,
  Check,
  ExternalLink,
  GraduationCap,
  LayoutGrid,
  Plus,
  RotateCcw,
  Search,
  SearchX,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { QueryError } from '../components/QueryError'
import { Button } from '../components/ui/button'
import { Input, Select } from '../components/ui/input'
import { CardSkeleton } from '../components/ui/skeleton'
import { type UniversityFilters, useUniversities } from '../hooks/useUniversities'
import { cn } from '../lib/utils'
import { toast } from '../store/toastStore'

const defaultFilters: UniversityFilters = {
  search: '',
  regions: [],
  russellGroup: false,
  sort: 'rank',
}

type Mode = 'browse' | 'swipe'

export function UniversitiesPage() {
  const [filters, setFilters] = useState<UniversityFilters>(defaultFilters)
  const [mode, setMode] = useState<Mode>('browse')
  const [shortlist, setShortlist] = useState<University[]>([])
  const [skipped, setSkipped] = useState<string[]>([])
  const { data: universities, isPending, error, refetch, isRefetching } = useUniversities(filters)

  const toggleRegion = (region: string) => {
    setFilters((f) => ({
      ...f,
      regions: f.regions.includes(region)
        ? f.regions.filter((r) => r !== region)
        : [...f.regions, region],
    }))
  }

  const inShortlist = (u: University) => shortlist.some((s) => s.id === u.id)

  const addToShortlist = (u: University) => {
    if (!inShortlist(u)) {
      setShortlist((list) => [...list, u])
      toast.success(`${u.name} shortlisted.`)
    }
  }

  const removeFromShortlist = (id: string) => {
    setShortlist((list) => list.filter((s) => s.id !== id))
  }

  const deck = useMemo(
    () =>
      (universities ?? []).filter(
        (u) => !skipped.includes(u.id) && !shortlist.some((s) => s.id === u.id),
      ),
    [universities, skipped, shortlist],
  )

  return (
    <div className={shortlist.length > 0 ? 'pb-24' : undefined}>
      <header className="mb-6">
        <h1 className="text-title3 text-ink">Find your university</h1>
        <p className="text-xs text-ink-secondary mt-1">
          The top 100 UK universities with official admissions links for international and home
          students. Pick regions, browse or swipe, and shortlist as many as you like.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-52 max-w-72">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-tertiary"
          />
          <Input
            className="pl-8"
            placeholder="Search universities or cities..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <button
          onClick={() => setFilters({ ...filters, russellGroup: !filters.russellGroup })}
          aria-pressed={filters.russellGroup}
          className={cn(
            'text-xs font-medium px-3 py-1.5 rounded-full border transition-colors duration-[120ms] inline-flex items-center gap-1.5',
            filters.russellGroup
              ? 'bg-accent-solid border-transparent text-white shadow-sm [background-image:var(--accent-gradient)]'
              : 'bg-surface border-hairline-strong text-ink-secondary hover:bg-surface-secondary hover:text-ink',
          )}
        >
          <GraduationCap size={13} />
          Russell Group
        </button>

        <Select
          className="w-36 h-8 text-xs"
          value={filters.sort}
          onChange={(e) => setFilters({ ...filters, sort: e.target.value as 'rank' | 'name' })}
          aria-label="Sort universities by"
        >
          <option value="rank">Sort by rank</option>
          <option value="name">Sort by name</option>
        </Select>

        <fieldset
          className="inline-flex bg-surface-secondary p-[3px] rounded-sm border-0 ml-auto"
          aria-label="View mode"
        >
          <ModeButton
            active={mode === 'browse'}
            onClick={() => setMode('browse')}
            icon={LayoutGrid}
            label="Browse"
          />
          <ModeButton
            active={mode === 'swipe'}
            onClick={() => setMode('swipe')}
            icon={RotateCcw}
            label="Swipe"
          />
        </fieldset>
      </div>

      <fieldset
        className="flex flex-wrap gap-1.5 mb-6 border-0"
        aria-label="Filter by UK region, multiple allowed"
      >
        {UK_REGIONS.map((region) => {
          const active = filters.regions.includes(region)
          return (
            <button
              key={region}
              onClick={() => toggleRegion(region)}
              aria-pressed={active}
              className={cn(
                'text-xs font-medium px-3 py-1.5 rounded-full border transition-colors duration-[120ms]',
                active
                  ? 'bg-accent-solid border-transparent text-white shadow-sm [background-image:var(--accent-gradient)]'
                  : 'bg-surface border-hairline-strong text-ink-secondary hover:bg-surface-secondary hover:text-ink',
              )}
            >
              {region}
            </button>
          )
        })}
        {filters.regions.length > 0 && (
          <button
            onClick={() => setFilters({ ...filters, regions: [] })}
            className="text-xs font-medium px-3 py-1.5 rounded-full text-accent hover:bg-accent-soft transition-colors duration-[120ms]"
          >
            Clear regions
          </button>
        )}
      </fieldset>

      {isPending ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          {['a', 'b', 'c', 'd', 'e', 'f'].map((key) => (
            <CardSkeleton key={key} lines={3} />
          ))}
        </div>
      ) : error ? (
        <QueryError
          message="Universities could not be loaded. Check your connection and try again."
          onRetry={() => refetch()}
          retrying={isRefetching}
        />
      ) : (universities ?? []).length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No universities found"
          body="Try clearing your search, regions or the Russell Group filter to see more results."
          action={<Button onClick={() => setFilters(defaultFilters)}>Clear filters</Button>}
        />
      ) : mode === 'browse' ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          {(universities ?? []).map((u) => (
            <UniversityCard
              key={u.id}
              university={u}
              shortlisted={inShortlist(u)}
              onToggle={() => (inShortlist(u) ? removeFromShortlist(u.id) : addToShortlist(u))}
            />
          ))}
        </div>
      ) : (
        <SwipeDeck
          deck={deck}
          total={(universities ?? []).length}
          onShortlist={addToShortlist}
          onSkip={(u) => setSkipped((list) => [...list, u.id])}
          onReset={() => setSkipped([])}
        />
      )}

      <AnimatePresence>
        {shortlist.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-4 left-[276px] right-4 max-w-4xl mx-auto z-40 bg-surface border border-hairline-strong rounded-lg shadow-overlay p-4 flex flex-wrap items-center gap-3"
          >
            <div className="flex-1 min-w-48">
              <p className="text-body font-semibold text-ink">{shortlist.length} shortlisted</p>
              <p className="text-caption text-ink-secondary truncate max-w-md">
                {shortlist.map((s) => s.name).join(', ')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  for (const u of shortlist) window.open(u.internationalUrl, '_blank', 'noopener')
                }}
              >
                International pages
                <ArrowUpRight size={13} />
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  for (const u of shortlist) window.open(u.ugAdmissionsUrl, '_blank', 'noopener')
                }}
              >
                Open application pages
                <ArrowUpRight size={13} />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShortlist([])}>
                Clear
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ModeButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: typeof LayoutGrid
  label: string
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] text-caption font-semibold transition-colors duration-[120ms]',
        active ? 'bg-surface text-ink shadow-sm' : 'text-ink-secondary hover:text-ink',
      )}
    >
      <Icon size={12} />
      {label}
    </button>
  )
}

function UniversityCard({
  university: u,
  shortlisted,
  onToggle,
}: {
  university: University
  shortlisted: boolean
  onToggle: () => void
}) {
  return (
    <article className="bg-surface border border-hairline rounded-lg shadow-md p-4 flex flex-col gap-3 transition-transform duration-[120ms] hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-caption font-bold text-accent bg-accent-soft rounded-xs px-1.5 py-0.5 tabular-nums">
          #{u.rank}
        </span>
        <span className="flex items-center gap-1.5">
          {u.russellGroup && (
            <span className="text-micro font-semibold uppercase tracking-[0.05em] text-category-housing bg-category-housing-soft rounded-xs px-1.5 py-0.5">
              Russell Group
            </span>
          )}
          <button
            onClick={onToggle}
            aria-pressed={shortlisted}
            aria-label={
              shortlisted ? `Remove ${u.name} from shortlist` : `Add ${u.name} to shortlist`
            }
            className={cn(
              'h-6 w-6 flex items-center justify-center rounded-xs border transition-colors duration-[120ms]',
              shortlisted
                ? 'bg-accent-solid border-transparent text-white [background-image:var(--accent-gradient)]'
                : 'border-hairline-strong text-ink-secondary hover:bg-surface-secondary',
            )}
          >
            {shortlisted ? <Check size={13} /> : <Plus size={13} />}
          </button>
        </span>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-ink leading-snug">{u.name}</h3>
        <p className="text-caption text-ink-tertiary mt-0.5">
          {u.city}, {u.region}
        </p>
      </div>

      <p className="text-xs text-ink-secondary leading-relaxed grow">{u.notes}</p>

      <div className="flex items-center gap-3 border-t border-hairline pt-2.5 text-xs font-medium">
        <a
          href={u.website}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-accent hover:underline rounded-xs"
        >
          Website
          <ExternalLink size={10} />
        </a>
        <a
          href={u.internationalUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-accent hover:underline rounded-xs"
        >
          International
          <ExternalLink size={10} />
        </a>
        <a
          href={u.ugAdmissionsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-accent hover:underline rounded-xs ml-auto"
        >
          Apply
          <ExternalLink size={10} />
        </a>
      </div>
    </article>
  )
}

/* Tinder style deck: drag right to shortlist, left to skip. The two
   buttons perform the same actions for keyboard users. */
function SwipeDeck({
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
        <Button onClick={() => onShortlist(top)}>
          <Check size={14} />
          Shortlist
        </Button>
      </div>
    </div>
  )
}

function SwipeCard({
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
        className="absolute top-4 right-4 text-caption font-bold uppercase tracking-[0.05em] text-positive border-2 border-positive rounded-sm px-2 py-1 rotate-6"
      >
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
