import { useGSAP } from '@gsap/react'
import type { LucideIcon } from 'lucide-react'
import {
  Bookmark,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  FileText,
  HeartPulse,
  Home,
  PlaneLanding,
  Stamp,
  Trash2,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { type ReactNode, useMemo, useRef } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { QueryError } from '../components/QueryError'
import { Card, CardContent, CardHeader, CardKicker } from '../components/ui/card'
import { CountUp } from '../components/ui/count-up'
import { Select } from '../components/ui/input'
import { ProgressBar, ProgressRing } from '../components/ui/progress'
import { CardSkeleton, Skeleton } from '../components/ui/skeleton'
import { hasNoJourney, useJourney } from '../hooks/useJourney'
import { useResources } from '../hooks/useResources'
import { daysLeftLabel, formatDate, formatGbp, formatHome } from '../lib/format'
import { ScrambleTextPlugin } from '../lib/gsap/ScrambleTextPlugin.js'
import { gsap } from '../lib/gsap/index.js'
import { useAuthStore } from '../store/authStore'
import { useBookmarkStore, useBookmarkedIds } from '../store/bookmarkStore'
import { usePreferencesStore } from '../store/preferencesStore'
import { toast } from '../store/toastStore'

gsap.registerPlugin(useGSAP, ScrambleTextPlugin)

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const dueSoonDays = usePreferencesStore((s) => s.dueSoonDays)
  const showHomeCurrency = usePreferencesStore((s) => s.showHomeCurrency)
  const reduceMotion = usePreferencesStore((s) => s.reduceMotion)
  const { data: overview, isPending, error, refetch, isRefetching } = useJourney()

  const greetingRef = useRef<HTMLHeadingElement>(null)
  const firstName = user?.fullName.split(' ')[0] ?? 'there'

  useGSAP(() => {
    if (isPending) return

    // Respect the user's reduce-motion choice and the OS setting: show the
    // greeting and tiles immediately, with no scramble or reveal.
    const reduce = reduceMotion || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (greetingRef.current) {
      if (reduce) {
        greetingRef.current.textContent = `Hello, ${firstName}`
      } else {
        gsap.to(greetingRef.current, {
          duration: 1.2,
          scrambleText: {
            text: `Hello, ${firstName}`,
            chars: '01',
            speed: 0.5,
          },
        })
      }
    }

    if (!reduce) {
      // Calm swift reveal per the design system motion spec (no overshoot).
      gsap.fromTo(
        '.dashboard-stat-tile',
        { opacity: 0, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power3.out',
          stagger: 0.06,
          delay: 0.1,
        },
      )
    }
  }, [firstName, isPending, reduceMotion])

  const resourceFilters = useMemo(
    () => ({ search: '', category: '', sort: 'title' as const, order: 'asc' as const }),
    [],
  )
  const { data: resources } = useResources(resourceFilters)
  const bookmarkedIds = useBookmarkedIds()
  const { toggleBookmark } = useBookmarkStore()
  const bookmarkedResources = (resources ?? []).filter((r) => bookmarkedIds.includes(r.id))
  const unbookmarkedResources = useMemo(() => {
    return (resources ?? []).filter((r) => !bookmarkedIds.includes(r.id))
  }, [resources, bookmarkedIds])

  const getTaskCategoryKey = (taskId: string) => {
    for (const stage of overview?.stages ?? []) {
      const task = stage.tasks.find((t) => t.id === taskId)
      if (task) return task.categoryKey
    }
    return null
  }

  if (error && hasNoJourney(error)) return <Navigate to="/onboarding" replace />

  if (isPending) {
    return (
      <div>
        <Skeleton className="h-7 w-56 mb-2" />
        <Skeleton className="h-3.5 w-80 mb-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {['a', 'b', 'c', 'd'].map((key) => (
            <div
              key={key}
              className="bg-surface rounded-lg border border-hairline shadow-md p-4 flex items-center gap-3 shimmer-host"
            >
              <Skeleton className="h-9 w-9 rounded-sm" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-2.5 w-20" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <CardSkeleton lines={3} />
          <CardSkeleton lines={3} />
          <CardSkeleton lines={4} />
          <CardSkeleton lines={4} />
        </div>
      </div>
    )
  }

  if (error || !overview) {
    return (
      <QueryError
        message="Your dashboard could not be loaded. Check your connection and try again."
        onRetry={() => refetch()}
        retrying={isRefetching}
      />
    )
  }

  const { budget, upcomingDeadlines, stages, percentComplete, journey } = overview
  const doneTotal = stages.reduce((sum, s) => sum + s.done, 0)
  const taskTotal = stages.reduce((sum, s) => sum + s.total, 0)
  const gaugePercent =
    budget.totalPence === 0 ? 0 : Math.min(100, (budget.spentPence / budget.totalPence) * 100)
  const daysToIntake = Math.ceil(
    (new Date(`${journey.intakeDate}T00:00:00Z`).getTime() - Date.now()) / 86_400_000,
  )
  const categoryIcons: Record<string, LucideIcon> = {
    visa: Stamp,
    health: HeartPulse,
    finance: Wallet,
    housing: Home,
    documents: FileText,
    arrival: PlaneLanding,
  }

  return (
    <div>
      <header className="mb-6">
        <h1 ref={greetingRef} className="text-title3 text-ink scramble-active">
          Hello, &nbsp;
        </h1>
        <p className="text-xs text-ink-secondary mt-1">
          {journey.courseLevel} intake on {formatDate(journey.intakeDate)}. Overview of your
          application roadmap status.
        </p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatTile
          icon={TrendingUp}
          value={<CountUp value={percentComplete} format={(n) => `${Math.round(n)}%`} />}
          label="Roadmap complete"
        />
        <StatTile
          icon={CheckCircle2}
          value={<CountUp value={doneTotal} format={(n) => `${Math.round(n)} of ${taskTotal}`} />}
          label="Tasks done"
        />
        <StatTile
          icon={Wallet}
          value={<CountUp value={budget.spentPence} format={(n) => formatGbp(n)} />}
          label="Spent so far"
        />
        <StatTile
          icon={CalendarClock}
          value={daysToIntake >= 0 ? <CountUp value={daysToIntake} /> : 'Arrived'}
          label={daysToIntake >= 0 ? 'Days to intake' : 'Intake passed'}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="card-lift">
          <CardHeader>
            <CardKicker>Journey completion</CardKicker>
          </CardHeader>
          <CardContent>
            <ProgressRing
              value={percentComplete}
              label={`${doneTotal} of ${taskTotal} tasks completed`}
            />
          </CardContent>
        </Card>

        <Card className="card-lift">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardKicker>Budget tracker</CardKicker>
            {budget.budgetPence > 0 && budget.overBudget && (
              <span className="bg-danger-soft border border-danger text-danger text-micro font-semibold uppercase tracking-[0.05em] px-1.5 py-0.5 rounded-xs">
                Over budget
              </span>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-baseline">
              <span className="text-title2 text-ink tabular-nums">
                <CountUp value={budget.spentPence} format={(n) => formatGbp(n)} />
              </span>
              <span className="text-xs text-ink-secondary ml-1.5">
                spent of {formatGbp(budget.totalPence)} total cost
              </span>
            </div>
            <div className="h-1.5 bg-surface-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${budget.overBudget ? 'bg-danger' : 'bg-accent'}`}
                style={{ width: `${gaugePercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-ink-secondary flex-wrap gap-1">
              <span>Still to pay: {formatGbp(budget.remainingPence)}</span>
              {showHomeCurrency && budget.spentHome !== null && budget.homeCurrencyCode && (
                <span className="font-medium">
                  Home: about {formatHome(budget.spentHome, budget.homeCurrencyCode)} spent
                </span>
              )}
            </div>
            <div className="flex justify-between text-xs text-ink-tertiary border-t border-hairline pt-3 flex-wrap gap-1">
              <span>
                Mandatory {formatGbp(budget.mandatoryPence)} plus optional{' '}
                {formatGbp(budget.optionalPence)}
              </span>
              {budget.budgetPence > 0 && <span>Your limit: {formatGbp(budget.budgetPence)}</span>}
            </div>
          </CardContent>
        </Card>

        <Card className="card-lift">
          <CardHeader>
            <CardKicker>Upcoming deadlines</CardKicker>
          </CardHeader>
          <CardContent>
            {upcomingDeadlines.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="No upcoming tasks"
                body="You do not have any deadlines approaching, so you are fully caught up for now."
              />
            ) : (
              <ul className="flex flex-col gap-2.5">
                {upcomingDeadlines.map((d) => (
                  <li
                    key={d.taskId}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-sm bg-canvas border border-hairline"
                  >
                    <div className="min-w-0">
                      <Link
                        to={`/journey#task-${d.taskId}`}
                        className="text-body font-semibold text-ink hover:text-accent hover:underline truncate block"
                      >
                        {d.title}
                      </Link>
                      <p className="text-caption text-ink-tertiary">
                        Target: {formatDate(d.targetDate)}
                      </p>
                      {(() => {
                        const catKey = getTaskCategoryKey(d.taskId)
                        if (!catKey) return null
                        return (
                          <Link
                            to={`/resources?category=${catKey}`}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline mt-1"
                          >
                            <ExternalLink size={10} />
                            View {catKey} resources
                          </Link>
                        )
                      })()}
                    </div>
                    <span
                      className={`text-micro font-semibold px-1.5 py-0.5 rounded-xs shrink-0 ${
                        d.daysLeft < 0
                          ? 'bg-danger-soft text-danger wiggle-warn cursor-default'
                          : d.daysLeft <= dueSoonDays
                            ? 'bg-warning-soft text-warning glow-pulse'
                            : 'bg-surface-secondary text-ink-secondary'
                      }`}
                    >
                      {daysLeftLabel(d.daysLeft)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="card-lift">
          <CardHeader>
            <CardKicker>Progress per stage</CardKicker>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {stages.map((s, index) => {
                const percent = s.total === 0 ? 0 : Math.round((s.done / s.total) * 100)
                return (
                  <div key={s.stage.id} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-medium text-ink-secondary">
                      <span>
                        {index + 1}. {s.stage.title}
                      </span>
                      <span className="tabular-nums">{percent}%</span>
                    </div>
                    <ProgressBar value={percent} />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 card-lift">
          <CardHeader className="flex flex-row items-center justify-between border-b border-hairline pb-3">
            <div>
              <CardKicker>Saved for reference</CardKicker>
              <h2 className="text-body font-bold text-ink flex items-center gap-1.5">
                <Bookmark size={15} className="text-accent" fill="currentColor" />
                Bookmarked Resources
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {unbookmarkedResources.length > 0 && (
                <Select
                  value=""
                  onChange={(e) => {
                    const id = e.target.value
                    if (id) {
                      toggleBookmark(id)
                      toast.success('Bookmark added!')
                    }
                  }}
                  className="text-xs h-8 px-2 py-1 w-[160px] bg-surface text-ink border-hairline-strong rounded-sm"
                >
                  <option value="">+ Bookmark resource</option>
                  {unbookmarkedResources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </Select>
              )}
              <span className="text-caption text-ink-tertiary shrink-0">
                {bookmarkedResources.length} saved
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {bookmarkedResources.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-caption text-ink-secondary">No bookmarks saved yet.</p>
                <Link
                  to="/resources"
                  className="text-caption text-accent font-semibold hover:underline mt-1 inline-block"
                >
                  Explore the Knowledge Tree &rarr;
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {bookmarkedResources.map((res) => {
                  const Icon = categoryIcons[res.categoryKey] ?? FileText
                  return (
                    <div
                      key={res.id}
                      className="p-3 bg-canvas border border-hairline rounded-sm flex items-start justify-between gap-3 group relative hover:border-hairline-strong transition-colors duration-100"
                    >
                      <div className="flex gap-2.5 min-w-0">
                        <span className="h-8 w-8 rounded-sm bg-surface border border-hairline text-ink-secondary flex items-center justify-center shrink-0">
                          <Icon size={14} />
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-xs font-semibold text-ink truncate pr-6">
                            {res.title}
                          </h3>
                          <p className="text-[11px] text-ink-secondary line-clamp-2 mt-0.5 leading-relaxed">
                            {res.summary}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-[10px] text-ink-tertiary">
                            <span className="capitalize">{res.categoryKey}</span>
                            <span>•</span>
                            <span className="font-bold text-positive">
                              {res.costPence !== null ? formatGbp(res.costPence) : 'No fee'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 items-end shrink-0">
                        <button
                          onClick={() => toggleBookmark(res.id)}
                          className="p-1 text-ink-tertiary hover:text-danger hover:bg-danger-soft rounded-xs border border-transparent hover:border-danger/10 transition-colors duration-100 cursor-pointer"
                          title="Remove bookmark"
                        >
                          <Trash2 size={12} />
                        </button>
                        <a
                          href={res.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-ink-tertiary hover:text-accent hover:bg-accent-soft rounded-xs border border-transparent hover:border-accent/10 transition-colors duration-100 mt-1"
                          title="View source"
                        >
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* Icon chip, big value, small label: the stat tile pattern from the
   tiled layout reference. */
function StatTile({
  icon: Icon,
  value,
  label,
}: { icon: LucideIcon; value: ReactNode; label: string }) {
  return (
    <Card className="dashboard-stat-tile card-lift p-4 flex items-center gap-3 cursor-default">
      <span className="h-9 w-9 shrink-0 rounded-sm bg-accent-soft text-accent flex items-center justify-center">
        <Icon size={17} />
      </span>
      <span className="min-w-0">
        <span className="block text-body-lg font-bold text-ink truncate tabular-nums">{value}</span>
        <span className="block text-caption text-ink-secondary">{label}</span>
      </span>
    </Card>
  )
}
