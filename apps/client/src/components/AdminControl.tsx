import type { AdminUser, BugReport, ReportStatus } from '@studyou/types'
import {
  Ban,
  Bug,
  CircleCheck,
  CircleDot,
  Clock,
  ExternalLink,
  Inbox,
  Mail,
  MessageSquare,
  Search,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'
import { useAdminReports, useAdminUsers, useSetSuspended, useUpdateReport } from '../hooks/useAdmin'
import { formatDate } from '../lib/format'
import { cn } from '../lib/utils'
import { useAuthStore } from '../store/authStore'
import { toast } from '../store/toastStore'
import { QueryError } from './QueryError'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { CardSkeleton } from './ui/skeleton'

/* Full account control: every user with journey progress, open report
   count, and a suspend or reinstate action enforced by the API. */
export function UsersPanel() {
  const me = useAuthStore((s) => s.user)
  const { data: users, isPending, error, refetch, isRefetching } = useAdminUsers(true)
  const setSuspended = useSetSuspended()
  const [search, setSearch] = useState('')

  if (isPending) {
    return (
      <div className="space-y-3">
        <CardSkeleton lines={5} />
      </div>
    )
  }
  if (error) {
    return (
      <QueryError
        message="Users could not be loaded. Check your connection and try again."
        onRetry={() => refetch()}
        retrying={isRefetching}
      />
    )
  }

  const filtered = (users ?? []).filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.fullName.toLowerCase().includes(search.toLowerCase()),
  )

  const onToggle = (u: AdminUser) => {
    setSuspended.mutate(
      { id: u.id, suspended: !u.suspended },
      {
        onSuccess: () =>
          toast.success(u.suspended ? `${u.fullName} reinstated.` : `${u.fullName} suspended.`),
        onError: () => toast.error('Something went wrong. Try again.'),
      },
    )
  }

  return (
    <section aria-label="User accounts" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div className="relative flex-1 min-w-52 max-w-96">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary"
          />
          <Input
            className="pl-9 bg-surface/60 border-hairline backdrop-blur-md rounded-xl text-body focus-visible:ring-accent"
            placeholder="Search student or admin name / email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 text-caption text-ink-secondary bg-surface/50 border border-hairline px-3 py-1.5 rounded-full backdrop-blur-md">
          <UserRound size={13} className="text-accent" />
          <span className="tabular-nums font-semibold text-ink">{filtered.length}</span> of{' '}
          <span className="tabular-nums font-semibold text-ink">{(users ?? []).length}</span>{' '}
          accounts
        </div>
      </div>

      <div className="bg-surface/80 border border-hairline rounded-2xl shadow-sm overflow-hidden backdrop-blur-md">
        <table className="w-full text-body">
          <thead>
            <tr className="text-left text-caption font-semibold uppercase tracking-[0.08em] text-ink-secondary bg-surface-secondary/80 border-b border-hairline">
              <th className="py-3.5 px-5 font-bold">Account</th>
              <th className="py-3.5 pr-4 font-bold">Role</th>
              <th className="py-3.5 pr-4 font-bold text-center">Progress</th>
              <th className="py-3.5 pr-4 font-bold text-center">Open Reports</th>
              <th className="py-3.5 pr-4 font-bold">Joined</th>
              <th className="py-3.5 pr-5 font-bold text-right">Status & Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {filtered.map((u) => (
              <tr
                key={u.id}
                className="hover:bg-surface-secondary/50 transition-colors duration-150"
              >
                <td className="py-3 px-5 pr-4">
                  <p className="font-bold text-ink">{u.fullName}</p>
                  <p className="text-caption text-ink-tertiary">{u.email}</p>
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 text-micro font-bold uppercase tracking-[0.08em] px-2.5 py-1 rounded-full border',
                      u.role === 'admin'
                        ? 'bg-[color:var(--category-housing)]/12 text-[color:var(--category-housing)] border-[color:var(--category-housing)]/25'
                        : 'bg-accent-soft text-accent border-accent/20',
                    )}
                  >
                    {u.role === 'admin' ? <ShieldCheck size={11} /> : <UserRound size={11} />}
                    {u.role}
                  </span>
                </td>
                <td className="py-3 pr-4 text-center tabular-nums">
                  {u.percentComplete === null ? (
                    <span className="text-caption text-ink-tertiary">No journey</span>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-surface-secondary rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-accent-solid h-full rounded-full [background-image:var(--accent-gradient)]"
                          style={{ width: `${u.percentComplete}%` }}
                        />
                      </div>
                      <span className="text-caption font-bold text-ink">{u.percentComplete}%</span>
                    </div>
                  )}
                </td>
                <td className="py-3 pr-4 text-center tabular-nums">
                  {u.openReports > 0 ? (
                    <span className="inline-flex items-center gap-1 text-micro font-bold bg-danger/10 text-danger border border-danger/20 px-2 py-0.5 rounded-full">
                      {u.openReports} open
                    </span>
                  ) : (
                    <span className="text-caption text-ink-tertiary">0</span>
                  )}
                </td>
                <td className="py-3 pr-4 text-caption text-ink-tertiary">
                  {formatDate(u.createdAt)}
                </td>
                <td className="py-3 pr-5 text-right">
                  {u.id === me?.id ? (
                    <span className="text-caption font-semibold text-accent bg-accent-soft px-2.5 py-1 rounded-full">
                      You (Admin)
                    </span>
                  ) : (
                    <Button
                      variant={u.suspended ? 'secondary' : 'danger'}
                      size="sm"
                      disabled={setSuspended.isPending}
                      onClick={() => onToggle(u)}
                      className="gap-1.5 h-8 text-xs font-semibold rounded-lg"
                    >
                      <Ban size={12} />
                      {u.suspended ? 'Reinstate' : 'Suspend'}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

const statusStyles: Record<ReportStatus, string> = {
  open: 'bg-danger/20 text-danger border-danger/30',
  in_progress: 'bg-warning/20 text-warning border-warning/30',
  resolved: 'bg-positive/20 text-positive border-positive/30',
}

const statusLabels: Record<ReportStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
}

// Soft tinted avatar chips cycling through the semantic palette, so each
// reporter reads distinctly without any raw Tailwind color scales.
const avatarColors = [
  'bg-accent-soft text-accent',
  'bg-[color:var(--category-housing)]/15 text-[color:var(--category-housing)]',
  'bg-[color:var(--category-arrival)]/15 text-[color:var(--category-arrival)]',
  'bg-positive/15 text-positive',
  'bg-warning/15 text-warning',
]

/* Live support chat style bug report and feedback queue */
export function ReportsPanel() {
  const { data: reports, isPending, error, refetch, isRefetching } = useAdminReports(true)
  const updateReport = useUpdateReport()
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all')

  if (isPending) {
    return (
      <div className="space-y-3">
        <CardSkeleton lines={4} />
      </div>
    )
  }
  if (error) {
    return (
      <QueryError
        message="Reports could not be loaded. Check your connection and try again."
        onRetry={() => refetch()}
        retrying={isRefetching}
      />
    )
  }

  const filtered = (reports ?? []).filter(
    (r) => statusFilter === 'all' || r.status === statusFilter,
  )

  const setStatus = (report: BugReport, status: ReportStatus) => {
    updateReport.mutate(
      { id: report.id, status },
      {
        onSuccess: () => toast.success(`Report marked ${statusLabels[status].toLowerCase()}.`),
        onError: () => toast.error('Something went wrong. Try again.'),
      },
    )
  }

  const getMailtoLink = (report: BugReport) => {
    const subject = encodeURIComponent(`Re: [StudYou Support] Bug Report: ${report.category}`)
    const body = encodeURIComponent(
      `Hi ${report.userName || 'Student'},\n\nThank you for submitting a report regarding:\n"${report.message}"\n\nOur team has reviewed your report and...`,
    )
    return `mailto:${report.userEmail ?? ''}?subject=${subject}&body=${body}`
  }

  return (
    <section aria-label="Bug reports stream" className="space-y-4">
      {/* Filter Tabs */}
      <fieldset className="flex flex-wrap gap-1.5 border-0" aria-label="Filter by status">
        {(['all', 'open', 'in_progress', 'resolved'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatusFilter(value)}
            aria-pressed={statusFilter === value}
            className={cn(
              'text-xs font-medium px-3.5 py-1.5 rounded-full border transition-all duration-150 cursor-pointer',
              statusFilter === value
                ? 'bg-accent-solid border-transparent text-white shadow-sm [background-image:var(--accent-gradient)]'
                : 'bg-surface border-hairline-strong text-ink-secondary hover:bg-surface-secondary hover:text-ink',
            )}
          >
            {value === 'all' ? `All Reports (${(reports ?? []).length})` : statusLabels[value]}
          </button>
        ))}
      </fieldset>

      {/* Support feed window, themed with the app's surface tokens. */}
      <div className="bg-surface/80 border border-hairline rounded-2xl overflow-hidden shadow-sm backdrop-blur-md">
        <div className="bg-surface-secondary/80 px-4 py-3 border-b border-hairline flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent-soft text-accent flex items-center justify-center">
              <MessageSquare size={16} />
            </div>
            <div>
              <h3 className="text-body font-bold text-ink flex items-center gap-2">
                Live support feed
                <span className="w-2 h-2 rounded-full bg-positive animate-pulse" />
              </h3>
              <p className="text-caption text-ink-tertiary">
                Student bug reports and feedback queue
              </p>
            </div>
          </div>
          <span className="text-caption font-semibold tabular-nums text-ink-secondary bg-surface/60 px-2.5 py-1 rounded-full border border-hairline">
            {filtered.length} in view
          </span>
        </div>

        {/* Feed body */}
        <div className="p-4 sm:p-6 bg-[color:var(--canvas)]/40 min-h-[300px]">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-ink-tertiary space-y-2">
              <Inbox className="mx-auto text-ink-tertiary" size={32} />
              <p className="text-body font-semibold text-ink-secondary">
                No reports in this filter
              </p>
              <p className="text-caption text-ink-tertiary max-w-xs mx-auto">
                When students send bug reports or feedback, they appear here in the support feed.
              </p>
            </div>
          ) : (
            <div className="space-y-5 max-w-3xl mx-auto">
              {filtered.map((report, idx) => {
                const initial = (report.userName ?? 'Student').charAt(0).toUpperCase()
                const avatarColor = avatarColors[idx % avatarColors.length]

                return (
                  <div key={report.id} className="flex items-start gap-3 group">
                    {/* Reporter avatar */}
                    <div
                      className={cn(
                        'w-9 h-9 rounded-full flex items-center justify-center font-bold text-body shrink-0 border border-hairline',
                        avatarColor,
                      )}
                    >
                      {initial}
                    </div>

                    {/* Report card */}
                    <div className="relative flex-1 bg-surface/70 border border-hairline rounded-2xl rounded-tl-xs p-4 shadow-xs text-left transition-colors duration-150 group-hover:border-hairline-strong">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-hairline">
                        <div className="flex items-center gap-2">
                          <span className="text-body font-bold text-ink">
                            {report.userName ?? 'Unknown student'}
                          </span>
                          <span className="text-caption text-ink-tertiary">
                            {report.userEmail ?? 'no email'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-micro font-semibold bg-surface-secondary text-ink-secondary px-2 py-0.5 rounded-full uppercase tracking-wider">
                            <Bug size={10} className="text-warning" />
                            {report.category}
                          </span>
                          <span
                            className={cn(
                              'text-micro font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                              statusStyles[report.status],
                            )}
                          >
                            {statusLabels[report.status]}
                          </span>
                          <span className="text-micro tabular-nums text-ink-tertiary">
                            {formatDate(report.createdAt)}
                          </span>
                        </div>
                      </div>

                      <p className="text-body text-ink leading-relaxed whitespace-pre-wrap">
                        {report.message}
                      </p>

                      {report.pagePath && (
                        <div className="mt-2 text-micro font-mono text-accent bg-accent-soft border border-accent/20 rounded-md px-2 py-1 inline-block">
                          Path: {report.pagePath}
                        </div>
                      )}

                      {/* Action bar: email reply and status controls */}
                      <div className="mt-3 pt-2.5 border-t border-hairline flex flex-wrap items-center justify-between gap-2">
                        {report.userEmail ? (
                          <a
                            href={getMailtoLink(report)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-solid text-white text-caption font-semibold shadow-xs [background-image:var(--accent-gradient)] transition-transform duration-150 hover:scale-[1.02] cursor-pointer"
                          >
                            <Mail size={13} />
                            Reply
                            <ExternalLink size={11} className="opacity-70" />
                          </a>
                        ) : (
                          <span className="text-caption text-ink-tertiary">No email provided</span>
                        )}

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={report.status === 'open' || updateReport.isPending}
                            onClick={() => setStatus(report, 'open')}
                            className={cn(
                              'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-caption font-medium transition-colors cursor-pointer disabled:cursor-default',
                              report.status === 'open'
                                ? 'bg-danger/15 text-danger font-bold border border-danger/30'
                                : 'bg-surface-secondary text-ink-secondary hover:bg-surface hover:text-ink',
                            )}
                          >
                            <CircleDot size={11} />
                            Open
                          </button>

                          <button
                            type="button"
                            disabled={report.status === 'in_progress' || updateReport.isPending}
                            onClick={() => setStatus(report, 'in_progress')}
                            className={cn(
                              'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-caption font-medium transition-colors cursor-pointer disabled:cursor-default',
                              report.status === 'in_progress'
                                ? 'bg-warning/15 text-warning font-bold border border-warning/30'
                                : 'bg-surface-secondary text-ink-secondary hover:bg-surface hover:text-ink',
                            )}
                          >
                            <Clock size={11} />
                            In progress
                          </button>

                          <button
                            type="button"
                            disabled={report.status === 'resolved' || updateReport.isPending}
                            onClick={() => setStatus(report, 'resolved')}
                            className={cn(
                              'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-caption font-medium transition-colors cursor-pointer disabled:cursor-default',
                              report.status === 'resolved'
                                ? 'bg-positive/15 text-positive font-bold border border-positive/30'
                                : 'bg-surface-secondary text-ink-secondary hover:bg-surface hover:text-ink',
                            )}
                          >
                            <CircleCheck size={11} />
                            Resolve
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
