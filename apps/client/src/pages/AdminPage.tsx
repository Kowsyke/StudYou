import type { CategoryKey, Resource } from '@studyou/types'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Download,
  ExternalLink,
  Filter,
  Moon,
  Pencil,
  Plus,
  Printer,
  Search,
  Sun,
  Trash2,
} from 'lucide-react'
import React, { type FormEvent, useMemo, useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ReportsPanel, UsersPanel } from '../components/AdminControl'
import { InfrastructurePanel } from '../components/AdminInfra'
import { QueryError } from '../components/QueryError'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardKicker,
  CardTitle,
} from '../components/ui/card'
import { Input, Label, Select, Textarea } from '../components/ui/input'
import { CardSkeleton } from '../components/ui/skeleton'
import { useChartTokens } from '../hooks/useChartTokens'
import { useAnalytics, useCategories } from '../hooks/useMeta'
import { useDeleteResource, useResources, useSaveResource } from '../hooks/useResources'
import { apiErrorMessage } from '../lib/api'
import { formatGbp } from '../lib/format'
import { cn } from '../lib/utils'
import { ACCENT_PRESETS, useThemeStore } from '../store/themeStore'
import { toast } from '../store/toastStore'

export function AdminPage() {
  const { data: analytics, isPending, error, refetch, isRefetching } = useAnalytics(true)
  const chart = useChartTokens()
  const { tab } = useParams<{ tab?: string }>()
  const activeTab = (tab ?? 'insights') as
    | 'insights'
    | 'kb'
    | 'users'
    | 'reports'
    | 'settings'
    | 'notes'
  const { theme, setTheme, accentPreset, setAccentPreset } = useThemeStore()

  // For exporting Knowledge Base resources
  const { data: resources } = useResources({
    search: '',
    category: '',
    sort: 'title',
    order: 'asc',
  })

  const handleDownloadAnalyticsCSV = () => {
    if (!analytics) return
    let csvContent = 'data:text/csv;charset=utf-8,'
    csvContent += 'Metric,Value\n'
    csvContent += `Total Students,${analytics.totalStudents}\n`
    csvContent += `Active Journeys,${analytics.totalJourneys}\n`
    csvContent += `Average Completion %,${analytics.averageCompletion}\n\n`
    csvContent += 'Stage Title,Total Tasks,Completed Tasks,Completion Rate\n'
    for (const stage of analytics.stageBreakdown) {
      csvContent += `"${stage.stageTitle}",${stage.totalTasks},${stage.completedTasks},${stage.completionRate}%\n`
    }
    csvContent += '\nDrop-Off Analytics\n'
    csvContent += 'Stage Title,Students Reached\n'
    for (const d of analytics.dropOff) {
      csvContent += `"${d.stageTitle}",${d.studentsReached}\n`
    }
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'studyou_analytics_report.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Analytics CSV downloaded.')
  }

  const handleDownloadResourcesCSV = () => {
    if (!resources) return
    let csvContent = 'data:text/csv;charset=utf-8,'
    csvContent += 'ID,Title,Category,Cost (Pence),Deadline (Days),Source URL\n'
    for (const r of resources) {
      csvContent += `"${r.id}","${r.title.replace(/"/g, '""')}","${r.categoryKey}",${r.costPence ?? 0},${r.deadlineDaysBeforeIntake ?? 0},"${r.sourceUrl}"\n`
    }
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'studyou_resources_export.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Knowledge Base CSV exported.')
  }

  const tooltipStyle = {
    borderRadius: 12,
    border: `1px solid ${chart.border}`,
    boxShadow: 'var(--elevation-lg)',
    fontSize: 12,
    background: chart.surface,
    color: chart.ink,
  }

  return (
    <div>
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-title3 text-ink">
            {activeTab === 'insights' && 'Admin Insights'}
            {activeTab === 'kb' && 'Knowledge Base Manager'}
            {activeTab === 'users' && 'User Administration'}
            {activeTab === 'reports' && 'Bug Triage Console'}
            {activeTab === 'notes' && 'Admin Workspace Notes'}
            {activeTab === 'settings' && 'Visual Settings & Exports'}
          </h1>
          <p className="text-xs text-ink-secondary mt-1">
            {activeTab === 'insights' && 'Platform analytics, server load, and live user metrics.'}
            {activeTab === 'kb' &&
              'Add, edit, or delete official guidelines, fees, and checklist milestones.'}
            {activeTab === 'users' &&
              'Reinstate or suspend student profiles, inspect progress, and manage roles.'}
            {activeTab === 'reports' &&
              'Review bugs, wrong data warnings, and system feedback reports.'}
            {activeTab === 'notes' &&
              'Leave messages, flags, and collaborative notes for other administrators.'}
            {activeTab === 'settings' &&
              'Configure interface theme settings and download platform reports.'}
          </p>
        </div>
      </header>

      {(activeTab === 'insights' || window.location.search.includes('print')) &&
        (isPending ? (
          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <CardSkeleton lines={1} />
              <CardSkeleton lines={1} />
              <CardSkeleton lines={1} />
              <CardSkeleton lines={1} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CardSkeleton lines={6} />
              <CardSkeleton lines={6} />
            </div>
          </div>
        ) : error || !analytics ? (
          <QueryError
            message="Analytics could not be loaded. Check your connection and try again."
            onRetry={() => refetch()}
            retrying={isRefetching}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="relative overflow-hidden bg-surface border border-hairline rounded-md p-4 flex flex-col justify-between shadow-xs min-h-[82px]">
                <p className="text-caption font-semibold uppercase tracking-[0.05em] text-ink-secondary">
                  Active now
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="relative flex h-2.5 w-2.5">
                    {analytics.activeUsers > 0 && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-positive opacity-75" />
                    )}
                    <span
                      className={cn(
                        'relative inline-flex rounded-full h-2.5 w-2.5',
                        analytics.activeUsers > 0 ? 'bg-positive' : 'bg-ink-tertiary',
                      )}
                    />
                  </span>
                  <p className="text-[22px] leading-none font-bold text-ink tabular-nums">
                    {analytics.activeUsers}
                  </p>
                </div>
                <p className="text-micro text-ink-tertiary mt-1">Seen in the last 5 minutes</p>
              </div>
              <StatTile label="Total users" value={analytics.totalUsers} />
              <StatTile label="New this week" value={analytics.newThisWeek} />
              <StatTile label="Suspended" value={analytics.suspendedUsers} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
              <StatTile label="Students" value={analytics.totalStudents} />
              <StatTile label="Active journeys" value={analytics.totalJourneys} />
              <StatTile label="Average completion" value={`${analytics.averageCompletion}%`} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <Card className="print:break-inside-avoid">
                <CardHeader>
                  <CardKicker>Completion rate by stage</CardKicker>
                  <CardDescription>Share of tasks completed in each stage</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={analytics.stageBreakdown}
                      margin={{ top: 4, right: 4, left: -18, bottom: 20 }}
                    >
                      <CartesianGrid stroke={chart.grid} strokeWidth={1} vertical={false} />
                      <XAxis
                        dataKey="stageTitle"
                        tick={{ fill: chart.ink, fontSize: 11 }}
                        axisLine={{ stroke: chart.grid }}
                        tickLine={false}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                        height={40}
                      />
                      <YAxis
                        unit="%"
                        domain={[0, 100]}
                        tick={{ fill: chart.ink, fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: 'var(--accent-soft)' }}
                        contentStyle={tooltipStyle}
                        formatter={(value) => [`${value}%`, 'Completion']}
                      />
                      <Bar
                        dataKey="completionRate"
                        fill={chart.accent}
                        radius={[4, 4, 0, 0]}
                        barSize={28}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="print:break-inside-avoid">
                <CardHeader>
                  <CardKicker>Drop off by stage</CardKicker>
                  <CardDescription>Journeys with at least one task done per stage</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={analytics.dropOff}
                      margin={{ top: 4, right: 4, left: -18, bottom: 20 }}
                    >
                      <CartesianGrid stroke={chart.grid} strokeWidth={1} vertical={false} />
                      <XAxis
                        dataKey="stageTitle"
                        tick={{ fill: chart.ink, fontSize: 11 }}
                        axisLine={{ stroke: chart.grid }}
                        tickLine={false}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                        height={40}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: chart.ink, fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: 'var(--accent-soft)' }}
                        contentStyle={tooltipStyle}
                        formatter={(value) => [value, 'Journeys reached']}
                      />
                      <Bar
                        dataKey="studentsReached"
                        fill={chart.positive}
                        radius={[4, 4, 0, 0]}
                        barSize={28}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <InfrastructurePanel />
          </>
        ))}

      {activeTab === 'kb' && <KnowledgeBaseManager />}
      {activeTab === 'users' && <UsersPanel />}
      {activeTab === 'reports' && <ReportsPanel />}
      {activeTab === 'notes' && <AdminNotesManager />}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
          <Card>
            <CardHeader>
              <CardKicker>Visual Settings</CardKicker>
              <CardTitle className="text-body font-semibold">Theme & Colors</CardTitle>
              <CardDescription>Customize the application aesthetics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-ink-secondary">Theme Mode</Label>
                <div className="flex gap-2">
                  <Button
                    variant={theme === 'light' ? 'primary' : 'secondary'}
                    size="sm"
                    className="flex-1 flex items-center justify-center gap-1.5 h-8 text-xs font-medium"
                    onClick={() => setTheme('light')}
                  >
                    <Sun size={14} />
                    Light
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'primary' : 'secondary'}
                    size="sm"
                    className="flex-1 flex items-center justify-center gap-1.5 h-8 text-xs font-medium"
                    onClick={() => setTheme('dark')}
                  >
                    <Moon size={14} />
                    Dark
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-ink-secondary">
                  Brand Accent Color
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.values(ACCENT_PRESETS).map((preset) => {
                    const isActive = accentPreset === preset.key
                    return (
                      <button
                        key={preset.key}
                        onClick={() => setAccentPreset(preset.key)}
                        className={cn(
                          'relative flex items-center justify-between px-3 py-2 rounded-sm border text-left text-xs transition-all duration-150 hover:bg-surface-secondary',
                          isActive
                            ? 'border-accent bg-accent-soft font-semibold text-accent shadow-xs'
                            : 'border-hairline bg-surface text-ink-secondary',
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10"
                            style={{ background: preset.accent }}
                          />
                          {preset.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardKicker>Data & Exports</CardKicker>
              <CardTitle className="text-body font-semibold">Reports & Downloads</CardTitle>
              <CardDescription>Export platform metrics and information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-surface-secondary rounded-sm border border-hairline flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <div className="min-w-0 pr-2">
                    <h4 className="text-xs font-semibold text-ink">Analytics Summary Report</h4>
                    <p className="text-caption text-ink-tertiary truncate">
                      Student completions, stage statistics, and drop-off rate counts.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleDownloadAnalyticsCSV}
                    className="flex items-center gap-1 shrink-0 h-7"
                  >
                    <Download size={12} />
                    CSV
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-surface-secondary rounded-sm border border-hairline flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <div className="min-w-0 pr-2">
                    <h4 className="text-xs font-semibold text-ink">Knowledge Base Export</h4>
                    <p className="text-caption text-ink-tertiary truncate">
                      Full list of all immigration fees, housing guidelines, and documents.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleDownloadResourcesCSV}
                    className="flex items-center gap-1 shrink-0 h-7"
                  >
                    <Download size={12} />
                    CSV
                  </Button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="secondary"
                  className="w-full flex items-center justify-center gap-2 h-9 text-xs"
                  onClick={() => window.print()}
                >
                  <Printer size={14} />
                  Print Executive Summary
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4 flex flex-col gap-1">
      <p className="text-caption font-semibold uppercase tracking-[0.05em] text-ink-secondary">
        {label}
      </p>
      <p className="text-[22px] leading-tight font-bold text-ink">{value}</p>
    </Card>
  )
}

const emptyForm = {
  id: undefined as string | undefined,
  title: '',
  summary: '',
  categoryKey: 'visa' as CategoryKey,
  costGbp: '',
  deadlineDays: '',
  sourceUrl: '',
}

function KnowledgeBaseManager() {
  const { data: resources } = useResources({
    search: '',
    category: '',
    sort: 'updated',
    order: 'desc',
  })
  const { data: categories } = useCategories()
  const saveResource = useSaveResource()
  const deleteResource = useDeleteResource()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState<string | null>(null)

  const [searchParams] = useSearchParams()
  const editId = searchParams.get('id')

  useEffect(() => {
    if (editId && resources && form.id !== editId) {
      const resource = resources.find((r) => r.id === editId)
      if (resource) {
        setForm({
          id: resource.id,
          title: resource.title,
          summary: resource.summary,
          categoryKey: resource.categoryKey as CategoryKey,
          costGbp: resource.costPence === null ? '' : String(resource.costPence / 100),
          deadlineDays:
            resource.deadlineDaysBeforeIntake === null
              ? ''
              : String(resource.deadlineDaysBeforeIntake),
          sourceUrl: resource.sourceUrl,
        })
        setTimeout(() => {
          document
            .getElementById('kb-form')
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 150)
      }
    }
  }, [editId, resources, form.id])

  // Interactive Table State
  const [tableSearch, setTableSearch] = useState('')
  const [tableCategory, setTableCategory] = useState('')
  const [sortField, setSortField] = useState<'title' | 'categoryKey' | 'costPence'>('title')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [expandedIds, setExpandedIds] = useState<string[]>([])

  const startEdit = (resource: Resource) => {
    setForm({
      id: resource.id,
      title: resource.title,
      summary: resource.summary,
      categoryKey: resource.categoryKey,
      costGbp: resource.costPence === null ? '' : String(resource.costPence / 100),
      deadlineDays:
        resource.deadlineDaysBeforeIntake === null ? '' : String(resource.deadlineDaysBeforeIntake),
      sourceUrl: resource.sourceUrl,
    })
    document.getElementById('kb-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    saveResource.mutate(
      {
        id: form.id,
        title: form.title,
        summary: form.summary,
        categoryKey: form.categoryKey,
        costPence: form.costGbp === '' ? null : Math.round(Number(form.costGbp) * 100),
        deadlineDaysBeforeIntake: form.deadlineDays === '' ? null : Number(form.deadlineDays),
        sourceUrl: form.sourceUrl,
      },
      {
        onSuccess: () => {
          setForm(emptyForm)
          toast.success('Resource saved.')
        },
        onError: (err) => {
          setError(apiErrorMessage(err, 'Could not save the resource'))
          toast.error('Something went wrong. Try again.')
        },
      },
    )
  }

  const onDelete = (id: string) => {
    deleteResource.mutate(id, {
      onSuccess: () => toast.success('Resource removed.'),
      onError: () => toast.error('Something went wrong. Try again.'),
    })
  }

  // Interactive Filter and Sort Logic
  const filteredAndSortedResources = useMemo(() => {
    if (!resources) return []
    let list = resources.filter((r) => {
      const titleMatch = r.title.toLowerCase().includes(tableSearch.toLowerCase())
      const summaryMatch = r.summary.toLowerCase().includes(tableSearch.toLowerCase())
      const searchMatch = titleMatch || summaryMatch
      const categoryMatch = !tableCategory || r.categoryKey === tableCategory
      return searchMatch && categoryMatch
    })

    list = [...list].sort((a, b) => {
      const valA: string | number =
        sortField === 'costPence' ? (a.costPence ?? -1) : String(a[sortField] ?? '').toLowerCase()
      const valB: string | number =
        sortField === 'costPence' ? (b.costPence ?? -1) : String(b[sortField] ?? '').toLowerCase()

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return list
  }, [resources, tableSearch, tableCategory, sortField, sortOrder])

  const handleSort = (field: 'title' | 'categoryKey' | 'costPence') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const toggleRowExpanded = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const clearFilters = () => {
    setTableSearch('')
    setTableCategory('')
  }

  return (
    <section>
      <div className="flex flex-col md:flex-row gap-3 mb-4 items-center justify-between">
        <h2 className="text-body-lg font-semibold tracking-tight">Knowledge base</h2>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full md:w-auto">
          <div className="relative w-full sm:w-60">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-tertiary"
            />
            <Input
              className="pl-8 text-xs h-8"
              placeholder="Search entries..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
            />
            {tableSearch && (
              <button
                onClick={() => setTableSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-caption text-ink-tertiary hover:text-ink"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <span className="text-caption text-ink-secondary flex items-center gap-1 shrink-0">
              <Filter size={11} />
              Filter:
            </span>
            <div className="flex gap-0.5 bg-surface-secondary p-0.5 rounded-sm border border-hairline shrink-0">
              <button
                onClick={() => setTableCategory('')}
                className={cn(
                  'text-micro font-semibold px-2 py-0.5 rounded-xs transition-colors duration-[120ms]',
                  !tableCategory
                    ? 'bg-surface text-ink shadow-xs'
                    : 'text-ink-secondary hover:text-ink',
                )}
              >
                All
              </button>
              {(categories ?? []).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setTableCategory(cat.key)}
                  className={cn(
                    'text-micro font-semibold px-2 py-0.5 rounded-xs transition-colors duration-[120ms]',
                    tableCategory === cat.key
                      ? 'bg-surface text-ink shadow-xs'
                      : 'text-ink-secondary hover:text-ink',
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3 overflow-hidden flex flex-col">
          <CardContent className="p-0 flex-1 overflow-x-auto">
            <table className="w-full text-body border-collapse">
              <thead>
                <tr className="text-left text-caption font-semibold uppercase tracking-[0.05em] text-ink-secondary bg-surface-secondary border-b border-hairline">
                  <th className="py-2.5 pl-5 pr-1 w-6" />
                  <th className="py-2.5 px-3 font-semibold text-left select-none">
                    <button
                      type="button"
                      className="flex items-center gap-1 hover:text-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-xs"
                      onClick={() => handleSort('title')}
                    >
                      Title
                      {sortField === 'title' ? (
                        sortOrder === 'asc' ? (
                          <ChevronUp size={12} />
                        ) : (
                          <ChevronDown size={12} />
                        )
                      ) : (
                        <ArrowUpDown size={11} className="text-ink-tertiary opacity-40" />
                      )}
                    </button>
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-left select-none">
                    <button
                      type="button"
                      className="flex items-center gap-1 hover:text-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-xs"
                      onClick={() => handleSort('categoryKey')}
                    >
                      Category
                      {sortField === 'categoryKey' ? (
                        sortOrder === 'asc' ? (
                          <ChevronUp size={12} />
                        ) : (
                          <ChevronDown size={12} />
                        )
                      ) : (
                        <ArrowUpDown size={11} className="text-ink-tertiary opacity-40" />
                      )}
                    </button>
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-right select-none">
                    <button
                      type="button"
                      className="flex items-center justify-end gap-1 ml-auto hover:text-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-xs"
                      onClick={() => handleSort('costPence')}
                    >
                      Cost
                      {sortField === 'costPence' ? (
                        sortOrder === 'asc' ? (
                          <ChevronUp size={12} />
                        ) : (
                          <ChevronDown size={12} />
                        )
                      ) : (
                        <ArrowUpDown size={11} className="text-ink-tertiary opacity-40" />
                      )}
                    </button>
                  </th>
                  <th className="py-2.5 pr-5 pl-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border)">
                <AnimatePresence initial={false}>
                  {filteredAndSortedResources.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-caption text-ink-tertiary">
                        No resources match your search or filter.
                        {(tableSearch || tableCategory) && (
                          <button
                            onClick={clearFilters}
                            className="block mx-auto mt-2 text-xs font-semibold text-accent hover:underline"
                          >
                            Clear search & filters
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedResources.map((resource) => {
                      const isExpanded = expandedIds.includes(resource.id)
                      return (
                        <React.Fragment key={resource.id}>
                          <motion.tr
                            layout
                            className={cn(
                              'hover:bg-canvas transition-colors duration-[120ms]',
                              isExpanded && 'bg-canvas/40',
                            )}
                          >
                            <td className="py-2.5 pl-5 pr-1 text-left w-6">
                              <button
                                onClick={() => toggleRowExpanded(resource.id)}
                                className="h-5 w-5 flex items-center justify-center rounded-xs text-ink-secondary hover:bg-surface-secondary hover:text-ink transition-colors duration-[120ms]"
                                aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                              >
                                <ChevronRight
                                  size={13}
                                  className={cn(
                                    'transition-transform duration-200',
                                    isExpanded && 'rotate-90',
                                  )}
                                />
                              </button>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-ink max-w-[200px] truncate">
                              {resource.title}
                            </td>
                            <td className="py-2.5 px-3">
                              <Badge category={resource.categoryKey} />
                            </td>
                            <td className="py-2.5 px-3 text-right tabular-nums text-ink-secondary">
                              {resource.costPence === null ? 'None' : formatGbp(resource.costPence)}
                            </td>
                            <td className="py-2.5 pr-5 pl-3 text-right whitespace-nowrap">
                              <span className="inline-flex gap-1.5">
                                <button
                                  onClick={() => startEdit(resource)}
                                  className="h-6 w-6 flex items-center justify-center rounded-xs border border-hairline text-ink-secondary hover:bg-surface-secondary hover:text-ink transition-colors duration-[120ms]"
                                  aria-label={`Edit ${resource.title}`}
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  onClick={() => onDelete(resource.id)}
                                  disabled={deleteResource.isPending}
                                  className="h-6 w-6 flex items-center justify-center rounded-xs border border-hairline text-ink-secondary hover:bg-danger-soft hover:text-danger hover:border-danger transition-colors duration-[120ms] disabled:opacity-50"
                                  aria-label={`Delete ${resource.title}`}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </span>
                            </td>
                          </motion.tr>
                          {isExpanded && (
                            <tr className="bg-canvas/30 border-0">
                              <td colSpan={5} className="py-2.5 px-5 pl-12 border-0">
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-3 bg-surface border border-hairline rounded-md shadow-sm space-y-2 mb-2 text-xs">
                                    <div className="flex flex-col gap-1">
                                      <p className="font-semibold text-ink">Summary:</p>
                                      <p className="text-ink-secondary leading-normal">
                                        {resource.summary}
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-2 border-t border-hairline text-micro text-ink-tertiary">
                                      <span>
                                        <strong>Deadline:</strong>{' '}
                                        {resource.deadlineDaysBeforeIntake !== null
                                          ? `${Math.abs(resource.deadlineDaysBeforeIntake)} days ${
                                              resource.deadlineDaysBeforeIntake >= 0
                                                ? 'before'
                                                : 'after'
                                            } intake`
                                          : 'None'}
                                      </span>
                                      {resource.sourceUrl && (
                                        <span className="flex items-center gap-1">
                                          <strong>Source URL:</strong>{' '}
                                          <a
                                            href={resource.sourceUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-accent hover:underline inline-flex items-center gap-0.5 font-medium"
                                          >
                                            {resource.sourceUrl}
                                            <ExternalLink size={9} />
                                          </a>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2" id="kb-form">
          <CardHeader>
            <CardTitle>{form.id ? 'Edit resource' : 'Add resource'}</CardTitle>
            <CardDescription>
              Every entry needs an official source URL and stays timestamped.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <Label htmlFor="kb-title">Title</Label>
                <Input
                  id="kb-title"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="kb-summary">Summary</Label>
                <Textarea
                  id="kb-summary"
                  required
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="kb-category">Category</Label>
                  <Select
                    id="kb-category"
                    value={form.categoryKey}
                    onChange={(e) =>
                      setForm({ ...form, categoryKey: e.target.value as CategoryKey })
                    }
                  >
                    {(categories ?? []).map((c) => (
                      <option key={c.id} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="kb-cost">Cost (GBP, optional)</Label>
                  <Input
                    id="kb-cost"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.costGbp}
                    onChange={(e) => setForm({ ...form, costGbp: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="kb-deadline">
                  Days before intake (optional, negative is after)
                </Label>
                <Input
                  id="kb-deadline"
                  type="number"
                  value={form.deadlineDays}
                  onChange={(e) => setForm({ ...form, deadlineDays: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="kb-source">Official source URL</Label>
                <Input
                  id="kb-source"
                  type="url"
                  required
                  placeholder="https://www.gov.uk/..."
                  value={form.sourceUrl}
                  onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
                />
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={saveResource.isPending}>
                  {form.id ? 'Save changes' : 'Add resource'}
                </Button>
                {form.id && (
                  <Button variant="ghost" onClick={() => setForm(emptyForm)}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

interface AdminNote {
  id: string
  title: string
  content: string
  priority: 'high' | 'medium' | 'low'
  category: 'bug' | 'feature' | 'data' | 'general'
  author: string
  createdAt: string
}

function AdminNotesManager() {
  const [notes, setNotes] = useState<AdminNote[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [newCategory, setNewCategory] = useState<'bug' | 'feature' | 'data' | 'general'>('general')
  const [newAuthor, setNewAuthor] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('studyou_admin_notes')
    if (saved) {
      setNotes(JSON.parse(saved))
    } else {
      const initialNotes: AdminNote[] = [
        {
          id: '1',
          title: 'Update Oxford tuition fees',
          content:
            'Oxford updated their international fees for 2026. Make sure the database matches the official site values.',
          priority: 'high',
          category: 'data',
          author: 'System Auto-Flag',
          createdAt: '2026-07-17T12:00:00.000Z',
        },
        {
          id: '2',
          title: 'Review visa requirements changes',
          content:
            'Verify if there are any new passport submission rules for students from non-EU countries in the latest guidelines.',
          priority: 'medium',
          category: 'bug',
          author: 'Admin K',
          createdAt: '2026-07-17T15:30:00.000Z',
        },
        {
          id: '3',
          title: 'Azure CPU spikes during seeding',
          content:
            'Observe CPU patterns when seeding high amounts of records. B1ms instance size might need scaling up during busy months.',
          priority: 'low',
          category: 'general',
          author: 'Azure Monitor',
          createdAt: '2026-07-18T01:10:00.000Z',
        },
      ]
      setNotes(initialNotes)
      localStorage.setItem('studyou_admin_notes', JSON.stringify(initialNotes))
    }
  }, [])

  const saveNotes = (updated: AdminNote[]) => {
    setNotes(updated)
    localStorage.setItem('studyou_admin_notes', JSON.stringify(updated))
  }

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newContent.trim()) return

    const newNote: AdminNote = {
      id: crypto.randomUUID(),
      title: newTitle,
      content: newContent,
      priority: newPriority,
      category: newCategory,
      author: newAuthor.trim() || 'Admin User',
      createdAt: new Date().toISOString(),
    }

    const updated = [newNote, ...notes]
    saveNotes(updated)

    // Reset Form
    setNewTitle('')
    setNewContent('')
    setNewPriority('medium')
    setNewCategory('general')
    setNewAuthor('')
    toast.success('Note added successfully.')
  }

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id)
    saveNotes(updated)
    toast.success('Note deleted.')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left side: Add Note Form */}
      <Card className="lg:col-span-1 h-fit">
        <CardHeader>
          <CardTitle>Create Admin Note</CardTitle>
          <CardDescription>
            Flag bugs, data discrepancies, or leave instructions for other staff.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddNote} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="note-title">Note Title</Label>
              <Input
                id="note-title"
                required
                placeholder="e.g. Update visa processing fee"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="note-priority">Priority</Label>
                <Select
                  id="note-priority"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as 'high' | 'medium' | 'low')}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="note-category">Category</Label>
                <Select
                  id="note-category"
                  value={newCategory}
                  onChange={(e) =>
                    setNewCategory(e.target.value as 'bug' | 'feature' | 'data' | 'general')
                  }
                >
                  <option value="general">General</option>
                  <option value="data">Data Correction</option>
                  <option value="bug">System Bug</option>
                  <option value="feature">Feature Request</option>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="note-author">Author / Flagged By</Label>
              <Input
                id="note-author"
                placeholder="e.g. Admin K"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="note-content">Note Details</Label>
              <Textarea
                id="note-content"
                required
                placeholder="Add context, screenshots links, or task instructions..."
                rows={4}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 h-9 mt-2"
            >
              <Plus size={14} />
              Add Note to Board
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Right side: Notes Board */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-body-lg font-semibold tracking-tight">Interactive Board</h2>
          <span className="text-caption text-ink-tertiary">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'} active
          </span>
        </div>

        {notes.length === 0 ? (
          <div className="p-8 text-center bg-surface border border-hairline rounded-md">
            <p className="text-body text-ink-secondary">The admin board is clear.</p>
            <p className="text-caption text-ink-tertiary mt-1">No active notes or flags.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {notes.map((note) => (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-surface border border-hairline rounded-md p-4 flex flex-col justify-between shadow-xs transition-shadow duration-[120ms] hover:shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={cn(
                        'text-micro font-bold px-2 py-0.5 rounded-full uppercase',
                        note.priority === 'high' && 'bg-danger-soft text-danger',
                        note.priority === 'medium' && 'bg-accent-soft text-accent',
                        note.priority === 'low' && 'bg-surface-secondary text-ink-secondary',
                      )}
                    >
                      {note.priority}
                    </span>
                    <span className="text-micro font-medium text-ink-tertiary capitalize">
                      {note.category}
                    </span>
                  </div>

                  <h3 className="text-body font-bold text-ink mb-1.5 leading-snug">{note.title}</h3>
                  <p className="text-caption text-ink-secondary leading-relaxed mb-4 whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>

                <div className="border-t border-hairline pt-3 mt-auto flex items-center justify-between text-micro text-ink-tertiary">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-secondary truncate">By: {note.author}</p>
                    <p>{new Date(note.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="h-6 px-2.5 rounded-sm border border-hairline hover:bg-danger-soft hover:text-danger hover:border-danger transition-colors duration-[120ms]"
                  >
                    Resolve
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
