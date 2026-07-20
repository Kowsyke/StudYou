import { useGSAP } from '@gsap/react'
import type { Resource } from '@studyou/types'
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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { QueryError } from '../components/QueryError'
import { Input, Select } from '../components/ui/input'
import { CardSkeleton } from '../components/ui/skeleton'
import { useCategories } from '../hooks/useMeta'
import { type ResourceFilters, useDeleteResource, useResources } from '../hooks/useResources'
import { formatDate, formatGbp } from '../lib/format'
import { DrawSVGPlugin } from '../lib/gsap/DrawSVGPlugin.js'
import { gsap } from '../lib/gsap/index.js'
import { cn } from '../lib/utils'
import { useAuthStore } from '../store/authStore'
import { useBookmarkStore } from '../store/bookmarkStore'
import { toast } from '../store/toastStore'

gsap.registerPlugin(useGSAP, DrawSVGPlugin)

const defaultFilters: ResourceFilters = { search: '', category: '', sort: 'title', order: 'asc' }

const categoryIcons: Record<string, LucideIcon> = {
  visa: Stamp,
  health: HeartPulse,
  finance: Wallet,
  housing: Home,
  documents: FileText,
  arrival: PlaneLanding,
}

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

/* ----------------- FOCUS OUTLINE SEARCH FIELD ----------------- */
function SearchField({
  value,
  onChange,
}: {
  value: string
  onChange: (val: string) => void
}) {
  const underlineRef = useRef<SVGPathElement>(null)

  const onFocus = () => {
    if (underlineRef.current) {
      gsap.to(underlineRef.current, { drawSVG: '100%', duration: 0.3, ease: 'power2.out' })
    }
  }

  const onBlur = () => {
    if (underlineRef.current) {
      gsap.to(underlineRef.current, { drawSVG: '0%', duration: 0.25, ease: 'power2.out' })
    }
  }

  return (
    <div className="relative flex-1 min-w-52 max-w-80 overflow-hidden rounded-sm">
      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-tertiary" />
      <Input
        className="pl-8 w-full"
        placeholder="Search resources..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      <svg
        className="absolute bottom-0 left-0 right-0 h-[2px] pointer-events-none"
        viewBox="0 0 100 2"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          ref={underlineRef}
          d="M0 1 L100 1"
          stroke="var(--accent)"
          strokeWidth="3"
          fill="none"
          style={{ strokeDasharray: 100, strokeDashoffset: 100 }}
        />
      </svg>
    </div>
  )
}

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
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-lg bg-surface border border-hairline shadow-sm card-lift">
        <div>
          <h1 className="text-title3 text-ink font-bold text-gradient">Resource Library</h1>
          <p className="text-xs text-ink-secondary mt-1">
            Every rule, cost, and requirement, sourced from official UK resources.
          </p>
          <div className="flex items-center gap-2 mt-4 pt-1.5 border-t border-hairline">
            <span className="text-caption text-ink-tertiary">Layout View:</span>
            <div className="flex p-0.5 bg-surface-secondary rounded-sm border border-hairline">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'text-micro font-semibold px-2.5 py-1 rounded-xs transition-all duration-200 flex items-center gap-1 cursor-pointer',
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
                  'text-micro font-semibold px-2.5 py-1 rounded-xs transition-all duration-200 flex items-center gap-1 cursor-pointer',
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
              <SearchField
                value={filters.search}
                onChange={(val) => setFilters({ ...filters, search: val })}
              />

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
                  aria-label="Sort by"
                  className="w-40 h-8 text-xs bg-surface border-hairline"
                  value={filters.sort}
                  onChange={(e) =>
                    setFilters({ ...filters, sort: e.target.value as ResourceFilters['sort'] })
                  }
                >
                  <option value="title">Sort by title</option>
                  <option value="lastUpdated">Sort by updated date</option>
                  <option value="cost">Sort by cost</option>
                </Select>
                <button
                  onClick={() =>
                    setFilters({
                      ...filters,
                      order: filters.order === 'asc' ? 'desc' : 'asc',
                    })
                  }
                  className="p-2 border border-hairline rounded-sm hover:bg-surface-secondary text-ink-secondary hover:text-ink transition-colors duration-[120ms] cursor-pointer"
                  title="Reverse sort direction"
                  aria-label="Order direction"
                >
                  <ArrowDownUp size={14} />
                </button>
              </div>
            </div>

            {/* Grid Contents */}
            {isPending ? (
              <div className={gridClass}>
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : error ? (
              <QueryError
                message={error.message || 'Failed to load resources.'}
                onRetry={() => refetch()}
                retrying={isRefetching}
              />
            ) : (resources ?? []).length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No resources found"
                body={
                  filters.search !== ''
                    ? `No official guides matched "${filters.search}". Try checking your spelling or searching simpler keywords.`
                    : 'No guides found in this category.'
                }
              />
            ) : (
              <div className={gridClass}>
                {(resources ?? []).map((r) => (
                  <ResourceCard key={r.id} resource={r} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-surface/50 border border-hairline rounded-lg shadow-sm p-4 md:p-6 relative overflow-hidden backdrop-blur-xs">
            {isPending ? (
              <div className="h-[600px] flex items-center justify-center">
                <p className="text-caption text-ink-secondary">Loading knowledge tree...</p>
              </div>
            ) : error ? (
              <QueryError
                message={error.message || 'Failed to load resources.'}
                onRetry={() => refetch()}
                retrying={isRefetching}
              />
            ) : (
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
          </div>
        )}
      </main>
    </div>
  )
}

/* ----------------- KNOWLEDGE BASE INTERACTIVE TREE CANVAS ----------------- */
interface KnowledgeTreeCanvasProps {
  resources: Resource[]
  categories: { id: string; key: string; label: string }[]
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

/* Selected Concentric Radiating Pulse Rings */
function SelectedPulseRing({ color }: { color: string }) {
  const ring1Ref = useRef<SVGCircleElement>(null)
  const ring2Ref = useRef<SVGCircleElement>(null)

  useGSAP(() => {
    if (ring1Ref.current) {
      gsap.fromTo(
        ring1Ref.current,
        { r: 8, opacity: 1, strokeWidth: 1.5 },
        { r: 26, opacity: 0, strokeWidth: 0.2, duration: 1.5, ease: 'power1.out', repeat: -1 },
      )
    }
    if (ring2Ref.current) {
      gsap.fromTo(
        ring2Ref.current,
        { r: 8, opacity: 1, strokeWidth: 1.5 },
        {
          r: 26,
          opacity: 0,
          strokeWidth: 0.2,
          duration: 1.5,
          ease: 'power1.out',
          repeat: -1,
          delay: 0.75,
        },
      )
    }
  })

  return (
    <g>
      <circle ref={ring1Ref} fill="none" stroke={color} />
      <circle ref={ring2Ref} fill="none" stroke={color} />
    </g>
  )
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
  const centerX = 500
  const centerY = 330
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

  const activeCatNode = categoryNodes.find((c) => c.key === activeCategory)

  const leafNodes = useMemo(() => {
    if (!activeCategory || !activeCatNode) return []
    const catResources = resources.filter((r) => r.categoryKey === activeCategory)
    const count = catResources.length
    const leafRadius = 105

    return catResources.map((res, idx) => {
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

  // GSAP position translation for category and leaf nodes
  useGSAP(() => {
    for (const node of shiftedCategoryNodes) {
      gsap.to(`#cat-node-${node.key}`, {
        x: node.x,
        y: node.y,
        duration: 0.5,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    }
  }, [shiftedCategoryNodes])

  useGSAP(() => {
    for (const leaf of shiftedLeafNodes) {
      gsap.to(`#leaf-node-${leaf.id}`, {
        x: leaf.x,
        y: leaf.y,
        duration: 0.5,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    }
  }, [shiftedLeafNodes])

  // Organic entrances: DrawSVG vines growth and node scale-up spiral
  useGSAP(() => {
    // 1. Draw trunk lines
    gsap.fromTo(
      '.trunk-line',
      { drawSVG: '0%' },
      { drawSVG: '100%', duration: 0.7, ease: 'power2.out', stagger: 0.04, overwrite: 'auto' },
    )

    // 2. Dash rings rotation loop
    gsap.to('.rotating-ring', {
      rotation: 360,
      transformOrigin: '50% 50%',
      duration: 20,
      ease: 'none',
      repeat: -1,
    })
  }, [categories])

  useGSAP(() => {
    if (activeCategory) {
      // Draw sub-branches outward
      gsap.fromTo(
        '.sub-branch-line',
        { drawSVG: '0%' },
        { drawSVG: '100%', duration: 0.65, ease: 'power2.out', stagger: 0.03, overwrite: 'auto' },
      )

      // Leaf nodes spiral entrance
      gsap.fromTo(
        '.tree-node-leaf',
        { scale: 0.1, opacity: 0, rotation: -90 },
        {
          scale: 1,
          opacity: 1,
          rotation: 0,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.03,
          overwrite: 'auto',
        },
      )
    }
  }, [activeCategory, leafNodes])

  // Confirms tooltip coordinates
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

  const { toggleBookmark, isBookmarked } = useBookmarkStore()
  const bookmarked = activeResource ? isBookmarked(activeResource.id) : false
  const user = useAuthStore((s) => s.user)

  return (
    <div className="relative w-full min-h-[660px] select-none flex items-center justify-center">
      {/* SVG Network Canvas */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Canvas click deselect */}
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
            <line
              key={node.id}
              className="trunk-line"
              x1={centerX}
              y1={centerY}
              x2={node.x}
              y2={node.y}
              stroke={isActive ? nodeColor : isDimmed ? 'var(--border)' : 'var(--border-strong)'}
              strokeWidth={isActive ? 2.2 : 1.2}
            />
          )
        })}

        {/* Leaf-to-Category Sub-branches */}
        {activeShiftedCatNode &&
          shiftedLeafNodes.map((leaf) => {
            const isSelected = selectedResource?.id === leaf.id
            const isHovered = hoveredResource?.id === leaf.id
            const leafColor = CATEGORY_COLORS[leaf.categoryKey] || '#00f0ff'
            const isDimmed = activeResource !== null && !isSelected && !isHovered

            return (
              <line
                key={leaf.id}
                className="sub-branch-line"
                x1={activeShiftedCatNode.x}
                y1={activeShiftedCatNode.y}
                x2={leaf.x}
                y2={leaf.y}
                stroke={isSelected || isHovered ? leafColor : 'var(--border-strong)'}
                strokeWidth={isSelected || isHovered ? 2 : 1}
                opacity={isDimmed ? 0.3 : 1}
              />
            )
          })}

        {/* Similarity Vines Bezier Curves */}
        {activeShiftedCoords &&
          vinePaths.map((endNode, idx) => {
            const startX = activeShiftedCoords.x
            const startY = activeShiftedCoords.y
            const endX = endNode.x
            const endY = endNode.y

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
                <path
                  className="similarity-vine-path"
                  d={pathD}
                  fill="none"
                  stroke={endColor}
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                  opacity={0.45}
                />
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

        {/* Center Core Trunk Node */}
        {/* biome-ignore lint/a11y/useSemanticElements: SVG group as button */}
        <g
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
              e.preventDefault()
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
          <circle
            className="core-rotating-ring rotating-ring"
            cx={centerX}
            cy={centerY}
            r="38"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.2"
            strokeDasharray="4 4"
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
            <g
              key={node.id}
              id={`cat-node-${node.key}`}
              // biome-ignore lint/a11y/useSemanticElements: SVG group as button
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
                  e.preventDefault()
                  setActiveCategory(isActive ? null : node.key)
                  setSelectedResource(null)
                }
              }}
              style={{ opacity: isDimmed ? 0.35 : 1 }}
            >
              {isActive && <SelectedPulseRing color={nodeColor} />}
              <circle
                className="rotating-ring"
                r="27"
                fill="none"
                stroke={nodeColor}
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity={0.6}
              />
              <circle r="22" fill="var(--surface)" stroke={nodeColor} strokeWidth="2" />
              <foreignObject x="-10" y="-10" width="20" height="20" className="pointer-events-none">
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ color: nodeColor }}
                >
                  {Icon ? <Icon size={13} /> : <FileText size={13} />}
                </div>
              </foreignObject>
              <text
                y="38"
                textAnchor="middle"
                fill="var(--ink)"
                className="font-bold text-[10px] uppercase tracking-wider pointer-events-none select-none"
              >
                {node.label}
              </text>
            </g>
          )
        })}

        {/* Leaf Resource Nodes */}
        {shiftedLeafNodes.map((leaf) => {
          const isSelected = selectedResource?.id === leaf.id
          const isHovered = hoveredResource?.id === leaf.id
          const leafColor = CATEGORY_COLORS[leaf.categoryKey] || 'var(--accent)'
          const isDimmed = activeResource !== null && !isSelected && !isHovered

          return (
            <g
              key={leaf.id}
              id={`leaf-node-${leaf.id}`}
              // biome-ignore lint/a11y/useSemanticElements: SVG group as button
              role="button"
              tabIndex={0}
              className="tree-node-leaf cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              onMouseEnter={() => setHoveredResource(leaf)}
              onMouseLeave={() => setHoveredResource(null)}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedResource(leaf)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelectedResource(leaf)
                }
              }}
              style={{ opacity: isDimmed ? 0.35 : 1 }}
            >
              {(isSelected || isHovered) && (
                <>
                  <circle
                    className="rotating-ring"
                    r="13"
                    fill="none"
                    stroke={leafColor}
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <SelectedPulseRing color={leafColor} />
                </>
              )}
              <circle
                r="8"
                fill="var(--surface)"
                stroke={leafColor}
                strokeWidth="1.5"
                className="transition-colors duration-150"
              />
              <circle r="4" fill={leafColor} className="transition-colors duration-150" />
            </g>
          )
        })}

        {/* Floating details tooltip card */}
        {activeResource && activeLeaf && (
          <foreignObject
            x={tooltipX}
            y={tooltipY}
            width={tooltipWidth}
            height={tooltipHeight}
            className="overflow-visible pointer-events-none z-50"
          >
            <div
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
                        ? 'font-bold text-positive'
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
            </div>
          </foreignObject>
        )}
      </svg>
    </div>
  )
}

/* ----------------- CLASSIC GRID CARD AND PILL ----------------- */
function ResourceCard({ resource }: { resource: Resource }) {
  const { toggleBookmark, isBookmarked } = useBookmarkStore()
  const bookmarked = isBookmarked(resource.id)
  const user = useAuthStore((s) => s.user)
  const deleteResource = useDeleteResource()

  return (
    <article className="aurora-card relative rounded-md shadow-sm p-4 flex flex-col gap-3 group card-lift">
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
            resource.costPence !== null ? 'text-positive' : 'text-ink-tertiary',
          )}
        >
          {resource.costPence !== null ? formatGbp(resource.costPence) : 'No fee'}
        </span>
        <div className="flex items-center gap-3">
          {user?.role === 'admin' && (
            <>
              <Link
                to={'/admin/kb?id={resource.id}'}
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
        'text-xs font-medium px-3 py-1.5 rounded-full border transition-colors duration-[120ms] cursor-pointer',
        active
          ? 'bg-accent-solid border-transparent text-white shadow-sm [background-image:var(--accent-gradient)]'
          : 'bg-surface border-hairline-strong text-ink-secondary hover:bg-surface-secondary hover:text-ink',
      )}
    >
      {label}
    </button>
  )
}
