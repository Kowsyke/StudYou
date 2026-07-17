import { CheckCircle2 } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { QueryError } from '../components/QueryError'
import { Card, CardContent, CardHeader, CardKicker } from '../components/ui/card'
import { ProgressBar, ProgressRing } from '../components/ui/progress'
import { CardSkeleton, Skeleton } from '../components/ui/skeleton'
import { hasNoJourney, useJourney } from '../hooks/useJourney'
import { daysLeftLabel, formatDate, formatGbp, formatHome } from '../lib/format'
import { useAuthStore } from '../store/authStore'

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { data: overview, isPending, error, refetch, isRefetching } = useJourney()

  if (error && hasNoJourney(error)) return <Navigate to="/onboarding" replace />

  if (isPending) {
    return (
      <div>
        <Skeleton className="h-7 w-56 mb-2" />
        <Skeleton className="h-3.5 w-80 mb-6" />
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
  const firstName = user?.fullName.split(' ')[0] ?? 'there'
  const gaugePercent =
    budget.totalPence === 0 ? 0 : Math.min(100, (budget.spentPence / budget.totalPence) * 100)

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-title3 text-ink">Hello, {firstName}</h1>
        <p className="text-xs text-ink-secondary mt-1">
          {journey.courseLevel} intake on {formatDate(journey.intakeDate)}. Overview of your
          application roadmap status.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
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

        <Card>
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
              <span className="text-title2 text-ink">{formatGbp(budget.spentPence)}</span>
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
              {budget.spentHome !== null && budget.homeCurrencyCode && (
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

        <Card>
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
                      <p className="text-body font-semibold text-ink truncate">{d.title}</p>
                      <p className="text-caption text-ink-tertiary">
                        Target: {formatDate(d.targetDate)}
                      </p>
                    </div>
                    <span
                      className={`text-micro font-semibold px-1.5 py-0.5 rounded-xs shrink-0 ${
                        d.daysLeft < 0
                          ? 'bg-danger-soft text-danger'
                          : d.daysLeft <= 14
                            ? 'bg-warning-soft text-warning'
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

        <Card>
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
      </div>
    </div>
  )
}
