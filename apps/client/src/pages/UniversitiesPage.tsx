import type { University } from '@studyou/types'
import { AnimatePresence, motion } from 'framer-motion'
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
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useEffect } from 'react'
import { EmptyState } from '../components/EmptyState'
import { QueryError } from '../components/QueryError'
import { SwipeDeck } from '../components/SwipeDeck'
import { UkGeoMap } from '../components/UkGeoMap'
import { Button } from '../components/ui/button'
import { Input, Select } from '../components/ui/input'
import { CardSkeleton } from '../components/ui/skeleton'
import { useJourney } from '../hooks/useJourney'
import { useRegionCosts } from '../hooks/useMeta'
import { type UniversityFilters, useUniversities } from '../hooks/useUniversities'
import { formatGbpWhole } from '../lib/format'
import { cn } from '../lib/utils'
import { usePreferencesStore } from '../store/preferencesStore'
import { useProfileStore } from '../store/profileStore'
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
  const shortlistIds = useProfileStore((s) => s.shortlistIds)
  const toggleShortlistId = useProfileStore((s) => s.toggleShortlist)
  const removeShortlistId = useProfileStore((s) => s.removeFromShortlist)
  const clearShortlistStore = useProfileStore((s) => s.clearShortlist)
  const [skipped, setSkipped] = useState<string[]>([])
  const { data: universities, isPending, error, refetch, isRefetching } = useUniversities(filters)
  const { data: allUniversities } = useUniversities(defaultFilters)
  const compactCards = usePreferencesStore((s) => s.compactCards)
  const { data: regionCosts } = useRegionCosts()
  const { data: overview } = useJourney()

  useEffect(() => {
    if (overview?.journey?.regions) {
      setFilters((f) => ({
        ...f,
        regions: overview.journey.regions ?? [],
      }))
    }
  }, [overview])

  const gridClass = compactCards
    ? 'grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3'
    : 'grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4'

  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const u of allUniversities ?? []) {
      counts[u.region] = (counts[u.region] ?? 0) + 1
    }
    return counts
  }, [allUniversities])

  const toggleRegion = (region: string) => {
    setFilters((f) => ({
      ...f,
      regions: f.regions.includes(region)
        ? f.regions.filter((r) => r !== region)
        : [...f.regions, region],
    }))
  }

  // Shortlist lives in the persisted profile store so it survives
  // reloads and shows up on the profile page.
  const shortlist = useMemo(
    () => (allUniversities ?? []).filter((u) => shortlistIds.includes(u.id)),
    [allUniversities, shortlistIds],
  )

  const inShortlist = (u: University) => shortlistIds.includes(u.id)

  const addToShortlist = (u: University) => {
    if (!inShortlist(u)) {
      toggleShortlistId(u.id)
      toast.success(`${u.name} shortlisted.`)
    }
  }

  const removeFromShortlist = (id: string) => removeShortlistId(id)

  const deck = useMemo(
    () =>
      (universities ?? []).filter((u) => !skipped.includes(u.id) && !shortlistIds.includes(u.id)),
    [universities, skipped, shortlistIds],
  )

  return (
    <div className={shortlist.length > 0 ? 'pb-24' : undefined}>
      <header className="mb-6">
        <h1 className="text-title3 text-ink">Find your university</h1>
        <p className="text-xs text-ink-secondary mt-1">
          200 UK universities with official admissions links for international and home students.
          Pick regions, browse or swipe, and shortlist as many as you like.
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 mb-7">
        <div className="shrink-0">
          <p className="text-caption font-semibold uppercase tracking-[0.05em] text-ink-secondary mb-2.5">
            Pick your regions
          </p>
          <UkGeoMap selected={filters.regions} counts={regionCounts} onToggle={toggleRegion} />
          {filters.regions.length > 0 ? (
            <button
              onClick={() => setFilters({ ...filters, regions: [] })}
              className="mt-2.5 text-xs font-medium text-accent hover:underline rounded-xs"
            >
              Clear {filters.regions.length} selected
            </button>
          ) : (
            <p className="mt-2.5 text-caption text-ink-tertiary">
              No regions selected, showing the whole UK.
            </p>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary"
            />
            <Input
              className="pl-9 h-10"
              placeholder="Search universities or cities..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
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
              className="inline-flex bg-surface-secondary p-[3px] rounded-sm border-0"
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

          <p className="text-caption text-ink-tertiary">
            {(universities ?? []).length} universities in this view. Every link goes to the official
            university page, for international and home students.
          </p>

          {/* Fills the space beside the map: living costs for the picked regions,
              or a short prompt to pick one when nothing is selected yet. */}
          {filters.regions.length > 0 &&
          (regionCosts ?? []).some((rc) => filters.regions.includes(rc.region)) ? (
            <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(regionCosts ?? [])
                .filter((rc) => filters.regions.includes(rc.region))
                .slice(0, 6)
                .map((rc) => (
                  <div
                    key={rc.region}
                    className="bg-surface/60 border border-hairline rounded-md px-3 py-2 flex flex-col gap-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-ink text-xs">{rc.region}</span>
                      <span className="text-micro text-ink-muted capitalize">
                        {rc.costLevel} cost
                      </span>
                    </div>
                    <div className="text-caption text-ink-tertiary flex flex-col gap-0.5 mt-0.5 leading-snug">
                      <span>
                        Rent: {formatGbpWhole(rc.monthlyRentMinGbp)} to{' '}
                        {formatGbpWhole(rc.monthlyRentMaxGbp)}
                      </span>
                      <span>Living: {formatGbpWhole(rc.monthlyLivingGbp)} per month</span>
                      <span>Transport pass: {formatGbpWhole(rc.transportPassGbp)}</span>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="mt-1 rounded-lg border border-dashed border-hairline-strong bg-surface/40 px-4 py-5 flex items-start gap-3">
              <span className="mt-0.5 h-8 w-8 shrink-0 rounded-full bg-accent-soft flex items-center justify-center text-accent">
                <GraduationCap size={16} />
              </span>
              <div>
                <p className="text-body font-semibold text-ink">Pick a region to compare costs</p>
                <p className="text-caption text-ink-tertiary mt-0.5 leading-relaxed">
                  Tap regions on the map to filter the list and see typical monthly rent, living
                  and transport costs for each one, side by side.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

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
        <div className={gridClass}>
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
              <Button variant="ghost" size="sm" onClick={clearShortlistStore}>
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

      {u.tuitionIntlMinGbp !== null && u.tuitionIntlMaxGbp !== null && (
        <div className="bg-canvas border border-hairline rounded-sm px-2.5 py-2 tabular-nums">
          <p className="text-xs font-semibold text-ink">
            {formatGbpWhole(u.tuitionIntlMinGbp)} to {formatGbpWhole(u.tuitionIntlMaxGbp)}
            <span className="text-ink-tertiary font-normal"> per year international</span>
          </p>
          {u.tuitionHomeGbp !== null && (
            <p className="text-caption text-ink-secondary mt-0.5">
              Home students: {formatGbpWhole(u.tuitionHomeGbp)} per year
            </p>
          )}
          <p className="text-micro text-ink-tertiary mt-0.5">
            Indicative, always confirm on the official page.
          </p>
        </div>
      )}

      <div className="flex items-center gap-x-3 gap-y-1 flex-wrap border-t border-hairline pt-2.5 text-xs font-medium">
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
        {u.scholarshipsUrl && (
          <a
            href={u.scholarshipsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-accent hover:underline rounded-xs"
          >
            Scholarships
            <ExternalLink size={10} />
          </a>
        )}
        {u.accommodationUrl && (
          <a
            href={u.accommodationUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-accent hover:underline rounded-xs"
          >
            Accommodation
            <ExternalLink size={10} />
          </a>
        )}
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
