import { ArrowDownUp, ExternalLink, Search, SearchX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { QueryError } from '../components/QueryError'
import { Button } from '../components/ui/button'
import { Input, Select } from '../components/ui/input'
import { CardSkeleton } from '../components/ui/skeleton'
import { useCategories } from '../hooks/useMeta'
import { type ResourceFilters, useResources } from '../hooks/useResources'
import { formatDate, formatGbp } from '../lib/format'
import { cn } from '../lib/utils'

const defaultFilters: ResourceFilters = { search: '', category: '', sort: 'title', order: 'asc' }

export function ResourcesPage() {
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState<ResourceFilters>({
    ...defaultFilters,
    search: searchParams.get('search') ?? '',
  })
  const { data: categories } = useCategories()
  const { data: resources, isPending, error, refetch, isRefetching } = useResources(filters)

  useEffect(() => {
    const fromPalette = searchParams.get('search')
    if (fromPalette !== null) {
      setFilters((f) => ({ ...f, search: fromPalette }))
    }
  }, [searchParams])

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-title3 text-ink">Resource library</h1>
        <p className="text-xs text-ink-secondary mt-1">
          Every rule, cost and requirement, sourced from official pages. No agency needed.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-52 max-w-80">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-tertiary"
          />
          <Input
            className="pl-8"
            placeholder="Search resources..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <fieldset
          className="flex flex-wrap items-center gap-1.5 border-0"
          aria-label="Filter by category"
        >
          <CategoryPill
            label="All"
            active={filters.category === ''}
            onClick={() => setFilters({ ...filters, category: '' })}
          />
          {(categories ?? []).map((c) => (
            <CategoryPill
              key={c.id}
              label={c.label}
              active={filters.category === c.key}
              onClick={() => setFilters({ ...filters, category: c.key })}
            />
          ))}
        </fieldset>

        <div className="flex items-center gap-2 ml-auto">
          <Select
            className="w-40 h-8 text-xs"
            value={filters.sort}
            onChange={(e) =>
              setFilters({ ...filters, sort: e.target.value as ResourceFilters['sort'] })
            }
            aria-label="Sort by"
          >
            <option value="title">Sort by title</option>
            <option value="cost">Sort by cost</option>
            <option value="deadline">Sort by deadline</option>
            <option value="updated">Sort by last updated</option>
          </Select>
          <button
            onClick={() =>
              setFilters({ ...filters, order: filters.order === 'asc' ? 'desc' : 'asc' })
            }
            aria-label={`Order ${filters.order === 'asc' ? 'ascending' : 'descending'}`}
            title="Toggle order"
            className="h-8 w-8 flex items-center justify-center rounded-sm border border-hairline-strong bg-surface text-ink-secondary hover:bg-surface-secondary transition-colors duration-[120ms]"
          >
            <ArrowDownUp size={14} />
          </button>
        </div>
      </div>

      {isPending ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {['a', 'b', 'c', 'd', 'e', 'f'].map((key) => (
            <CardSkeleton key={key} lines={3} />
          ))}
        </div>
      ) : error ? (
        <QueryError
          message="The resource library could not be loaded. Check your connection and try again."
          onRetry={() => refetch()}
          retrying={isRefetching}
        />
      ) : (resources ?? []).length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No resources found"
          body="Try clearing your filters or changing your search term to see more results."
          action={<Button onClick={() => setFilters(defaultFilters)}>Clear filters</Button>}
        />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {(resources ?? []).map((resource) => (
            <article
              key={resource.id}
              className="bg-surface border border-hairline rounded-md shadow-sm p-4 flex flex-col gap-3"
            >
              <div className="flex justify-between items-center text-caption text-ink-tertiary">
                <span className="capitalize">{resource.categoryKey}</span>
                <span>Updated {formatDate(resource.lastUpdated)}</span>
              </div>
              <h3 className="text-sm font-semibold text-ink leading-normal">{resource.title}</h3>
              <p className="text-xs text-ink-secondary leading-relaxed grow">{resource.summary}</p>
              <div className="flex items-center justify-between border-t border-hairline pt-2.5 text-xs">
                <span className="font-semibold text-ink tabular-nums">
                  {resource.costPence !== null ? formatGbp(resource.costPence) : 'No fee'}
                </span>
                <a
                  href={resource.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-accent font-medium hover:underline rounded-xs"
                >
                  Official source
                  <ExternalLink size={10} />
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function CategoryPill({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'text-xs font-medium px-3 py-1.5 rounded-full border transition-colors duration-[120ms]',
        active
          ? 'bg-accent-solid border-transparent text-white shadow-sm [background-image:var(--accent-gradient)]'
          : 'bg-surface border-hairline-strong text-ink-secondary hover:bg-surface-secondary hover:text-ink',
      )}
    >
      {label}
    </button>
  )
}
