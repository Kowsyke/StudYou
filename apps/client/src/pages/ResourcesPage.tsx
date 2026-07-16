import { ArrowDownUp, ExternalLink, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input, Select } from '../components/ui/input'
import { useCategories } from '../hooks/useMeta'
import { type ResourceFilters, useResources } from '../hooks/useResources'
import { formatDate, formatGbp } from '../lib/format'

export function ResourcesPage() {
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState<ResourceFilters>({
    search: searchParams.get('search') ?? '',
    category: '',
    sort: 'title',
    order: 'asc',
  })
  const { data: categories } = useCategories()
  const { data: resources, isPending } = useResources(filters)

  useEffect(() => {
    const fromPalette = searchParams.get('search')
    if (fromPalette !== null) {
      setFilters((f) => ({ ...f, search: fromPalette }))
    }
  }, [searchParams])

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Resource library</h1>
        <p className="text-sm text-ink-secondary mt-1">
          Every rule, cost and requirement, sourced from official pages. No agency needed.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="relative flex-1 min-w-56">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <Input
            className="pl-9"
            placeholder="Search resources..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <Select
          className="w-44"
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {(categories ?? []).map((c) => (
            <option key={c.id} value={c.key}>
              {c.label}
            </option>
          ))}
        </Select>
        <Select
          className="w-40"
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
        <Button
          variant="secondary"
          size="md"
          onClick={() =>
            setFilters({ ...filters, order: filters.order === 'asc' ? 'desc' : 'asc' })
          }
          aria-label={`Order ${filters.order === 'asc' ? 'ascending' : 'descending'}`}
        >
          <ArrowDownUp size={14} />
          {filters.order === 'asc' ? 'Asc' : 'Desc'}
        </Button>
      </div>

      {isPending ? (
        <p className="text-sm text-ink-muted py-16 text-center">Loading resources...</p>
      ) : (resources ?? []).length === 0 ? (
        <p className="text-sm text-ink-muted py-16 text-center">No resources match your filters.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(resources ?? []).map((resource) => (
            <Card key={resource.id}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold leading-snug">{resource.title}</h3>
                  <Badge category={resource.categoryKey} />
                </div>
                <p className="text-sm text-ink-secondary mt-2 leading-relaxed">
                  {resource.summary}
                </p>
                <div className="flex items-center gap-3 mt-3 text-xs text-ink-muted flex-wrap">
                  {resource.costPence !== null && (
                    <span className="font-medium text-ink-secondary tabular-nums">
                      {formatGbp(resource.costPence)}
                    </span>
                  )}
                  <span>Updated {formatDate(resource.lastUpdated)}</span>
                  <a
                    href={resource.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-accent hover:underline ml-auto"
                  >
                    Official source
                    <ExternalLink size={11} />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
