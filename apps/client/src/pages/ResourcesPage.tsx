import type { Resource } from '@studyou/types'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowDownUp,
  Bookmark,
  ExternalLink,
  FileText,
  Grid,
  HeartPulse,
  Home,
  type LucideIcon,
  Network,
  PlaneLanding,
  Search,
  SearchX,
  Stamp,
  Wallet,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { QueryError } from '../components/QueryError'
import { Button } from '../components/ui/button'
import { Input, Select } from '../components/ui/input'
import { CardSkeleton } from '../components/ui/skeleton'
import { useCategories } from '../hooks/useMeta'
import { type ResourceFilters, useDeleteResource, useResources } from '../hooks/useResources'
import { formatDate, formatGbp } from '../lib/format'
import { cn } from '../lib/utils'
import { useAuthStore } from '../store/authStore'
import { useBookmarkStore } from '../store/bookmarkStore'
import { toast } from '../store/toastStore'

const defaultFilters: ResourceFilters = { search: '', category: '', sort: 'title', order: 'asc' }

const categoryIcons: Record<string, LucideIcon> = {
  visa: Stamp,
  health: HeartPulse,
  finance: Wallet,
  housing: Home,
  documents: FileText,
  arrival: PlaneLanding,
}

// Common keywords to detect similarity/vine connections
const CORE_KEYWORDS = [
  'visa',
  'fee',
  'health',
  'insurance',
  'account',
  'bank',
  'funds',
  'housing',
  'rent',
  'deposit',
  'tb',
  'test',
  'passport',
  'arrival',
  'flight',
  'ticket',
  'document',
  'charge',
  'cost',
]

export function ResourcesPage() {
  const [searchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState<'grid' | 'tree'>('grid')
  const [filters, setFilters] = useState<ResourceFilters>({
    ...defaultFilters,
    search: searchParams.get('search') ?? '',
  })
  const { data: categories } = useCategories()
  const { data: resources, isPending, error, refetch, isRefetching } = useResources(filters)

  // Interactive Tree States
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [hoveredResource, setHoveredResource] = useState<Resource | null>(null)
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)

  useEffect(() => {
    const fromPalette = searchParams.get('search')
    if (fromPalette !== null) {
      setFilters((f) => ({ ...f, search: fromPalette }))
    }

    const categoryParam = searchParams.get('category')
    const resourceIdParam = searchParams.get('resourceId')

    if (categoryParam) {
      setActiveCategory(categoryParam)
      setViewMode('tree')
    }

    if (resources && resourceIdParam) {
      const match = resources.find((r) => r.id === resourceIdParam)
      if (match) {
        setSelectedResource(match)
        setActiveCategory(match.categoryKey)
        setViewMode('tree')
      }
    }
  }, [searchParams, resources])

  const gridClass = 'grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4'

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-lg bg-surface border border-hairline shadow-sm">
        <div>
          <h1 className="text-title3 text-ink">Resource Library</h1>
          <p className="text-xs text-ink-secondary mt-1">
            Every rule, cost, and requirement, sourced from official pages. No agency needed.
          </p>
          <div className="flex items-center gap-2 mt-4 pt-1.5 border-t border-hairline">
            <span className="text-caption text-ink-tertiary">Layout View:</span>
            <div className="flex p-0.5 bg-surface-secondary rounded-sm border border-hairline">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'text-micro font-semibold px-2.5 py-1 rounded-xs transition-all duration-200 flex items-center gap-1',
                  viewMode === 'grid'
                    ? 'bg-surface text-ink shadow-xs'
                    : 'text-ink-secondary hover:text-ink',
                )}
              >
                <Grid size={11} />
                Classic Grid
              </button>
              <button
                onClick={() => setViewMode('tree')}
                className={cn(
                  'text-micro font-semibold px-2.5 py-1 rounded-xs transition-all duration-200 flex items-center gap-1',
                  viewMode === 'tree'
                    ? 'bg-surface text-ink shadow-xs'
                    : 'text-ink-secondary hover:text-ink',
                )}
              >
                <Network size={11} />
                Knowledge Tree
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="min-h-[500px]">
        {viewMode === 'grid' ? (
          <div className="space-y-5">
            {/* Grid Filters */}
            <div className="flex flex-wrap items-center gap-3">
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
            ) : filters.search === '' &&
              filters.category === '' &&
              filters.sort === 'title' &&
              filters.order === 'asc' ? (
              <div className="flex flex-col gap-7">
                {(categories ?? []).map((c) => {
                  const group = (resources ?? []).filter((r) => r.categoryKey === c.key)
                  if (group.length === 0) return null
                  const Icon = categoryIcons[c.key] ?? FileText
                  return (
                    <section key={c.id} aria-label={c.label}>
                      <div className="flex items-center gap-2.5 mb-3">
                        <span className="h-7 w-7 rounded-sm bg-accent-soft text-accent flex items-center justify-center">
                          <Icon size={14} />
                        </span>
                        <h2 className="text-body font-semibold text-ink">{c.label}</h2>
                        <span className="text-caption text-ink-tertiary tabular-nums">
                          {group.length} {group.length === 1 ? 'entry' : 'entries'}
                        </span>
                        <span className="flex-1 border-t border-hairline" />
                      </div>
                      <div className={gridClass}>
                        {group.map((resource) => (
                          <ResourceCard key={resource.id} resource={resource} />
                        ))}
                      </div>
                    </section>
                  )
                })}
              </div>
            ) : (
              <div className={gridClass}>
                {(resources ?? []).map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Cyberpunk Knowledge Tree view */
          <KnowledgeTreeCanvas
            resources={resources ?? []}
            categories={categories ?? []}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            hoveredResource={hoveredResource}
            setHoveredResource={setHoveredResource}
            selectedResource={selectedResource}
            setSelectedResource={setSelectedResource}
          />
        )}
      </main>
    </div>
  )
}

