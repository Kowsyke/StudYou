import { useGSAP } from '@gsap/react'
import type { CategoryKey, Resource } from '@studyou/types'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  ArrowUpDown,
  BadgePoundSterling,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Download,
  ExternalLink,
  Filter,
  Layers,
  Link2,
  Monitor,
  Moon,
  Palette,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Sparkles,
  Sun,
  Trash2,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import React, { type FormEvent, useMemo, useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
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
import { CountUp } from '../components/ui/count-up'
import { Input, Label, Select, Textarea } from '../components/ui/input'
import { CardSkeleton } from '../components/ui/skeleton'
import {
  useAdminNotes,
  useAdminReports,
  useAdminUsers,
  useCreateAdminNote,
  useDeleteAdminNote,
} from '../hooks/useAdmin'
import { useChartTokens } from '../hooks/useChartTokens'
import { useAnalytics, useCategories } from '../hooks/useMeta'
import { useDeleteResource, useResources, useSaveResource } from '../hooks/useResources'
import { useUniversities } from '../hooks/useUniversities'
import { apiErrorMessage } from '../lib/api'
import { formatGbp, safeExternalUrl } from '../lib/format'
import { Draggable } from '../lib/gsap/Draggable.js'
import { gsap } from '../lib/gsap/index.js'
import { cn } from '../lib/utils'
import { ACCENT_PRESETS, useThemeStore } from '../store/themeStore'
import { toast } from '../store/toastStore'

gsap.registerPlugin(useGSAP, Draggable)

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
  const { themePreference, setTheme, accentPreset, setAccentPreset } = useThemeStore()
  const [settingsSubTab, setSettingsSubTab] = useState<'visuals' | 'exports'>('visuals')

  const panelRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (panelRef.current) {
      gsap.fromTo(
        panelRef.current.children,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', stagger: 0.05, overwrite: 'auto' },
      )
    }
  }, [activeTab, settingsSubTab])

  // Data hooks for admin export capabilities
  const { data: resources } = useResources({
    search: '',
    category: '',
    sort: 'title',
    order: 'asc',
  })
  const { data: usersList } = useAdminUsers(activeTab === 'settings')
  const { data: reportsList } = useAdminReports(activeTab === 'settings')
  const { data: universitiesList } = useUniversities({
    search: '',
    regions: [],
    russellGroup: false,
    sort: 'rank',
  })

  // Robust Blob & ObjectURL download triggers for clean cross-browser exports
  const downloadBlob = (
    content: string,
    filename: string,
    mimeType = 'text/csv;charset=utf-8;',
  ) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleDownloadAnalyticsCSV = () => {
    if (!analytics) {
      toast.error('Analytics data is loading or unavailable.')
      return
    }
    let csvContent = 'Metric,Value\n'
    csvContent += `Total Students,${analytics.totalStudents}\n`
    csvContent += `Active Journeys,${analytics.totalJourneys}\n`
    csvContent += `Average Completion %,${analytics.averageCompletion}\n\n`
    csvContent += 'Stage Title,Total Tasks,Completed Tasks,Completion Rate\n'
    for (const stage of analytics.stageBreakdown) {
      csvContent += `"${stage.stageTitle.replace(/"/g, '""')}",${stage.totalTasks},${stage.completedTasks},${stage.completionRate}%\n`
    }
    csvContent += '\nDrop-Off Analytics\n'
    csvContent += 'Stage Title,Students Reached\n'
    for (const d of analytics.dropOff) {
      csvContent += `"${d.stageTitle.replace(/"/g, '""')}",${d.studentsReached}\n`
    }
    downloadBlob(csvContent, 'studyou_analytics_report.csv')
    toast.success('Analytics summary CSV exported.')
  }

  const handleDownloadResourcesCSV = () => {
    if (!resources || resources.length === 0) {
      toast.error('Knowledge Base resources dataset is empty or loading.')
      return
    }
    let csvContent = 'ID,Title,Category,Cost (Pence),Deadline (Days),Source URL\n'
    for (const r of resources) {
      csvContent += `"${r.id}","${(r.title ?? '').replace(/"/g, '""')}","${r.categoryKey}",${r.costPence ?? 0},${r.deadlineDaysBeforeIntake ?? 0},"${r.sourceUrl ?? ''}"\n`
    }
    downloadBlob(csvContent, 'studyou_resources_export.csv')
    toast.success('Knowledge Base CSV exported.')
  }

  const handleDownloadUsersCSV = () => {
    if (!usersList || usersList.length === 0) {
      toast.error('Users roster is empty or loading.')
      return
    }
    let csvContent = 'ID,Full Name,Email,Role,Status,Roadmap Completion %,Open Reports,Created At\n'
    for (const u of usersList) {
      csvContent += `"${u.id}","${(u.fullName ?? '').replace(/"/g, '""')}","${u.email}",${u.role},"${u.suspended ? 'Suspended' : 'Active'}",${u.percentComplete ?? 0}%,${u.openReports},"${u.createdAt}"\n`
    }
    downloadBlob(csvContent, 'studyou_users_roster.csv')
    toast.success('Users roster CSV exported.')
  }

  const handleDownloadReportsCSV = () => {
    if (!reportsList || reportsList.length === 0) {
      toast.error('No feedback reports available to export.')
      return
    }
    let csvContent = 'ID,Category,Message,Page Path,Status,Admin Note,Created At\n'
    for (const rep of reportsList) {
      csvContent += `"${rep.id}","${rep.category}","${(rep.message ?? '').replace(/"/g, '""')}","${rep.pagePath ?? ''}","${rep.status}","${(rep.adminNote ?? '').replace(/"/g, '""')}","${rep.createdAt}"\n`
    }
    downloadBlob(csvContent, 'studyou_bug_reports.csv')
    toast.success('Bug reports CSV exported.')
  }

  const handleDownloadUniversitiesCSV = () => {
    if (!universitiesList || universitiesList.length === 0) {
      toast.error('Universities dataset is loading or unavailable.')
      return
    }
    let csvContent =
      'Rank,Name,City,Region,Russell Group,Website,Tuition Intl Min GBP,Tuition Intl Max GBP\n'
    for (const uni of universitiesList) {
      csvContent += `${uni.rank},"${uni.name.replace(/"/g, '""')}","${uni.city}","${uni.region}",${uni.russellGroup ? 'Yes' : 'No'},"${uni.website}",${uni.tuitionIntlMinGbp ?? 0},${uni.tuitionIntlMaxGbp ?? 0}\n`
    }
    downloadBlob(csvContent, 'studyou_universities_directory.csv')
    toast.success('Universities directory CSV exported.')
  }

  const handleDownloadFullBackupJSON = () => {
    const backupData = {
      exportTimestamp: new Date().toISOString(),
      analytics: analytics ?? null,
      resources: resources ?? [],
      users: usersList ?? [],
      reports: reportsList ?? [],
      universities: universitiesList ?? [],
    }
    downloadBlob(
      JSON.stringify(backupData, null, 2),
      `studyou_full_backup_${new Date().toISOString().slice(0, 10)}.json`,
      'application/json',
    )
    toast.success('Full database JSON backup exported.')
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
          <h1 className="text-title3 text-ink font-bold flex items-center gap-2">
            {activeTab === 'insights' && 'Admin Insights & Realtime Analytics'}
            {activeTab === 'kb' && 'Knowledge Base Manager'}
            {activeTab === 'users' && 'User Administration'}
            {activeTab === 'reports' && 'Bug Triage Console'}
            {activeTab === 'notes' && 'Admin Workspace Notes'}
            {activeTab === 'settings' && 'Visual Settings & Exports'}
          </h1>
          <p className="text-xs text-ink-secondary mt-1">
            {activeTab === 'insights' &&
              'Realtime platform activity, student conversion velocity, and server infrastructure.'}
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

        {activeTab === 'insights' && (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="gap-1.5 backdrop-blur-md bg-surface/60 border-hairline hover:bg-surface"
            >
              <RefreshCw size={13} className={cn(isRefetching && 'animate-spin')} />
              Refresh Data
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadAnalyticsCSV}
              className="gap-1.5 sheen text-white bg-accent-solid [background-image:var(--accent-gradient)]"
            >
              <Download size={13} />
              Export CSV
            </Button>
          </div>
        )}
      </header>

      <div ref={panelRef} className="admin-panel-contents">
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
              {/* Headline metric tiles, all query-backed */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="relative overflow-hidden bg-surface border border-accent/30 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-caption font-semibold uppercase tracking-[0.08em] text-accent">
                      Active Roadmaps
                    </p>
                    <div className="p-2 rounded-xl bg-accent-soft text-accent">
                      <Layers size={16} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-title2 font-black text-ink tabular-nums tracking-tight">
                      <CountUp value={analytics.totalJourneys} />
                    </p>
                    <p className="text-micro text-ink-tertiary mt-1">
                      {analytics.newThisWeek} new this week
                    </p>
                  </div>
                </div>

                <div className="relative overflow-hidden bg-surface border border-hairline rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                  <div className="flex items-center justify-between">
                    <p className="text-caption font-semibold uppercase tracking-[0.08em] text-ink-secondary">
                      Active Now
                    </p>
                    <div className="p-2 rounded-xl bg-positive/10 text-positive">
                      <Activity size={16} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        {analytics.activeUsers > 0 && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-positive opacity-75" />
                        )}
                        <span
                          className={cn(
                            'relative inline-flex rounded-full h-3 w-3',
                            analytics.activeUsers > 0 ? 'bg-positive' : 'bg-ink-muted',
                          )}
                        />
                      </span>
                      <p className="text-title2 font-bold text-ink tabular-nums">
                        <CountUp value={analytics.activeUsers} />
                      </p>
                    </div>
                    <p className="text-micro text-ink-tertiary mt-1">Live in last 5 minutes</p>
                  </div>
                </div>

                <div className="relative overflow-hidden bg-surface border border-hairline rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                  <div className="flex items-center justify-between">
                    <p className="text-caption font-semibold uppercase tracking-[0.08em] text-ink-secondary">
                      Total Students
                    </p>
                    <div className="p-2 rounded-xl bg-surface-secondary text-ink-secondary">
                      <Users size={16} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-title2 font-bold text-ink tabular-nums">
                      <CountUp value={analytics.totalStudents} />
                    </p>
                    <p className="text-micro text-ink-tertiary mt-1">
                      {analytics.activeToday} active today
                    </p>
                  </div>
                </div>

                <div className="relative overflow-hidden bg-surface border border-hairline rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                  <div className="flex items-center justify-between">
                    <p className="text-caption font-semibold uppercase tracking-[0.08em] text-ink-secondary">
                      Avg Completion Rate
                    </p>
                    <div className="p-2 rounded-xl bg-accent-soft text-accent">
                      <TrendingUp size={16} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-title2 font-bold text-ink tabular-nums">
                      {Math.round(analytics.averageCompletion)}%
                    </p>
                    <p className="text-micro text-ink-tertiary mt-1">Across all active roadmaps</p>
                  </div>
                </div>
              </div>

              {/* 14-Day Activity & Conversion Trend Area Chart */}
              {analytics.dailyActivityTrend && analytics.dailyActivityTrend.length > 0 && (
                <Card className="mb-6 border-hairline shadow-sm overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardKicker>Platform velocity</CardKicker>
                      <CardTitle className="text-body font-bold text-ink">
                        New sign-ups and tasks completed
                      </CardTitle>
                      <CardDescription>
                        Real daily counts from account creation and task completion timestamps
                      </CardDescription>
                    </div>
                    <Badge className="gap-1 border border-accent/30 text-accent bg-accent-soft/30">
                      Last 14 days
                    </Badge>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ResponsiveContainer width="100%" height={240}>
                      <AreaChart
                        data={analytics.dailyActivityTrend}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="newSignupsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chart.accent} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={chart.accent} stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="tasksCompletedGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chart.positive} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={chart.positive} stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke={chart.grid} strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: chart.ink, fontSize: 11 }}
                          axisLine={{ stroke: chart.grid }}
                          tickLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fill: chart.ink, fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          cursor={{ stroke: chart.accent, strokeWidth: 1 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="newSignups"
                          name="New sign-ups"
                          stroke={chart.accent}
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#newSignupsGrad)"
                        />
                        <Area
                          type="monotone"
                          dataKey="tasksCompleted"
                          name="Tasks completed"
                          stroke={chart.positive}
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#tasksCompletedGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Stage Breakdown & Drop-off Bar Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card className="print:break-inside-avoid border-hairline shadow-xs">
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
                          radius={[6, 6, 0, 0]}
                          barSize={28}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="print:break-inside-avoid border-hairline shadow-xs">
                  <CardHeader>
                    <CardKicker>Drop off by stage</CardKicker>
                    <CardDescription>
                      Journeys with at least one task done per stage
                    </CardDescription>
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
                          radius={[6, 6, 0, 0]}
                          barSize={28}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Resource Category Engagement Grid */}
              {analytics.categoryBreakdown && analytics.categoryBreakdown.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-body font-bold text-ink mb-3 flex items-center gap-2">
                    <Layers size={16} className="text-accent" />
                    Completion by category
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analytics.categoryBreakdown.map((cat) => (
                      <div
                        key={cat.categoryKey}
                        className="bg-surface border border-hairline rounded-2xl p-4 space-y-3 shadow-xs hover:border-accent/30 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-body font-semibold text-ink">{cat.categoryName}</h4>
                          <span className="text-caption font-bold text-accent bg-accent-soft px-2 py-0.5 rounded-full">
                            {cat.completionRate}% Done
                          </span>
                        </div>
                        <div className="w-full bg-surface-secondary rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-accent-solid h-full rounded-full transition-all duration-500 [background-image:var(--accent-gradient)]"
                            style={{ width: `${cat.completionRate}%` }}
                          />
                        </div>
                        <p className="text-micro text-ink-tertiary tabular-nums">
                          {cat.completedTasks} of {cat.totalTasks} tasks completed
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Card className="mb-6 bg-accent-soft/20 border-accent/20">
                <CardContent className="py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-body font-bold text-ink">Azure App Service Analytics</h4>
                    <p className="text-caption text-ink-secondary mt-1">
                      Access compute metrics, response times, memory usage, and server-side log
                      analytics in the Azure Portal.
                    </p>
                  </div>
                  <Button
                    onClick={() => window.open('https://portal.azure.com', '_blank')}
                    className="sheen text-white bg-accent-solid [background-image:var(--accent-gradient)]"
                  >
                    <ExternalLink size={14} className="mr-1.5" />
                    Azure Server Analytics
                  </Button>
                </CardContent>
              </Card>

              <InfrastructurePanel />
            </>
          ))}

        {activeTab === 'kb' && <KnowledgeBaseManager />}
        {activeTab === 'users' && <UsersPanel />}
        {activeTab === 'reports' && <ReportsPanel />}
        {activeTab === 'notes' && <AdminNotesManager />}

        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start print:hidden">
            {/* Admin Settings Sidebar Sub-Navigation */}
            <div className="md:col-span-4 lg:col-span-3 bg-surface/80 border border-hairline rounded-2xl p-2.5 space-y-1 shadow-sm backdrop-blur-md sticky top-20">
              <div className="px-3 py-2 text-micro font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                <Sparkles size={12} />
                Admin Settings
              </div>
              <button
                type="button"
                onClick={() => setSettingsSubTab('visuals')}
                className={cn(
                  'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-body font-semibold transition-all duration-150 cursor-pointer text-left',
                  settingsSubTab === 'visuals'
                    ? 'bg-accent-soft border border-accent/30 text-accent shadow-xs'
                    : 'text-ink-secondary hover:text-ink hover:bg-surface-secondary/60 border border-transparent',
                )}
              >
                <Palette
                  size={16}
                  className={settingsSubTab === 'visuals' ? 'text-accent' : 'text-ink-tertiary'}
                />
                <span>Visuals & Branding</span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsSubTab('exports')}
                className={cn(
                  'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-body font-semibold transition-all duration-150 cursor-pointer text-left',
                  settingsSubTab === 'exports'
                    ? 'bg-accent-soft border border-accent/30 text-accent shadow-xs'
                    : 'text-ink-secondary hover:text-ink hover:bg-surface-secondary/60 border border-transparent',
                )}
              >
                <Download
                  size={16}
                  className={settingsSubTab === 'exports' ? 'text-accent' : 'text-ink-tertiary'}
                />
                <span>Reports & Exports</span>
              </button>
            </div>

            {/* Admin Settings Content Panels */}
            <div className="md:col-span-8 lg:col-span-9 space-y-6">
              {(settingsSubTab === 'visuals' || settingsSubTab === 'exports') && (
                <Card className="bg-surface/80 border border-hairline rounded-2xl shadow-sm backdrop-blur-md p-5">
                  <CardHeader className="p-0 mb-4">
                    <CardKicker>Visual Settings</CardKicker>
                    <CardTitle className="text-body font-bold text-ink">Theme & Colors</CardTitle>
                    <CardDescription className="text-caption text-ink-secondary mt-1">
                      Customize the application aesthetics and brand accents
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 space-y-5">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-ink-secondary">Theme Mode</Label>
                      <div className="flex gap-2">
                        <Button
                          variant={themePreference === 'light' ? 'primary' : 'secondary'}
                          size="sm"
                          className="flex-1 flex items-center justify-center gap-1.5 h-9 text-xs font-bold rounded-xl"
                          onClick={() => setTheme('light')}
                        >
                          <Sun size={14} />
                          Light
                        </Button>
                        <Button
                          variant={themePreference === 'dark' ? 'primary' : 'secondary'}
                          size="sm"
                          className="flex-1 flex items-center justify-center gap-1.5 h-9 text-xs font-bold rounded-xl"
                          onClick={() => setTheme('dark')}
                        >
                          <Moon size={14} />
                          Dark
                        </Button>
                        <Button
                          variant={themePreference === 'system' ? 'primary' : 'secondary'}
                          size="sm"
                          className="flex-1 flex items-center justify-center gap-1.5 h-9 text-xs font-bold rounded-xl"
                          onClick={() => setTheme('system')}
                        >
                          <Monitor size={14} />
                          System
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-ink-secondary">
                        Brand Accent Color Presets
                      </Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {Object.values(ACCENT_PRESETS).map((preset) => {
                          const isActive = accentPreset === preset.key
                          return (
                            <button
                              key={preset.key}
                              type="button"
                              onClick={() => setAccentPreset(preset.key)}
                              className={cn(
                                'relative flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left text-xs font-medium transition-all duration-150 cursor-pointer hover:bg-surface-secondary/70',
                                isActive
                                  ? 'border-accent bg-accent-soft font-bold text-accent shadow-xs'
                                  : 'border-hairline bg-surface/60 text-ink-secondary',
                              )}
                            >
                              <span className="flex items-center gap-2">
                                <span
                                  className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10 shadow-xs"
                                  style={{ background: preset.accent }}
                                />
                                {preset.label}
                              </span>
                              {isActive && <Check size={13} className="text-accent" />}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {(settingsSubTab === 'exports' || settingsSubTab === 'visuals') && (
                <Card className="bg-surface/80 border border-hairline rounded-2xl shadow-sm backdrop-blur-md p-5">
                  <CardHeader className="p-0 mb-4">
                    <CardKicker>Data & Reports</CardKicker>
                    <CardTitle className="text-body font-bold text-ink">
                      Reports & Data Downloads
                    </CardTitle>
                    <CardDescription className="text-caption text-ink-secondary mt-1">
                      Export platform metrics, databases, and executive summaries
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 space-y-3">
                    {/* Analytics Summary Export Placeholder */}
                    <button
                      type="button"
                      onClick={handleDownloadAnalyticsCSV}
                      className="w-full text-left group p-3.5 bg-surface/60 hover:bg-surface-secondary/70 rounded-xl border border-hairline hover:border-accent/40 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between cursor-pointer"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-ink group-hover:text-accent transition-colors">
                            Analytics Summary Report
                          </h4>
                          <Badge className="text-[10px] py-0 px-1.5 font-mono border border-hairline bg-surface-secondary text-ink-secondary rounded-md">
                            CSV
                          </Badge>
                        </div>
                        <p className="text-caption text-ink-tertiary truncate mt-0.5">
                          Student completions, stage statistics, and drop-off rate counts.
                        </p>
                      </div>
                      <span className="inline-flex items-center justify-center gap-1 shrink-0 h-8 px-3 rounded-lg bg-accent text-white text-xs font-bold shadow-xs group-hover:scale-105 transition-transform [background-image:var(--accent-gradient)]">
                        <Download size={13} />
                        Export CSV
                      </span>
                    </button>

                    {/* Knowledge Base Export Placeholder */}
                    <button
                      type="button"
                      onClick={handleDownloadResourcesCSV}
                      className="w-full text-left group p-3.5 bg-surface/60 hover:bg-surface-secondary/70 rounded-xl border border-hairline hover:border-accent/40 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between cursor-pointer"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-ink group-hover:text-accent transition-colors">
                            Knowledge Base Resources
                          </h4>
                          <Badge className="text-[10px] py-0 px-1.5 font-mono border border-hairline bg-surface-secondary text-ink-secondary rounded-md">
                            CSV
                          </Badge>
                        </div>
                        <p className="text-caption text-ink-tertiary truncate mt-0.5">
                          Full list of all immigration fees, housing guidelines, and documents.
                        </p>
                      </div>
                      <span className="inline-flex items-center justify-center gap-1 shrink-0 h-8 px-3 rounded-lg bg-accent text-white text-xs font-bold shadow-xs group-hover:scale-105 transition-transform [background-image:var(--accent-gradient)]">
                        <Download size={13} />
                        Export CSV
                      </span>
                    </button>

                    {/* Registered Users Roster Export Placeholder */}
                    <button
                      type="button"
                      onClick={handleDownloadUsersCSV}
                      className="w-full text-left group p-3.5 bg-surface/60 hover:bg-surface-secondary/70 rounded-xl border border-hairline hover:border-accent/40 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between cursor-pointer"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-ink group-hover:text-accent transition-colors">
                            Registered Users Roster
                          </h4>
                          <Badge className="text-[10px] py-0 px-1.5 font-mono border border-hairline bg-surface-secondary text-ink-secondary rounded-md">
                            CSV
                          </Badge>
                        </div>
                        <p className="text-caption text-ink-tertiary truncate mt-0.5">
                          Student accounts, user roles, origin countries, and account statuses.
                        </p>
                      </div>
                      <span className="inline-flex items-center justify-center gap-1 shrink-0 h-8 px-3 rounded-lg bg-accent text-white text-xs font-bold shadow-xs group-hover:scale-105 transition-transform [background-image:var(--accent-gradient)]">
                        <Download size={13} />
                        Export CSV
                      </span>
                    </button>

                    {/* Bug & Feedback Reports Export Placeholder */}
                    <button
                      type="button"
                      onClick={handleDownloadReportsCSV}
                      className="w-full text-left group p-3.5 bg-surface/60 hover:bg-surface-secondary/70 rounded-xl border border-hairline hover:border-accent/40 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between cursor-pointer"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-ink group-hover:text-accent transition-colors">
                            Bug & Feedback Reports
                          </h4>
                          <Badge className="text-[10px] py-0 px-1.5 font-mono border border-hairline bg-surface-secondary text-ink-secondary rounded-md">
                            CSV
                          </Badge>
                        </div>
                        <p className="text-caption text-ink-tertiary truncate mt-0.5">
                          User feedback messages, status tags, admin notes, and submission URLs.
                        </p>
                      </div>
                      <span className="inline-flex items-center justify-center gap-1 shrink-0 h-8 px-3 rounded-lg bg-accent text-white text-xs font-bold shadow-xs group-hover:scale-105 transition-transform [background-image:var(--accent-gradient)]">
                        <Download size={13} />
                        Export CSV
                      </span>
                    </button>

                    {/* Universities Directory Export Placeholder */}
                    <button
                      type="button"
                      onClick={handleDownloadUniversitiesCSV}
                      className="w-full text-left group p-3.5 bg-surface/60 hover:bg-surface-secondary/70 rounded-xl border border-hairline hover:border-accent/40 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between cursor-pointer"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-ink group-hover:text-accent transition-colors">
                            Universities Directory
                          </h4>
                          <Badge className="text-[10px] py-0 px-1.5 font-mono border border-hairline bg-surface-secondary text-ink-secondary rounded-md">
                            CSV
                          </Badge>
                        </div>
                        <p className="text-caption text-ink-tertiary truncate mt-0.5">
                          UK university ranks, regions, tuition fee ranges, and portal URLs.
                        </p>
                      </div>
                      <span className="inline-flex items-center justify-center gap-1 shrink-0 h-8 px-3 rounded-lg bg-accent text-white text-xs font-bold shadow-xs group-hover:scale-105 transition-transform [background-image:var(--accent-gradient)]">
                        <Download size={13} />
                        Export CSV
                      </span>
                    </button>

                    {/* Complete JSON Database Backup Placeholder */}
                    <button
                      type="button"
                      onClick={handleDownloadFullBackupJSON}
                      className="w-full text-left group p-3.5 bg-accent-soft/30 hover:bg-accent-soft/50 rounded-xl border border-accent/30 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between cursor-pointer"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-accent group-hover:text-accent-hover transition-colors">
                            Full Database JSON Backup
                          </h4>
                          <Badge className="text-[10px] py-0 px-1.5 font-mono bg-accent text-white rounded-md">
                            JSON
                          </Badge>
                        </div>
                        <p className="text-caption text-ink-tertiary truncate mt-0.5">
                          Comprehensive system snapshot archive containing all platform datasets.
                        </p>
                      </div>
                      <span className="inline-flex items-center justify-center gap-1 shrink-0 h-8 px-3 rounded-lg bg-accent text-white text-xs font-bold shadow-xs sheen [background-image:var(--accent-gradient)] group-hover:scale-105 transition-transform">
                        <Download size={13} />
                        Backup JSON
                      </span>
                    </button>

                    <div className="pt-2">
                      <Button
                        variant="secondary"
                        className="w-full flex items-center justify-center gap-2 h-9 text-xs font-bold rounded-xl hover:bg-surface-secondary cursor-pointer"
                        onClick={() => window.print()}
                      >
                        <Printer size={14} />
                        Print Executive Summary Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
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

  // Interactive table + filter state
  const [tableSearch, setTableSearch] = useState('')
  const [tableCategory, setTableCategory] = useState('')
  const [costFilter, setCostFilter] = useState<'all' | 'free' | 'paid'>('all')
  const [deadlineFilter, setDeadlineFilter] = useState<'all' | 'timed' | 'untimed'>('all')
  const [sortField, setSortField] = useState<
    'title' | 'categoryKey' | 'costPence' | 'deadlineDaysBeforeIntake'
  >('title')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)

  const openAdd = () => {
    setForm(emptyForm)
    setError(null)
    setDrawerOpen(true)
  }

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
    setError(null)
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setForm(emptyForm)
    setError(null)
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
          setDrawerOpen(false)
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
    setSelectedIds((prev) => prev.filter((x) => x !== id))
  }

  // Filter + sort across search, category, cost and deadline facets.
  const filteredAndSortedResources = useMemo(() => {
    if (!resources) return []
    const q = tableSearch.toLowerCase()
    const list = resources.filter((r) => {
      const searchMatch = r.title.toLowerCase().includes(q) || r.summary.toLowerCase().includes(q)
      const categoryMatch = !tableCategory || r.categoryKey === tableCategory
      const isFree = r.costPence === null || r.costPence === 0
      const costMatch = costFilter === 'all' || (costFilter === 'free' ? isFree : !isFree)
      const isTimed = r.deadlineDaysBeforeIntake !== null
      const deadlineMatch =
        deadlineFilter === 'all' || (deadlineFilter === 'timed' ? isTimed : !isTimed)
      return searchMatch && categoryMatch && costMatch && deadlineMatch
    })

    const numeric = sortField === 'costPence' || sortField === 'deadlineDaysBeforeIntake'
    return [...list].sort((a, b) => {
      const valA: string | number = numeric
        ? ((a[sortField] as number | null) ?? -1)
        : String(a[sortField] ?? '').toLowerCase()
      const valB: string | number = numeric
        ? ((b[sortField] as number | null) ?? -1)
        : String(b[sortField] ?? '').toLowerCase()
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [resources, tableSearch, tableCategory, costFilter, deadlineFilter, sortField, sortOrder])

  const handleSort = (field: typeof sortField) => {
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

  const activeFilterCount =
    (tableCategory ? 1 : 0) + (costFilter !== 'all' ? 1 : 0) + (deadlineFilter !== 'all' ? 1 : 0)

  const clearFilters = () => {
    setTableSearch('')
    setTableCategory('')
    setCostFilter('all')
    setDeadlineFilter('all')
  }

  // Bulk selection over the currently visible (filtered) rows.
  const visibleIds = filteredAndSortedResources.map((r) => r.id)
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id))
  const toggleSelectAll = () => setSelectedIds(allVisibleSelected ? [] : visibleIds)
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  const bulkDelete = () => {
    const ids = [...selectedIds]
    for (const id of ids) deleteResource.mutate(id)
    setSelectedIds([])
    toast.success(`${ids.length} ${ids.length === 1 ? 'resource' : 'resources'} removed.`)
  }

  const categoryLabel = (key: string) => (categories ?? []).find((c) => c.key === key)?.label ?? key

  const renderSortIcon = (field: typeof sortField) =>
    sortField === field ? (
      sortOrder === 'asc' ? (
        <ChevronUp size={12} className="text-accent" />
      ) : (
        <ChevronDown size={12} className="text-accent" />
      )
    ) : (
      <ArrowUpDown size={11} className="text-ink-tertiary opacity-40" />
    )

  const fmtDeadline = (d: number | null) =>
    d === null ? null : `${Math.abs(d)}d ${d >= 0 ? 'before' : 'after'}`

  const costOptions = [
    { value: 'all', label: 'Any cost' },
    { value: 'free', label: 'Free' },
    { value: 'paid', label: 'Paid' },
  ] as const
  const deadlineOptions = [
    { value: 'all', label: 'Any timing' },
    { value: 'timed', label: 'Has deadline' },
    { value: 'untimed', label: 'No deadline' },
  ] as const

  const filterActive = tableSearch !== '' || activeFilterCount > 0

  return (
    <section>
      {/* Header: title, live count, add action */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-body-lg font-bold tracking-tight text-ink">Knowledge base</h2>
          <p className="text-caption text-ink-tertiary mt-0.5">
            Showing{' '}
            <span className="font-semibold text-ink-secondary tabular-nums">
              {filteredAndSortedResources.length}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-ink-secondary tabular-nums">
              {(resources ?? []).length}
            </span>{' '}
            official resources students see
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="sheen gap-1.5 text-white bg-accent-solid [background-image:var(--accent-gradient)] rounded-xl font-bold cursor-pointer"
        >
          <Plus size={15} />
          Add resource
        </Button>
      </div>

      {/* Toolbar: search plus category, cost and deadline facets */}
      <div className="mb-4 rounded-2xl border border-hairline bg-surface/80 p-3.5 backdrop-blur-md shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-xs">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary"
            />
            <Input
              className="pl-9 pr-14 text-body h-9 bg-surface/60 border-hairline rounded-xl focus-visible:ring-accent"
              placeholder="Search title or keyword..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
            />
            {tableSearch && (
              <button
                type="button"
                onClick={() => setTableSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-caption font-semibold text-accent hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-surface-secondary/60 p-1 rounded-xl border border-hairline">
              <BadgePoundSterling size={13} className="text-ink-tertiary ml-1.5 shrink-0" />
              {costOptions.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setCostFilter(o.value)}
                  className={cn(
                    'text-micro font-bold px-2.5 py-1 rounded-lg transition-colors duration-150 cursor-pointer',
                    costFilter === o.value
                      ? 'bg-surface text-ink shadow-xs'
                      : 'text-ink-secondary hover:text-ink',
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 bg-surface-secondary/60 p-1 rounded-xl border border-hairline">
              <CalendarClock size={13} className="text-ink-tertiary ml-1.5 shrink-0" />
              {deadlineOptions.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setDeadlineFilter(o.value)}
                  className={cn(
                    'text-micro font-bold px-2.5 py-1 rounded-lg transition-colors duration-150 cursor-pointer',
                    deadlineFilter === o.value
                      ? 'bg-surface text-ink shadow-xs'
                      : 'text-ink-secondary hover:text-ink',
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          <span className="text-caption font-semibold text-ink-secondary flex items-center gap-1 shrink-0">
            <Filter size={12} className="text-accent" />
            Category:
          </span>
          <div className="flex gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setTableCategory('')}
              className={cn(
                'text-micro font-bold px-3 py-1 rounded-lg border transition-all duration-150 cursor-pointer',
                !tableCategory
                  ? 'bg-accent-soft text-accent border-accent/30'
                  : 'text-ink-secondary border-hairline hover:text-ink hover:border-hairline-strong',
              )}
            >
              All
            </button>
            {(categories ?? []).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setTableCategory(cat.key)}
                className={cn(
                  'text-micro font-bold px-3 py-1 rounded-lg border transition-all duration-150 cursor-pointer whitespace-nowrap',
                  tableCategory === cat.key
                    ? 'bg-accent-soft text-accent border-accent/30'
                    : 'text-ink-secondary border-hairline hover:text-ink hover:border-hairline-strong',
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active filters summary */}
        {filterActive && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-hairline">
            <span className="text-micro uppercase tracking-wider font-bold text-ink-tertiary">
              Active:
            </span>
            {tableCategory && (
              <FilterChip
                label={categoryLabel(tableCategory)}
                onClear={() => setTableCategory('')}
              />
            )}
            {costFilter !== 'all' && (
              <FilterChip
                label={costOptions.find((o) => o.value === costFilter)?.label ?? ''}
                onClear={() => setCostFilter('all')}
              />
            )}
            {deadlineFilter !== 'all' && (
              <FilterChip
                label={deadlineOptions.find((o) => o.value === deadlineFilter)?.label ?? ''}
                onClear={() => setDeadlineFilter('all')}
              />
            )}
            {tableSearch && (
              <FilterChip label={`"${tableSearch}"`} onClear={() => setTableSearch('')} />
            )}
            <button
              type="button"
              onClick={clearFilters}
              className="text-caption font-semibold text-accent hover:underline cursor-pointer ml-auto"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Bulk selection bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent-soft px-4 py-2.5"
          >
            <span className="text-body font-semibold text-ink tabular-nums">
              {selectedIds.length} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-caption font-semibold text-ink-secondary hover:text-ink cursor-pointer"
              >
                Deselect
              </button>
              <Button
                variant="danger"
                size="sm"
                onClick={bulkDelete}
                disabled={deleteResource.isPending}
                className="gap-1.5 rounded-lg"
              >
                <Trash2 size={13} />
                Delete selected
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-width resource table */}
      <Card className="overflow-hidden bg-surface/80 border border-hairline rounded-2xl shadow-sm backdrop-blur-md">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-body border-collapse">
            <thead>
              <tr className="text-left text-caption font-bold uppercase tracking-[0.08em] text-ink-secondary bg-surface-secondary/80 border-b border-hairline">
                <th className="py-3 pl-5 pr-1 w-8">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all visible"
                    className="h-3.5 w-3.5 rounded accent-[color:var(--accent)] cursor-pointer align-middle"
                  />
                </th>
                <th className="py-3 pr-1 w-6" />
                <th className="py-3 px-3 font-bold select-none">
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-ink cursor-pointer"
                    onClick={() => handleSort('title')}
                  >
                    Title
                    {renderSortIcon('title')}
                  </button>
                </th>
                <th className="py-3 px-3 font-bold select-none">
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-ink cursor-pointer"
                    onClick={() => handleSort('categoryKey')}
                  >
                    Category
                    {renderSortIcon('categoryKey')}
                  </button>
                </th>
                <th className="py-3 px-3 font-bold text-right select-none">
                  <button
                    type="button"
                    className="flex items-center justify-end gap-1 ml-auto hover:text-ink cursor-pointer"
                    onClick={() => handleSort('costPence')}
                  >
                    Cost
                    {renderSortIcon('costPence')}
                  </button>
                </th>
                <th className="py-3 px-3 font-bold select-none hidden md:table-cell">
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-ink cursor-pointer"
                    onClick={() => handleSort('deadlineDaysBeforeIntake')}
                  >
                    Deadline
                    {renderSortIcon('deadlineDaysBeforeIntake')}
                  </button>
                </th>
                <th className="py-3 px-3 font-bold text-center hidden lg:table-cell">Source</th>
                <th className="py-3 pr-5 pl-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              <AnimatePresence initial={false}>
                {filteredAndSortedResources.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center text-caption text-ink-tertiary">
                      No resources match your search or filters.
                      {filterActive && (
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="block mx-auto mt-2 text-xs font-semibold text-accent hover:underline cursor-pointer"
                        >
                          Clear search and filters
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedResources.map((resource) => {
                    const isExpanded = expandedIds.includes(resource.id)
                    const isSelected = selectedIds.includes(resource.id)
                    const deadline = fmtDeadline(resource.deadlineDaysBeforeIntake)
                    return (
                      <React.Fragment key={resource.id}>
                        <motion.tr
                          layout
                          className={cn(
                            'transition-colors duration-150',
                            isSelected
                              ? 'bg-accent-soft/40'
                              : isExpanded
                                ? 'bg-surface-secondary/30'
                                : 'hover:bg-surface-secondary/50',
                          )}
                        >
                          <td className="py-3 pl-5 pr-1 w-8">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(resource.id)}
                              aria-label={`Select ${resource.title}`}
                              className="h-3.5 w-3.5 rounded accent-[color:var(--accent)] cursor-pointer align-middle"
                            />
                          </td>
                          <td className="py-3 pr-1 w-6">
                            <button
                              type="button"
                              onClick={() => toggleRowExpanded(resource.id)}
                              className="h-6 w-6 flex items-center justify-center rounded-lg text-ink-secondary hover:bg-surface-secondary hover:text-accent transition-colors duration-150 cursor-pointer"
                              aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                            >
                              <ChevronRight
                                size={13}
                                className={cn(
                                  'transition-transform duration-200',
                                  isExpanded && 'rotate-90 text-accent',
                                )}
                              />
                            </button>
                          </td>
                          <td className="py-3 px-3 font-bold text-ink max-w-[240px] truncate">
                            {resource.title}
                          </td>
                          <td className="py-3 px-3">
                            <Badge category={resource.categoryKey} />
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums font-medium">
                            {resource.costPence === null ? (
                              <span className="text-positive">Free</span>
                            ) : (
                              <span className="text-ink-secondary">
                                {formatGbp(resource.costPence)}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-ink-secondary tabular-nums hidden md:table-cell">
                            {deadline ?? (
                              <span className="text-ink-tertiary" aria-label="No deadline">
                                None
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center hidden lg:table-cell">
                            {resource.sourceUrl ? (
                              <a
                                href={safeExternalUrl(resource.sourceUrl)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-hairline text-ink-secondary hover:bg-accent-soft hover:text-accent hover:border-accent/30 transition-all duration-150"
                                aria-label={`Open source for ${resource.title}`}
                              >
                                <Link2 size={12} />
                              </a>
                            ) : (
                              <span className="text-ink-tertiary" aria-label="No source link">
                                None
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-5 pl-3 text-right whitespace-nowrap">
                            <span className="inline-flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => startEdit(resource)}
                                className="h-7 w-7 flex items-center justify-center rounded-lg border border-hairline text-ink-secondary hover:bg-accent-soft hover:text-accent hover:border-accent/30 transition-all duration-150 cursor-pointer"
                                aria-label={`Edit ${resource.title}`}
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDelete(resource.id)}
                                disabled={deleteResource.isPending}
                                className="h-7 w-7 flex items-center justify-center rounded-lg border border-hairline text-ink-secondary hover:bg-danger/10 hover:text-danger hover:border-danger/30 transition-all duration-150 cursor-pointer disabled:opacity-50"
                                aria-label={`Delete ${resource.title}`}
                              >
                                <Trash2 size={12} />
                              </button>
                            </span>
                          </td>
                        </motion.tr>
                        {isExpanded && (
                          <tr className="bg-surface-secondary/20 border-0">
                            <td colSpan={8} className="py-3 px-5 pl-14 border-0">
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 bg-surface border border-hairline rounded-xl shadow-xs space-y-3 mb-2 text-xs">
                                  <div className="flex flex-col gap-1">
                                    <p className="font-bold text-ink">Summary</p>
                                    <p className="text-ink-secondary leading-relaxed">
                                      {resource.summary}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap gap-x-5 gap-y-1.5 pt-2.5 border-t border-hairline text-micro text-ink-tertiary">
                                    <span>
                                      <strong className="text-ink-secondary">Deadline:</strong>{' '}
                                      {deadline ? `${deadline} intake` : 'None'}
                                    </span>
                                    {resource.sourceUrl && (
                                      <span className="flex items-center gap-1 min-w-0">
                                        <strong className="text-ink-secondary shrink-0">
                                          Source:
                                        </strong>{' '}
                                        <a
                                          href={safeExternalUrl(resource.sourceUrl)}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-accent hover:underline inline-flex items-center gap-0.5 font-semibold truncate"
                                        >
                                          <span className="truncate">{resource.sourceUrl}</span>
                                          <ExternalLink size={10} className="shrink-0" />
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

      {/* Slide-over drawer for add / edit */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close editor"
              onClick={closeDrawer}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-[color:var(--canvas)]/70 backdrop-blur-sm cursor-default"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="fixed right-0 top-0 z-50 flex h-full w-[min(30rem,100vw)] flex-col border-l border-hairline bg-surface shadow-2xl"
              aria-label={form.id ? 'Edit resource' : 'Add resource'}
            >
              <div className="flex items-start justify-between px-5 py-4 border-b border-hairline shrink-0">
                <div>
                  <h3 className="text-body-lg font-bold text-ink">
                    {form.id ? 'Edit resource' : 'Add resource'}
                  </h3>
                  <p className="text-caption text-ink-tertiary mt-0.5">
                    Every entry needs an official source URL and stays timestamped.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-ink-secondary hover:bg-surface-secondary hover:text-ink transition-colors cursor-pointer shrink-0"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                  <div>
                    <Label htmlFor="kb-title" className="text-xs font-semibold text-ink-secondary">
                      Title
                    </Label>
                    <Input
                      id="kb-title"
                      required
                      className="bg-surface/60 border-hairline rounded-xl focus-visible:ring-accent text-body mt-1"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="kb-summary"
                      className="text-xs font-semibold text-ink-secondary"
                    >
                      Summary
                    </Label>
                    <Textarea
                      id="kb-summary"
                      required
                      className="bg-surface/60 border-hairline rounded-xl focus-visible:ring-accent text-body mt-1 min-h-24"
                      value={form.summary}
                      onChange={(e) => setForm({ ...form, summary: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label
                        htmlFor="kb-category"
                        className="text-xs font-semibold text-ink-secondary"
                      >
                        Category
                      </Label>
                      <Select
                        id="kb-category"
                        className="bg-surface/60 border-hairline rounded-xl focus-visible:ring-accent text-body mt-1"
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
                      <Label htmlFor="kb-cost" className="text-xs font-semibold text-ink-secondary">
                        Cost (GBP)
                      </Label>
                      <Input
                        id="kb-cost"
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="Free"
                        className="bg-surface/60 border-hairline rounded-xl focus-visible:ring-accent text-body mt-1"
                        value={form.costGbp}
                        onChange={(e) => setForm({ ...form, costGbp: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label
                      htmlFor="kb-deadline"
                      className="text-xs font-semibold text-ink-secondary"
                    >
                      Days before intake (negative is after)
                    </Label>
                    <Input
                      id="kb-deadline"
                      type="number"
                      placeholder="Optional"
                      className="bg-surface/60 border-hairline rounded-xl focus-visible:ring-accent text-body mt-1"
                      value={form.deadlineDays}
                      onChange={(e) => setForm({ ...form, deadlineDays: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="kb-source" className="text-xs font-semibold text-ink-secondary">
                      Official source URL
                    </Label>
                    <Input
                      id="kb-source"
                      type="url"
                      required
                      className="bg-surface/60 border-hairline rounded-xl focus-visible:ring-accent text-body mt-1"
                      placeholder="https://www.gov.uk/..."
                      value={form.sourceUrl}
                      onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
                    />
                  </div>
                  {error && <p className="text-xs font-semibold text-danger">{error}</p>}
                </div>

                <div className="flex gap-2 px-5 py-4 border-t border-hairline shrink-0">
                  <Button
                    type="submit"
                    disabled={saveResource.isPending}
                    className="sheen flex-1 text-white bg-accent-solid [background-image:var(--accent-gradient)] rounded-xl font-bold h-9 shadow-md cursor-pointer"
                  >
                    {form.id ? 'Save changes' : 'Save resource'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={closeDrawer}
                    className="rounded-xl h-9"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </section>
  )
}

// Small removable chip used to display active filters above the KB table.
function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-accent/25 bg-accent-soft px-2.5 py-0.5 text-micro font-semibold text-accent">
      {label}
      <button
        type="button"
        onClick={onClear}
        aria-label={`Remove ${label} filter`}
        className="hover:text-ink cursor-pointer"
      >
        <X size={11} />
      </button>
    </span>
  )
}

function AdminNotesManager() {
  const { data: notes = [], isPending } = useAdminNotes()
  const createNote = useCreateAdminNote()
  const deleteNote = useDeleteAdminNote()

  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [newCategory, setNewCategory] = useState<'bug' | 'feature' | 'data' | 'general'>('general')
  const [newAuthor, setNewAuthor] = useState('')

  const boardRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!isPending && notes.length > 0 && boardRef.current) {
      Draggable.create(boardRef.current.querySelectorAll('.draggable-note-card'), {
        type: 'x,y',
        edgeResistance: 0.65,
        bounds: boardRef.current,
        inertia: true,
      })
    }
  }, [notes, isPending])

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newContent.trim()) return

    createNote.mutate(
      {
        title: newTitle,
        content: newContent,
        priority: newPriority,
        category: newCategory,
        author: newAuthor.trim() || 'Admin User',
      },
      {
        onSuccess: () => {
          setNewTitle('')
          setNewContent('')
          setNewPriority('medium')
          setNewCategory('general')
          setNewAuthor('')
          toast.success('Note added successfully.')
        },
        onError: (err) => {
          toast.error(apiErrorMessage(err, 'Failed to add note'))
        },
      },
    )
  }

  const handleDeleteNote = (id: string) => {
    deleteNote.mutate(id, {
      onSuccess: () => {
        toast.success('Note deleted.')
      },
      onError: (err) => {
        toast.error(apiErrorMessage(err, 'Failed to delete note'))
      },
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left side: Add Note Form */}
      <Card className="lg:col-span-1 h-fit bg-surface/80 border border-hairline rounded-2xl shadow-sm backdrop-blur-md p-5">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-body font-bold text-ink">Create Admin Note</CardTitle>
          <CardDescription className="text-caption text-ink-secondary mt-1">
            Flag bugs, data discrepancies, or leave instructions for other staff.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <form onSubmit={handleAddNote} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="note-title" className="text-xs font-semibold text-ink-secondary">
                Note Title
              </Label>
              <Input
                id="note-title"
                required
                className="bg-surface/60 border-hairline rounded-xl focus-visible:ring-accent text-body"
                placeholder="e.g. Update visa processing fee"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="note-priority" className="text-xs font-semibold text-ink-secondary">
                  Priority
                </Label>
                <Select
                  id="note-priority"
                  className="bg-surface/60 border-hairline rounded-xl focus-visible:ring-accent text-body"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as 'high' | 'medium' | 'low')}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="note-category" className="text-xs font-semibold text-ink-secondary">
                  Category
                </Label>
                <Select
                  id="note-category"
                  className="bg-surface/60 border-hairline rounded-xl focus-visible:ring-accent text-body"
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
              <Label htmlFor="note-author" className="text-xs font-semibold text-ink-secondary">
                Author / Flagged By
              </Label>
              <Input
                id="note-author"
                className="bg-surface/60 border-hairline rounded-xl focus-visible:ring-accent text-body"
                placeholder="e.g. Admin K"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="note-content" className="text-xs font-semibold text-ink-secondary">
                Note Details
              </Label>
              <Textarea
                id="note-content"
                required
                className="bg-surface/60 border-hairline rounded-xl focus-visible:ring-accent text-body"
                placeholder="Add context, screenshots links, or task instructions..."
                rows={4}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="sheen w-full flex items-center justify-center gap-1.5 h-9 mt-2 text-white bg-accent-solid [background-image:var(--accent-gradient)] rounded-xl font-bold shadow-md cursor-pointer"
            >
              <Plus size={14} />
              Add Note to Board
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Right side: Notes Board */}
      <div ref={boardRef} className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center bg-surface/50 border border-hairline px-4 py-2.5 rounded-xl backdrop-blur-md">
          <h2 className="text-body font-bold text-ink tracking-tight flex items-center gap-2">
            <Sparkles size={16} className="text-accent" />
            Interactive Board
          </h2>
          <span className="text-caption font-semibold text-accent bg-accent-soft px-2.5 py-0.5 rounded-full">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'} active
          </span>
        </div>

        {isPending ? (
          <div className="p-8 text-center bg-surface/80 border border-hairline rounded-2xl backdrop-blur-md">
            <p className="text-body text-ink-secondary font-medium">Loading admin board...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="p-8 text-center bg-surface/80 border border-hairline rounded-2xl backdrop-blur-md">
            <p className="text-body font-bold text-ink">The admin board is clear</p>
            <p className="text-caption text-ink-tertiary mt-1">No active notes or flags.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {notes.map((note) => (
              <div
                key={note.id}
                id={`note-${note.id}`}
                className="draggable-note-card bg-surface/80 border border-hairline rounded-2xl p-4.5 flex flex-col justify-between shadow-xs hover:border-accent/40 backdrop-blur-md transition-all duration-200 cursor-grab active:cursor-grabbing relative z-10"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span
                      className={cn(
                        'text-micro font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border',
                        note.priority === 'high' && 'bg-danger/10 text-danger border-danger/20',
                        note.priority === 'medium' &&
                          'bg-warning/10 text-warning border-warning/20',
                        note.priority === 'low' &&
                          'bg-surface-secondary text-ink-secondary border-hairline',
                      )}
                    >
                      {note.priority}
                    </span>
                    <span className="text-micro font-mono text-ink-tertiary uppercase tracking-wider bg-surface-secondary px-2 py-0.5 rounded-md">
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
                    <p className="font-mono">{new Date(note.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="h-7 px-3 rounded-lg border border-hairline text-ink-secondary hover:bg-danger/10 hover:text-danger hover:border-danger/30 transition-all duration-150 font-semibold cursor-pointer"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
