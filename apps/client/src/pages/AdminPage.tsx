import type { CategoryKey, Resource } from '@studyou/types'
import { Pencil, Trash2 } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input, Label, Select, Textarea } from '../components/ui/input'
import { useAnalytics, useCategories } from '../hooks/useMeta'
import { useDeleteResource, useResources, useSaveResource } from '../hooks/useResources'
import { apiErrorMessage } from '../lib/api'
import { formatGbp } from '../lib/format'

const chartInk = '#898781'
const chartGrid = '#e1e0d9'
const seriesBlue = '#2a78d6'
const seriesGreen = '#008300'

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid rgb(0 0 0 / 0.08)',
  boxShadow: '0 8px 24px rgb(0 0 0 / 0.08)',
  fontSize: 12,
  background: '#ffffff',
}

export function AdminPage() {
  const { data: analytics, isPending } = useAnalytics(true)

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
        <p className="text-sm text-ink-secondary mt-1">
          How students are progressing, and where they drop off.
        </p>
      </header>

      {isPending || !analytics ? (
        <p className="text-sm text-ink-muted py-16 text-center">Loading analytics...</p>
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
                <CardTitle>Completion rate by stage</CardTitle>
                <CardDescription>Share of tasks completed in each stage</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={analytics.stageBreakdown}
                    margin={{ top: 4, right: 4, left: -18 }}
                  >
                    <CartesianGrid stroke={chartGrid} strokeWidth={1} vertical={false} />
                    <XAxis
                      dataKey="stageTitle"
                      tick={{ fill: chartInk, fontSize: 11 }}
                      axisLine={{ stroke: chartGrid }}
                      tickLine={false}
                      interval={0}
                    />
                    <YAxis
                      unit="%"
                      domain={[0, 100]}
                      tick={{ fill: chartInk, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgb(0 0 0 / 0.03)' }}
                      contentStyle={tooltipStyle}
                      formatter={(value) => [`${value}%`, 'Completion']}
                    />
                    <Bar
                      dataKey="completionRate"
                      fill={seriesBlue}
                      radius={[4, 4, 0, 0]}
                      barSize={28}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Drop off by stage</CardTitle>
                <CardDescription>Journeys with at least one task done per stage</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={analytics.dropOff} margin={{ top: 4, right: 4, left: -18 }}>
                    <CartesianGrid stroke={chartGrid} strokeWidth={1} vertical={false} />
                    <XAxis
                      dataKey="stageTitle"
                      tick={{ fill: chartInk, fontSize: 11 }}
                      axisLine={{ stroke: chartGrid }}
                      tickLine={false}
                      interval={0}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: chartInk, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgb(0 0 0 / 0.03)' }}
                      contentStyle={tooltipStyle}
                      formatter={(value) => [value, 'Journeys reached']}
                    />
                    <Bar
                      dataKey="studentsReached"
                      fill={seriesGreen}
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
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs text-ink-muted">{label}</p>
        <p className="text-2xl font-semibold tracking-tight mt-1">{value}</p>
      </CardContent>
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
        onSuccess: () => setForm(emptyForm),
        onError: (err) => setError(apiErrorMessage(err, 'Could not save the resource')),
      },
    )
  }

  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight mb-4">Knowledge base</h2>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3">
          <CardContent className="pt-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-muted border-b border-hairline">
                  <th className="pb-2 font-medium">Title</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium text-right">Cost</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {(resources ?? []).map((resource) => (
                  <tr key={resource.id}>
                    <td className="py-2.5 pr-3 font-medium">{resource.title}</td>
                    <td className="py-2.5 pr-3">
                      <Badge category={resource.categoryKey} />
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-ink-secondary">
                      {resource.costPence === null ? '-' : formatGbp(resource.costPence)}
                    </td>
                    <td className="py-2.5 pl-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => startEdit(resource)}
                        className="p-1.5 rounded-lg text-ink-muted hover:text-accent hover:bg-accent-soft transition-colors"
                        aria-label={`Edit ${resource.title}`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => deleteResource.mutate(resource.id)}
                        className="p-1.5 rounded-lg text-ink-muted hover:text-danger hover:bg-danger-soft transition-colors"
                        aria-label={`Delete ${resource.title}`}
                      >
                        <Trash2 size={14} />
                      </button>
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