/* ----------------- KNOWLEDGE TREE SVG CANVAS ----------------- */
interface KnowledgeTreeCanvasProps {
  resources: Resource[]
  categories: Array<{ id: string; key: string; label: string }>
  activeCategory: string | null
  setActiveCategory: (cat: string | null) => void
  hoveredResource: Resource | null
  setHoveredResource: (res: Resource | null) => void
  selectedResource: Resource | null
  setSelectedResource: (res: Resource | null) => void
}

const CATEGORY_COLORS: Record<string, string> = {
  visa: '#ec4899', // Pink
  health: '#10b981', // Emerald
  finance: '#f59e0b', // Amber
  housing: '#f97316', // Orange
  documents: '#3b82f6', // Blue
  arrival: '#8b5cf6', // Violet
}

function KnowledgeTreeCanvas({
  resources,
  categories,
  activeCategory,
  setActiveCategory,
  hoveredResource,
  setHoveredResource,
  selectedResource,
  setSelectedResource,
}: KnowledgeTreeCanvasProps) {
  const deleteResource = useDeleteResource()
  // Center coordinates of expanded canvas
  const centerX = 500
  const centerY = 330

  // Category coordinates (radial circle around center)
  const categoryRadius = 210
  const categoryNodes = useMemo(() => {
    return categories.map((cat, idx) => {
      const angle = (idx * 2 * Math.PI) / categories.length
      return {
        ...cat,
        x: centerX + categoryRadius * Math.cos(angle),
        y: centerY + categoryRadius * Math.sin(angle),
        angle,
      }
    })
  }, [categories])

  // Get active category node coordinate
  const activeCatNode = categoryNodes.find((c) => c.key === activeCategory)

  // Filter resources of active category and assign coordinates
  const leafNodes = useMemo(() => {
    if (!activeCategory || !activeCatNode) return []
    const catResources = resources.filter((r) => r.categoryKey === activeCategory)
    const count = catResources.length
    const leafRadius = 105

    return catResources.map((res, idx) => {
      // Spread nodes in an outer orbital arc facing outwards from the center core
      const angleOffset = -Math.PI / 3 + (idx * 2 * Math.PI) / (3 * Math.max(1, count - 1))
      const leafAngle = activeCatNode.angle + (count === 1 ? 0 : angleOffset)
      const dynamicRadius = leafRadius + (idx % 3) * 45
      return {
        ...res,
        x: activeCatNode.x + dynamicRadius * Math.cos(leafAngle),
        y: activeCatNode.y + dynamicRadius * Math.sin(leafAngle),
      }
    })
  }, [activeCategory, activeCatNode, resources])

  const activeResource = hoveredResource ?? selectedResource

  // Calculate shifted coordinates for organic "push away" bubble effects
  const activeLeaf = leafNodes.find((l) => l.id === activeResource?.id)
  const activeCoords = activeLeaf ? { x: activeLeaf.x, y: activeLeaf.y } : null

  const getShiftedCoords = useCallback(
    (x: number, y: number, isCore = false) => {
      if (!activeCoords || isCore) return { x, y }
      const dx = x - activeCoords.x
      const dy = y - activeCoords.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist === 0 || dist > 260) return { x, y }

      const pushForce = Math.max(0, 260 - dist) * 0.32
      return {
        x: x + (dx / dist) * pushForce,
        y: y + (dy / dist) * pushForce,
      }
    },
    [activeCoords],
  )

  const shiftedCategoryNodes = useMemo(() => {
    return categoryNodes.map((node) => {
      const shifted = getShiftedCoords(node.x, node.y)
      return { ...node, x: shifted.x, y: shifted.y }
    })
  }, [categoryNodes, getShiftedCoords])

  const shiftedLeafNodes = useMemo(() => {
    return leafNodes.map((leaf) => {
      const shifted = getShiftedCoords(leaf.x, leaf.y)
      return { ...leaf, x: shifted.x, y: shifted.y }
    })
  }, [leafNodes, getShiftedCoords])

  const activeShiftedCatNode = shiftedCategoryNodes.find((c) => c.key === activeCategory)
  const activeShiftedLeaf = shiftedLeafNodes.find((l) => l.id === activeResource?.id)
  const activeShiftedCoords = activeShiftedLeaf
    ? { x: activeShiftedLeaf.x, y: activeShiftedLeaf.y }
    : null

  // Get vines originating from hovered or selected resource node
  const vinePaths = useMemo(() => {
    if (!activeResource) return []

    const getLinkedResources = (res: Resource) => {
      const titleWords = res.title
        .toLowerCase()
        .split(/\W+/)
        .filter((w) => w.length > 3)
      const summaryWords = res.summary
        .toLowerCase()
        .split(/\W+/)
        .filter((w) => w.length > 3)
      const resKeywords = [...titleWords, ...summaryWords].filter((w) => CORE_KEYWORDS.includes(w))

      if (resKeywords.length === 0) return []

      return resources.filter((other) => {
        if (other.id === res.id) return false
        const otherVisible =
          other.categoryKey === activeCategory ||
          categoryNodes.some((c) => c.key === other.categoryKey)

        if (!otherVisible) return false

        const otherWords = `${other.title} ${other.summary}`.toLowerCase().split(/\W+/)
        return resKeywords.some((kw) => otherWords.includes(kw))
      })
    }

    const linked = getLinkedResources(activeResource)

    return linked.map((other) => {
      const shiftedLeaf = shiftedLeafNodes.find((l) => l.id === other.id)
      if (shiftedLeaf) {
        return {
          x: shiftedLeaf.x,
          y: shiftedLeaf.y,
          title: other.title,
          categoryKey: other.categoryKey,
          id: other.id,
        }
      }
      const parentCat = shiftedCategoryNodes.find((c) => c.key === other.categoryKey)
      return {
        x: parentCat ? parentCat.x : centerX,
        y: parentCat ? parentCat.y : centerY,
        title: other.title,
        categoryKey: other.categoryKey,
        id: other.id,
      }
    })
  }, [
    activeResource,
    shiftedLeafNodes,
    shiftedCategoryNodes,
    resources,
    activeCategory,
    categoryNodes,
  ])

  // Tooltip details positioning
  const tooltipWidth = 260
  const tooltipHeight = 220
  const tooltipX = useMemo(() => {
    if (!activeShiftedCoords) return 0
    return activeShiftedCoords.x + tooltipWidth + 30 > 1000
      ? activeShiftedCoords.x - tooltipWidth - 30
      : activeShiftedCoords.x + 30
  }, [activeShiftedCoords])

  const tooltipY = useMemo(() => {
    if (!activeShiftedCoords) return 0
    return Math.max(
      10,
      Math.min(660 - tooltipHeight - 10, activeShiftedCoords.y - tooltipHeight / 2),
    )
  }, [activeShiftedCoords])

  const swift = [0.16, 1, 0.3, 1] as const

  const { toggleBookmark, isBookmarked } = useBookmarkStore()
  const bookmarked = activeResource ? isBookmarked(activeResource.id) : false
  const user = useAuthStore((s) => s.user)

  return (
    <div className="relative w-full min-h-[660px] select-none flex items-center justify-center">
      {/* SVG Network Canvas */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: background click dismiss is secondary behavior */}
      <svg
        viewBox="0 0 1000 660"
        className="w-full h-auto max-h-[700px] relative z-10 overflow-visible"
        onClick={() => setSelectedResource(null)}
      >
        <title>Knowledge base tree map</title>

        {/* Category-to-Core Trunk Lines */}
        {shiftedCategoryNodes.map((node) => {
          const isActive = activeCategory === node.key
          const isDimmed = activeCategory !== null && !isActive
          const nodeColor = CATEGORY_COLORS[node.key] || 'var(--accent)'

          return (
            <g key={node.id}>
              {/* Core Branch connecting line */}
              <motion.line
                animate={{
                  x1: centerX,
                  y1: centerY,
                  x2: node.x,
                  y2: node.y,
                  stroke: isActive
                    ? nodeColor
                    : isDimmed
                      ? 'var(--border)'
                      : 'var(--border-strong)',
                  strokeWidth: isActive ? 2.5 : 1.2,
                }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              />
            </g>
          )
        })}

        {/* 8. Leaf-to-Category Sub-branches */}
        {activeShiftedCatNode &&
          shiftedLeafNodes.map((leaf) => {
            const isSelected = selectedResource?.id === leaf.id
            const isHovered = hoveredResource?.id === leaf.id
            const leafColor = CATEGORY_COLORS[leaf.categoryKey] || '#00f0ff'
            const isDimmed = activeResource !== null && !isSelected && !isHovered

            return (
              <g key={leaf.id}>
                <motion.line
                  animate={{
                    x1: activeShiftedCatNode.x,
                    y1: activeShiftedCatNode.y,
                    x2: leaf.x,
                    y2: leaf.y,
                    stroke: isSelected || isHovered ? leafColor : 'var(--border-strong)',
                    strokeWidth: isSelected || isHovered ? 2 : 1,
                    opacity: isDimmed ? 0.3 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                />
              </g>
            )
          })}

        {/* Similarity Vines Bezier Curves */}
        {activeShiftedCoords &&
          vinePaths.map((endNode, idx) => {
            const startX = activeShiftedCoords.x
            const startY = activeShiftedCoords.y
            const endX = endNode.x
            const endY = endNode.y

            // Push control point away from active coordinates to bend vines
            const baseControlX = (startX + endX) / 2
            const baseControlY = (startY + endY) / 2 - 30

            let controlX = baseControlX
            let controlY = baseControlY

            const vdx = baseControlX - activeShiftedCoords.x
            const vdy = baseControlY - activeShiftedCoords.y
            const vdist = Math.sqrt(vdx * vdx + vdy * vdy)
            if (vdist > 0 && vdist < 300) {
              const force = Math.max(0, 300 - vdist) * 0.45
              controlX += (vdx / vdist) * force
              controlY += (vdy / vdist) * force
            }

            const pathD = `M ${startX} ${startY} Q ${controlX} ${controlY}, ${endX} ${endY}`
            const endColor = CATEGORY_COLORS[endNode.categoryKey] || 'var(--accent)'

            return (
              <g key={`${idx}-${endNode.title}`}>
                {/* Visual thin line curve */}
                <motion.path
                  animate={{ d: pathD }}
                  fill="none"
                  stroke={endColor}
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                  opacity={0.45}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                />
                {/* Flowing current dot on vine */}
                <motion.circle
                  r="2"
                  fill={endColor}
                  opacity={0.5}
                  initial={{ offsetDistance: '0%' }}
                  animate={{ offsetDistance: '100%' }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 3,
                    ease: 'linear',
                  }}
                />
                {/* Thick invisible path to capture vine hovering easily */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="16"
                  className="cursor-pointer"
                  onMouseEnter={() => {
                    const leaf = leafNodes.find((l) => l.id === endNode.id)
                    if (leaf) setHoveredResource(leaf)
                  }}
                  onMouseLeave={() => setHoveredResource(null)}
                />
              </g>
            )
          })}

        {/* 10. Center Core Trunk Node */}
        <g
          // biome-ignore lint/a11y/useSemanticElements: SVG group element
          // biome-ignore lint/a11y/useKeyWithClickEvents: handled manually
          role="button"
          tabIndex={0}
          className="cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          onClick={(e) => {
            e.stopPropagation()
            setActiveCategory(null)
            setSelectedResource(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setActiveCategory(null)
              setSelectedResource(null)
            }
          }}
        >
          <circle
            cx={centerX}
            cy={centerY}
            r="32"
            fill="var(--surface)"
            stroke="var(--border-strong)"
            strokeWidth="2"
          />
          {/* Rotating dashed ring */}
          <motion.circle
            cx={centerX}
            cy={centerY}
            r="38"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            animate={{ rotate: 360 }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 20, ease: 'linear' }}
          />
          <text
            x={centerX}
            y={centerY + 4}
            textAnchor="middle"
            fill="var(--ink)"
            className="font-semibold text-[10px] select-none pointer-events-none"
          >
            CORE
          </text>
        </g>

        {/* Category Nodes */}
        {shiftedCategoryNodes.map((node) => {
          const isActive = activeCategory === node.key
          const isDimmed = activeCategory !== null && !isActive
          const nodeColor = CATEGORY_COLORS[node.key] || 'var(--accent)'
          const Icon = categoryIcons[node.key]

          return (
            <motion.g
              key={node.id}
              animate={{ x: node.x, y: node.y }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              // biome-ignore lint/a11y/useSemanticElements: SVG group element
              role="button"
              tabIndex={0}
              className="cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              onClick={(e) => {
                e.stopPropagation()
                setActiveCategory(isActive ? null : node.key)
                setSelectedResource(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setActiveCategory(isActive ? null : node.key)
                  setSelectedResource(null)
                }
              }}
              style={{ opacity: isDimmed ? 0.35 : 1 }}
            >
              {/* Dash rotating outer ring */}
              <motion.circle
                r="27"
                fill="none"
                stroke={nodeColor}
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity={0.6}
                animate={{ rotate: 360 }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 16, ease: 'linear' }}
              />
              {/* Clean circle */}
              <circle r="22" fill="var(--surface)" stroke={nodeColor} strokeWidth="2" />
              {/* Icon in center */}
              <foreignObject x="-10" y="-10" width="20" height="20" className="pointer-events-none">
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ color: nodeColor }}
                >
                  {Icon ? <Icon size={13} /> : <FileText size={13} />}
                </div>
              </foreignObject>
              {/* Label */}
              <text
                y="38"
                textAnchor="middle"
                fill="var(--ink)"
                className="font-bold text-[10px] uppercase tracking-wider pointer-events-none select-none"
              >
                {node.label}
              </text>
            </motion.g>
          )
        })}

        {/* Leaf Resource Nodes */}
        {shiftedLeafNodes.map((leaf) => {
          const isSelected = selectedResource?.id === leaf.id
          const isHovered = hoveredResource?.id === leaf.id
          const leafColor = CATEGORY_COLORS[leaf.categoryKey] || 'var(--accent)'
          const isDimmed = activeResource !== null && !isSelected && !isHovered

          return (
            <motion.g
              key={leaf.id}
              animate={{ x: leaf.x, y: leaf.y }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              // biome-ignore lint/a11y/useSemanticElements: SVG group element
              role="button"
              tabIndex={0}
              className="cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              onMouseEnter={() => setHoveredResource(leaf)}
              onMouseLeave={() => setHoveredResource(null)}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedResource(leaf)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedResource(leaf)
                }
              }}
              style={{ opacity: isDimmed ? 0.35 : 1 }}
            >
              {/* Outer halo on hover / select */}
              {(isSelected || isHovered) && (
                <motion.circle
                  r="13"
                  fill="none"
                  stroke={leafColor}
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 10, ease: 'linear' }}
                />
              )}
              {/* Outer ring */}
              <circle
                r="8"
                fill="var(--surface)"
                stroke={leafColor}
                strokeWidth="1.5"
                className="transition-colors duration-150"
              />
              {/* Inner core dot */}
              <circle r="4" fill={leafColor} className="transition-colors duration-150" />
            </motion.g>
          )
        })}

        {/* Floating details tooltip card */}
        <AnimatePresence>
          {activeResource && activeLeaf && (
            <foreignObject
              x={tooltipX}
              y={tooltipY}
              width={tooltipWidth}
              height={tooltipHeight}
              className="overflow-visible pointer-events-none z-50"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: swift }}
                className="bg-surface/95 backdrop-blur-md border border-hairline-strong rounded-md p-4 shadow-overlay text-left pointer-events-auto w-[260px]"
                onMouseEnter={() => {
                  if (hoveredResource === null) setHoveredResource(activeLeaf)
                }}
                onMouseLeave={() => {
                  setHoveredResource(null)
                }}
              >
                <div className="flex justify-between items-center text-[10px] text-ink-secondary border-b border-hairline pb-2 mb-2">
                  <span className="font-semibold uppercase tracking-wider">Details</span>
                  <div className="flex items-center gap-1.5">
                    <span className="capitalize px-1.5 py-0.5 rounded-full bg-surface-secondary border border-hairline text-ink-secondary font-medium">
                      {activeResource.categoryKey}
                    </span>
                    <button
                      onClick={() => toggleBookmark(activeResource.id)}
                      className={cn(
                        'p-1 rounded-full border border-hairline transition-all duration-[120ms] cursor-pointer',
                        bookmarked
                          ? 'bg-accent-soft text-accent border-accent/20'
                          : 'bg-surface text-ink-tertiary hover:text-ink hover:bg-surface-secondary',
                      )}
                      title={bookmarked ? 'Remove Bookmark' : 'Bookmark Resource'}
                    >
                      <Bookmark size={10} fill={bookmarked ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>

                <h3 className="text-xs font-bold text-ink leading-snug">{activeResource.title}</h3>
                <p className="text-[9px] text-ink-tertiary mt-0.5 uppercase tracking-wider font-semibold">
                  Updated: {formatDate(activeResource.lastUpdated)}
                </p>

                <p className="mt-2 text-xs text-ink-secondary leading-relaxed max-h-24 overflow-y-auto pr-1">
                  {activeResource.summary}
                </p>

                <div className="mt-3 pt-2 border-t border-hairline space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-ink-tertiary">Cost:</span>
                    <span
                      className={cn(
                        activeResource.costPence !== null
                          ? 'font-bold text-emerald-600 dark:text-emerald-400'
                          : 'font-semibold text-ink-tertiary',
                      )}
                    >
                      {activeResource.costPence !== null
                        ? formatGbp(activeResource.costPence)
                        : 'No fee'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-ink-tertiary">Deadline:</span>
                    <span className="font-bold text-ink-secondary">
                      {activeResource.deadlineDaysBeforeIntake !== null
                        ? `${activeResource.deadlineDaysBeforeIntake} Days`
                        : 'Flexible'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-3.5">
                  <a
                    href={activeResource.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 h-8 rounded-sm bg-accent-solid hover:bg-accent-solid-hover text-white flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors duration-150"
                  >
                    Confirm Source
                    <ExternalLink size={11} />
                  </a>
                  {user?.role === 'admin' && (
                    <>
                      <Link
                        to={`/admin/kb?id=${activeResource.id}`}
                        className="px-2.5 h-8 rounded-sm bg-surface border border-hairline-strong hover:bg-surface-secondary text-ink flex items-center justify-center text-xs font-semibold transition-colors duration-150 shrink-0"
                        title="Edit in admin console"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={async () => {
                          if (
                            window.confirm(
                              `Are you sure you want to delete "${activeResource.title}"?`,
                            )
                          ) {
                            try {
                              await deleteResource.mutateAsync(activeResource.id)
                              toast.success('Resource deleted.')
                              setSelectedResource(null)
                              setHoveredResource(null)
                            } catch (err) {
                              toast.error('Failed to delete.')
                            }
                          }
                        }}
                        disabled={deleteResource.isPending}
                        className="px-2.5 h-8 rounded-sm bg-danger-soft hover:bg-danger text-danger hover:text-white flex items-center justify-center text-xs font-semibold transition-all duration-150 shrink-0 disabled:opacity-50"
                        title="Delete resource"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </foreignObject>
          )}
        </AnimatePresence>
      </svg>
    </div>
  )
}

/* ----------------- SUB-COMPONENTS ----------------- */
function ResourceCard({ resource }: { resource: Resource }) {
  const { toggleBookmark, isBookmarked } = useBookmarkStore()
  const bookmarked = isBookmarked(resource.id)
  const user = useAuthStore((s) => s.user)
  const deleteResource = useDeleteResource()

  return (
    <article className="aurora-card relative rounded-md shadow-sm p-4 flex flex-col gap-3 group">
      <div className="flex justify-between items-center text-caption text-ink-tertiary pr-6">
        <span className="capitalize">{resource.categoryKey}</span>
        <span>Updated {formatDate(resource.lastUpdated)}</span>
      </div>
      <button
        onClick={() => toggleBookmark(resource.id)}
        className={cn(
          'absolute top-3.5 right-3.5 p-1 rounded-full border border-hairline transition-all duration-[120ms] z-10 cursor-pointer',
          bookmarked
            ? 'bg-accent-soft text-accent border-accent/20'
            : 'bg-surface text-ink-tertiary hover:text-ink hover:bg-surface-secondary',
        )}
        title={bookmarked ? 'Remove Bookmark' : 'Bookmark Resource'}
      >
        <Bookmark size={12} fill={bookmarked ? 'currentColor' : 'none'} />
      </button>
      <h3 className="text-sm font-semibold text-ink leading-normal">{resource.title}</h3>
      <p className="text-xs text-ink-secondary leading-relaxed grow">{resource.summary}</p>
      <div className="flex items-center justify-between border-t border-hairline pt-2.5 text-xs">
        <span
          className={cn(
            'font-bold tabular-nums',
            resource.costPence !== null
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-ink-tertiary',
          )}
        >
          {resource.costPence !== null ? formatGbp(resource.costPence) : 'No fee'}
        </span>
        <div className="flex items-center gap-3">
          {user?.role === 'admin' && (
            <>
              <Link
                to={`/admin/kb?id=${resource.id}`}
                className="inline-flex items-center gap-1 text-accent font-semibold hover:underline rounded-xs"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm(`Are you sure you want to delete "${resource.title}"?`)) {
                    try {
                      await deleteResource.mutateAsync(resource.id)
                      toast.success('Resource deleted.')
                    } catch (err) {
                      toast.error('Failed to delete.')
                    }
                  }
                }}
                disabled={deleteResource.isPending}
                className="inline-flex items-center gap-1 text-danger font-semibold hover:underline rounded-xs disabled:opacity-50"
              >
                Delete
              </button>
            </>
          )}
          <a
            href={resource.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-ink-secondary hover:underline rounded-xs"
          >
            Official source
            <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </article>
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
