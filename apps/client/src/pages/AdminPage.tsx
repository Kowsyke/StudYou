import type { CategoryKey, Resource } from '@studyou/types'
import { Pencil, Trash2 } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
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
import { toast } from '../store/toastStore'

export function AdminPage() {
  const { data: analytics, isPending, error, refetch, isRefetching } = useAnalytics(true)
  const chart = useChartTokens()

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
      <header className="mb-6">
        <h1 className="text-title3 text-ink">Insights</h1>
        <p className="text-xs text-ink-secondary mt-1">
          How students are progressing, and where they drop off.
        </p>
      </header>

      {isPending ? (
        <div className="space-y-4 mb-8">
          <div className="grid grid-cols-3 gap-4">
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
          <div className="grid grid-cols-3 gap-4 mb-5">
            <StatTile label="Students" value={analytics.totalStudents} />
            <StatTile label="Active journeys" value={analytics.totalJourneys} />
            <StatTile label="Average completion" value={`${analytics.averageCompletion}%`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardKicker>Completion rate by stage</CardKicker>
                <CardDescription>Share of tasks completed in each stage</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={analytics.stageBreakdown}
                    margin={{ top: 4, right: 4, left: -18 }}
                  >
                    <CartesianGrid stroke={chart.grid} strokeWidth={1} vertical={false} />
                    <XAxis
                      dataKey="stageTitle"
                      tick={{ fill: chart.ink, fontSize: 11 }}
                      axisLine={{ stroke: chart.grid }}
                      tickLine={false}
                      interval={0}
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

            <Card>
              <CardHeader>
                <CardKicker>Drop off by stage</CardKicker>
                <CardDescription>Journeys with at least one task done per stage</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={analytics.dropOff} margin={{ top: 4, right: 4, left: -18 }}>
                    <CartesianGrid stroke={chart.grid} strokeWidth={1} vertical={false} />
                    <XAxis
                      dataKey="stageTitle"
                      tick={{ fill: chart.ink, fontSize: 11 }}
                      axisLine={{ stroke: chart.grid }}
                      tickLine={false}
                      interval={0}
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
        </>
      )}

      <KnowledgeBaseManager />
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

  return (
    <section>
      <h2 className="text-body-lg font-semibold tracking-tight mb-4">Knowledge base</h2>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3 overflow-hidden">
          <CardContent className="p-0">
            <table className="w-full text-body">
              <thead>
                <tr className="text-left text-caption font-semibold uppercase tracking-[0.05em] text-ink-secondary bg-surface-secondary">
                  <th className="py-3 px-5 font-semibold">Title</th>
                  <th className="py-3 pr-3 font-semibold">Category</th>
                  <th className="py-3 pr-3 font-semibold text-right">Cost</th>
                  <th className="py-3 pr-5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border)">
                {(resources ?? []).map((resource) => (
                  <tr
                    key={resource.id}
                    className="hover:bg-canvas transition-colors duration-[120ms]"
                  >
                    <td className="py-2.5 px-5 pr-3 font-semibold text-ink">{resource.title}</td>
                    <td className="py-2.5 pr-3">
                      <Badge category={resource.categoryKey} />
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums text-ink-secondary">
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
                  </tr>
                ))}
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
