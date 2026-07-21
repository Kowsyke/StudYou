import { useGSAP } from '@gsap/react'
import type { CategoryKey, Resource } from '@studyou/types'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Download,
  ExternalLink,
  Filter,
  Monitor,
  Moon,
  Palette,
  Pencil,
  Plus,
  Printer,
  Search,
  Sun,
  Trash2,
} from 'lucide-react'
import React, { type FormEvent, useMemo, useState, useEffect, useRef } from 'react'
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
import { formatGbp } from '../lib/format'
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
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
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
                          'relative inline-flex rounded-full h-2.5 w-2.5 glow-pulse',
                          analytics.activeUsers > 0 ? 'bg-positive' : 'bg-ink-muted',
                        )}
                      />
                    </span>
                    <p className="text-title3 font-bold text-ink tabular-nums">
                      <CountUp value={analytics.activeUsers} />
                    </p>
                  </div>
                  <p className="text-micro text-ink-tertiary mt-1">Seen in the last 5 minutes</p>
                </div>
                <div className="relative overflow-hidden bg-surface border border-hairline rounded-md p-4 flex flex-col justify-between shadow-xs min-h-[82px]">
                  <p className="text-caption font-semibold uppercase tracking-[0.05em] text-ink-secondary">
                    Active today
                  </p>
                  <p className="text-title3 font-bold text-ink mt-1 tabular-nums">
                    <CountUp value={analytics.activeToday} />
                  </p>
                  <p className="text-micro text-ink-tertiary mt-1">Seen in the last 24 hours</p>
                </div>
                <StatTile label="Total users" value={analytics.totalUsers} />
                <StatTile label="New this week" value={analytics.newThisWeek} />
                <StatTile label="Suspended" value={analytics.suspendedUsers} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
                <StatTile label="Students" value={analytics.totalStudents} />
                <StatTile label="Active journeys" value={analytics.totalJourneys} />
                <StatTile
                  label="Average completion"
                  value={analytics.averageCompletion}
                  format={(n) => `${Math.round(n)}%`}
                />
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
                          radius={[4, 4, 0, 0]}
                          barSize={28}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

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
            <div className="md:col-span-4 lg:col-span-3 bg-surface border border-hairline rounded-xl p-2 space-y-1 shadow-xs sticky top-20">
              <div className="px-3 py-2 text-caption font-semibold uppercase tracking-wider text-accent">
                Admin Settings
              </div>
              <button
                type="button"
                onClick={() => setSettingsSubTab('visuals')}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-sm font-medium transition-all duration-150 cursor-pointer text-left',
                  settingsSubTab === 'visuals'
                    ? 'bg-accent-soft border border-accent/20 text-accent font-bold shadow-xs'
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
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-sm font-medium transition-all duration-150 cursor-pointer text-left',
                  settingsSubTab === 'exports'
                    ? 'bg-accent-soft border border-accent/20 text-accent font-bold shadow-xs'
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
                <Card className="card-lift border-hairline shadow-sm">
                  <CardHeader>
                    <CardKicker>Visual Settings</CardKicker>
                    <CardTitle className="text-body font-semibold">Theme & Colors</CardTitle>
                    <CardDescription>
                      Customize the application aesthetics and brand accents
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-ink-secondary">Theme Mode</Label>
                      <div className="flex gap-2">
                        <Button
                          variant={themePreference === 'light' ? 'primary' : 'secondary'}
                          size="sm"
                          className="flex-1 flex items-center justify-center gap-1.5 h-8 text-xs font-medium"
                          onClick={() => setTheme('light')}
                        >
                          <Sun size={14} />
                          Light
                        </Button>
                        <Button
                          variant={themePreference === 'dark' ? 'primary' : 'secondary'}
                          size="sm"
                          className="flex-1 flex items-center justify-center gap-1.5 h-8 text-xs font-medium"
                          onClick={() => setTheme('dark')}
                        >
                          <Moon size={14} />
                          Dark
                        </Button>
                        <Button
                          variant={themePreference === 'system' ? 'primary' : 'secondary'}
                          size="sm"
                          className="flex-1 flex items-center justify-center gap-1.5 h-8 text-xs font-medium"
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
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.values(ACCENT_PRESETS).map((preset) => {
                          const isActive = accentPreset === preset.key
                          return (
                            <button
                              key={preset.key}
                              type="button"
                              onClick={() => setAccentPreset(preset.key)}
                              className={cn(
                                'relative flex items-center justify-between px-3 py-2 rounded-md border text-left text-xs transition-all duration-150 cursor-pointer hover:bg-surface-secondary',
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
                              {isActive && <Check size={12} className="text-accent" />}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {(settingsSubTab === 'exports' || settingsSubTab === 'visuals') && (
                <Card className="card-lift border-hairline shadow-sm">
                  <CardHeader>
                    <CardKicker>Data & Reports</CardKicker>
                    <CardTitle className="text-body font-semibold">
                      Reports & Data Downloads
                    </CardTitle>
                    <CardDescription>
                      Export platform metrics, databases, and executive summaries
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Analytics Summary Export Placeholder */}
                    <button
                      type="button"
                      onClick={handleDownloadAnalyticsCSV}
                      className="w-full text-left group p-3.5 bg-surface hover:bg-surface-secondary/50 rounded-lg border border-hairline hover:border-accent/40 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between cursor-pointer"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-ink group-hover:text-accent transition-colors">
                            Analytics Summary Report
                          </h4>
                          <Badge className="text-[10px] py-0 px-1.5 font-mono border border-hairline bg-surface-secondary text-ink-secondary">
                            CSV
                          </Badge>
                        </div>
                        <p className="text-caption text-ink-tertiary truncate mt-0.5">
                          Student completions, stage statistics, and drop-off rate counts.
                        </p>
                      </div>
                      <span className="inline-flex items-center justify-center gap-1 shrink-0 h-8 px-3 rounded-md bg-accent text-white text-xs font-medium shadow-xs group-hover:scale-105 transition-transform">
                        <Download size={13} />
                        Export CSV
                      </span>
                    </button>

                    {/* Knowledge Base Export Placeholder */}
                    <button
                      type="button"
                      onClick={handleDownloadResourcesCSV}
                      className="w-full text-left group p-3.5 bg-surface hover:bg-surface-secondary/50 rounded-lg border border-hairline hover:border-accent/40 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between cursor-pointer"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-ink group-hover:text-accent transition-colors">
                            Knowledge Base Resources
                          </h4>
                          <Badge className="text-[10px] py-0 px-1.5 font-mono border border-hairline bg-surface-secondary text-ink-secondary">
                            CSV
                          </Badge>
                        </div>
                        <p className="text-caption text-ink-tertiary truncate mt-0.5">
                          Full list of all immigration fees, housing guidelines, and documents.
                        </p>
                      </div>
                      <span className="inline-flex items-center justify-center gap-1 shrink-0 h-8 px-3 rounded-md bg-accent text-white text-xs font-medium shadow-xs group-hover:scale-105 transition-transform">
                        <Download size={13} />
                        Export CSV
                      </span>
                    </button>

                    {/* Registered Users Roster Export Placeholder */}
                    <button
                      type="button"
                      onClick={handleDownloadUsersCSV}
                      className="w-full text-left group p-3.5 bg-surface hover:bg-surface-secondary/50 rounded-lg border border-hairline hover:border-accent/40 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between cursor-pointer"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-ink group-hover:text-accent transition-colors">
                            Registered Users Roster
                          </h4>
                          <Badge className="text-[10px] py-0 px-1.5 font-mono border border-hairline bg-surface-secondary text-ink-secondary">
                            CSV
                          </Badge>
                        </div>
                        <p className="text-caption text-ink-tertiary truncate mt-0.5">
                          Student accounts, user roles, origin countries, and account statuses.
                        </p>
                      </div>
                      <span className="inline-flex items-center justify-center gap-1 shrink-0 h-8 px-3 rounded-md bg-accent text-white text-xs font-medium shadow-xs group-hover:scale-105 transition-transform">
                        <Download size={13} />
                        Export CSV
                      </span>
                    </button>

                    {/* Bug & Feedback Reports Export Placeholder */}
                    <button
                      type="button"
                      onClick={handleDownloadReportsCSV}
                      className="w-full text-left group p-3.5 bg-surface hover:bg-surface-secondary/50 rounded-lg border border-hairline hover:border-accent/40 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between cursor-pointer"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-ink group-hover:text-accent transition-colors">
                            Bug & Feedback Reports
                          </h4>
                          <Badge className="text-[10px] py-0 px-1.5 font-mono border border-hairline bg-surface-secondary text-ink-secondary">
                            CSV
                          </Badge>
                        </div>
                        <p className="text-caption text-ink-tertiary truncate mt-0.5">
                          User feedback messages, status tags, admin notes, and submission URLs.
                        </p>
                      </div>
                      <span className="inline-flex items-center justify-center gap-1 shrink-0 h-8 px-3 rounded-md bg-accent text-white text-xs font-medium shadow-xs group-hover:scale-105 transition-transform">
                        <Download size={13} />
                        Export CSV
                      </span>
                    </button>

                    {/* Universities Directory Export Placeholder */}
                    <button
                      type="button"
                      onClick={handleDownloadUniversitiesCSV}
                      className="w-full text-left group p-3.5 bg-surface hover:bg-surface-secondary/50 rounded-lg border border-hairline hover:border-accent/40 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between cursor-pointer"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-ink group-hover:text-accent transition-colors">
                            Universities Directory
                          </h4>
                          <Badge className="text-[10px] py-0 px-1.5 font-mono border border-hairline bg-surface-secondary text-ink-secondary">
                            CSV
                          </Badge>
                        </div>
                        <p className="text-caption text-ink-tertiary truncate mt-0.5">
                          UK university ranks, regions, tuition fee ranges, and portal URLs.
                        </p>
                      </div>
                      <span className="inline-flex items-center justify-center gap-1 shrink-0 h-8 px-3 rounded-md bg-accent text-white text-xs font-medium shadow-xs group-hover:scale-105 transition-transform">
                        <Download size={13} />
                        Export CSV
                      </span>
                    </button>

                    {/* Complete JSON Database Backup Placeholder */}
                    <button
                      type="button"
                      onClick={handleDownloadFullBackupJSON}
                      className="w-full text-left group p-3.5 bg-accent-soft/30 hover:bg-accent-soft/50 rounded-lg border border-accent/30 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between cursor-pointer"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-accent group-hover:text-accent-hover transition-colors">
                            Full Database JSON Backup
                          </h4>
                          <Badge className="text-[10px] py-0 px-1.5 font-mono bg-accent text-white">
                            JSON
                          </Badge>
                        </div>
                        <p className="text-caption text-ink-tertiary truncate mt-0.5">
                          Comprehensive system snapshot archive containing all platform datasets.
                        </p>
                      </div>
                      <span className="inline-flex items-center justify-center gap-1 shrink-0 h-8 px-3 rounded-md bg-accent text-white text-xs font-medium shadow-xs sheen [background-image:var(--accent-gradient)] group-hover:scale-105 transition-transform">
                        <Download size={13} />
                        Backup JSON
                      </span>
                    </button>

                    <div className="pt-2">
                      <Button
                        variant="secondary"
                        className="w-full flex items-center justify-center gap-2 h-9 text-xs font-semibold hover:bg-surface-secondary cursor-pointer"
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

function StatTile({
  label,
  value,
  format,
}: { label: string; value: number; format?: (n: number) => string }) {
  return (
    <Card className="p-4 flex flex-col gap-1">
      <p className="text-caption font-semibold uppercase tracking-[0.05em] text-ink-secondary">
        {label}
      </p>
      <p className="text-[22px] leading-tight font-bold text-ink tabular-nums">
        <CountUp value={value} format={format} />
      </p>
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
      <div className="mb-4">
        <h2 className="text-body-lg font-semibold tracking-tight">Knowledge base</h2>
        <p className="text-caption text-ink-tertiary mt-0.5">
          Showing {filteredAndSortedResources.length} of {(resources ?? []).length} entries. Add,
          edit and organize the resources students see.
        </p>
      </div>

      {/* Dedicated, organized toolbar above the table and the add resource form:
          search on the left, category filter on the right. */}
      <div className="mb-4 rounded-lg border border-hairline bg-surface-secondary/40 p-3 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <div className="relative w-full lg:w-72">
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

        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-caption text-ink-secondary flex items-center gap-1 shrink-0">
            <Filter size={11} />
            Filter:
          </span>
          <div className="flex gap-0.5 bg-surface p-0.5 rounded-sm border border-hairline shrink-0">
            <button
              onClick={() => setTableCategory('')}
              className={cn(
                'text-micro font-semibold px-2 py-0.5 rounded-xs transition-colors duration-[120ms]',
                !tableCategory
                  ? 'bg-surface-secondary text-ink shadow-xs'
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
                    ? 'bg-surface-secondary text-ink shadow-xs'
                    : 'text-ink-secondary hover:text-ink',
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
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
      <div ref={boardRef} className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-body-lg font-semibold tracking-tight">Interactive Board</h2>
          <span className="text-caption text-ink-tertiary">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'} active
          </span>
        </div>

        {isPending ? (
          <div className="p-8 text-center bg-surface border border-hairline rounded-md">
            <p className="text-body text-ink-secondary">Loading admin board...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="p-8 text-center bg-surface border border-hairline rounded-md">
            <p className="text-body text-ink-secondary">The admin board is clear.</p>
            <p className="text-caption text-ink-tertiary mt-1">No active notes or flags.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {notes.map((note) => (
              <div
                key={note.id}
                id={`note-${note.id}`}
                className="draggable-note-card bg-surface border border-hairline rounded-md p-4 flex flex-col justify-between shadow-xs transition-shadow duration-[120ms] hover:shadow-sm cursor-grab active:cursor-grabbing relative z-10"
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
