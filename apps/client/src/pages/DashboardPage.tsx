import { CalendarClock, CheckCircle2, Wallet } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { QueryError } from '../components/QueryError'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
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
        <Skeleton className="h-8 w-56 mb-2" />
        <Skeleton className="h-4 w-80 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardSkeleton lines={6} />
          <div className="md:col-span-2 space-y-4">
            <CardSkeleton lines={3} />
            <CardSkeleton lines={4} />
          </div>
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

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Hello, {firstName}</h1>
        <p className="text-sm text-ink-secondary mt-1">
          {journey.courseLevel} intake on {formatDate(journey.intakeDate)}. Here is where you stand.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:row-span-2">
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-5">
            <ProgressRing value={percentComplete} label={`${doneTotal} of ${taskTotal} tasks`} />
            <div className="w-full space-y-3">
              {stages.map((s) => (
                <div key={s.stage.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-ink-secondary">{s.stage.title}</span>
                    <span className="text-ink-muted tabular-nums">
                      {s.done}/{s.total}
                    </span>
                  </div>
                  <ProgressBar value={s.total === 0 ? 0 : (s.done / s.total) * 100} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center gap-2">
            <Wallet size={16} className="text-ink-muted" />
            <CardTitle>Budget tracker</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-ink-muted">True total cost</p>
                <p className="text-xl font-semibold tracking-tight mt-0.5">
                  {formatGbp(budget.totalPence)}
                </p>
                {budget.totalHome !== null && budget.homeCurrencyCode && (
                  <p className="text-xs text-ink-muted mt-0.5">
                    about {formatHome(budget.totalHome, budget.homeCurrencyCode)}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-ink-muted">Spent so far</p>
                <p className="text-xl font-semibold tracking-tight mt-0.5">
                  {formatGbp(budget.spentPence)}
                </p>
                {budget.spentHome !== null && budget.homeCurrencyCode && (
                  <p className="text-xs text-ink-muted mt-0.5">
                    about {formatHome(budget.spentHome, budget.homeCurrencyCode)}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-ink-muted">Still to pay</p>
                <p className="text-xl font-semibold tracking-tight mt-0.5">
                  {formatGbp(budget.remainingPence)}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-hairline flex items-center justify-between text-sm">
              <span className="text-ink-secondary">
                Mandatory {formatGbp(budget.mandatoryPence)} plus optional{' '}
                {formatGbp(budget.optionalPence)}
              </span>
              {budget.budgetPence > 0 && (
                <span
                  className={
                    budget.overBudget ? 'text-danger font-medium' : 'text-positive font-medium'
                  }
                >
                  {budget.overBudget ? 'Over' : 'Within'} your {formatGbp(budget.budgetPence)}{' '}
                  budget
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center gap-2">
            <CalendarClock size={16} className="text-ink-muted" />
            <CardTitle>Upcoming deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingDeadlines.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="No upcoming tasks"
                body="You do not have any deadlines approaching, so you are fully caught up for now."
              />
            ) : (
              <ul className="divide-y divide-black/5">
                {upcomingDeadlines.map((d) => (
                  <li key={d.taskId} className="flex items-center justify-between py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{d.title}</p>
                      <p className="text-xs text-ink-muted">{formatDate(d.targetDate)}</p>
                    </div>
                    <Badge
                      className={
                        d.daysLeft < 0
                          ? 'bg-danger-soft text-danger'
                          : d.daysLeft <= 14
                            ? 'bg-[#fdf3e3] text-[#8a5a00]'
                            : undefined
                      }
                    >
                      {daysLeftLabel(d.daysLeft)}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
