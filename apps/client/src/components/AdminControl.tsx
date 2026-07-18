import type { AdminUser, BugReport, ReportStatus } from '@studyou/types'
import {
  Ban,
  Bug,
  CircleCheck,
  CircleDot,
  Clock,
  Inbox,
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
import { EmptyState } from './EmptyState'
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
    <section aria-label="User accounts">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-52 max-w-80">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-tertiary"
          />
          <Input
            className="pl-8"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <p className="text-caption text-ink-tertiary tabular-nums">
          {filtered.length} of {(users ?? []).length} accounts
        </p>
      </div>

      <div className="aurora-card rounded-lg shadow-md overflow-hidden">
        <table className="w-full text-body">
          <thead>
            <tr className="text-left text-caption font-semibold uppercase tracking-[0.05em] text-ink-secondary bg-surface-secondary">
              <th className="py-3 px-5 font-semibold">Account</th>
              <th className="py-3 pr-3 font-semibold">Role</th>
              <th className="py-3 pr-3 font-semibold text-right">Roadmap</th>
              <th className="py-3 pr-3 font-semibold text-right">Open reports</th>
              <th className="py-3 pr-3 font-semibold">Joined</th>
              <th className="py-3 pr-5 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--border)">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-canvas transition-colors duration-[120ms]">
                <td className="py-2.5 px-5 pr-3">
                  <p className="font-semibold text-ink">{u.fullName}</p>
                  <p className="text-caption text-ink-tertiary">{u.email}</p>
                </td>
                <td className="py-2.5 pr-3">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-micro font-semibold uppercase tracking-[0.05em] px-1.5 py-0.5 rounded-xs',
                      u.role === 'admin'
                        ? 'bg-category-housing-soft text-category-housing'
                        : 'bg-accent-soft text-accent',
                    )}
                  >
                    {u.role === 'admin' ? <ShieldCheck size={10} /> : <UserRound size={10} />}
                    {u.role}
                  </span>
                </td>
                <td className="py-2.5 pr-3 text-right tabular-nums text-ink-secondary">
                  {u.percentComplete === null ? 'No journey' : `${u.percentComplete}%`}
                </td>
                <td className="py-2.5 pr-3 text-right tabular-nums text-ink-secondary">
                  {u.openReports}
                </td>
                <td className="py-2.5 pr-3 text-caption text-ink-tertiary">
                  {formatDate(u.createdAt)}
                </td>
                <td className="py-2.5 pr-5 text-right">
                  {u.id === me?.id ? (
                    <span className="text-caption text-ink-tertiary">You</span>
                  ) : (
                    <Button
                      variant={u.suspended ? 'secondary' : 'danger'}
                      size="sm"
                      disabled={setSuspended.isPending}
                      onClick={() => onToggle(u)}
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
  open: 'bg-danger-soft text-danger',
  in_progress: 'bg-warning-soft text-warning',
  resolved: 'bg-positive-soft text-positive',
}

const statusLabels: Record<ReportStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
}

/* Bug and feedback triage: filter by status, step each report through
   open, in progress and resolved. */
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

  return (
    <section aria-label="Bug reports">
      <fieldset className="flex flex-wrap gap-1.5 mb-4 border-0" aria-label="Filter by status">
        {(['all', 'open', 'in_progress', 'resolved'] as const).map((value) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            aria-pressed={statusFilter === value}
            className={cn(
              'text-xs font-medium px-3 py-1.5 rounded-full border transition-colors duration-[120ms]',
              statusFilter === value
                ? 'bg-accent-solid border-transparent text-white shadow-sm [background-image:var(--accent-gradient)]'
                : 'bg-surface border-hairline-strong text-ink-secondary hover:bg-surface-secondary hover:text-ink',
            )}
          >
            {value === 'all' ? `All (${(reports ?? []).length})` : statusLabels[value]}
          </button>
        ))}
      </fieldset>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No reports here"
          body="When students report a bug or share feedback from the sidebar, it lands in this queue."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((report) => (
            <li key={report.id} className="aurora-card rounded-lg shadow-md p-4">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 text-micro font-semibold uppercase tracking-[0.05em] px-1.5 py-0.5 rounded-xs bg-surface-secondary text-ink-secondary">
                  <Bug size={10} />
                  {report.category}
                </span>
                <span
                  className={cn(
                    'text-micro font-semibold uppercase tracking-[0.05em] px-1.5 py-0.5 rounded-xs',
                    statusStyles[report.status],
                  )}
                >
                  {statusLabels[report.status]}
                </span>
                {report.pagePath && (
                  <span className="font-mono text-micro text-ink-tertiary bg-canvas border border-hairline rounded-xs px-1.5 py-0.5">
                    {report.pagePath}
                  </span>
                )}
                <span className="ml-auto text-caption text-ink-tertiary">
                  {formatDate(report.createdAt)}
                </span>
              </div>
              <p className="text-body text-ink leading-relaxed">{report.message}</p>
              <p className="text-caption text-ink-tertiary mt-1.5">
                From {report.userName ?? 'Unknown'} ({report.userEmail ?? 'no email'})
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-hairline">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={report.status === 'open' || updateReport.isPending}
                  onClick={() => setStatus(report, 'open')}
                >
                  <CircleDot size={12} />
                  Open
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={report.status === 'in_progress' || updateReport.isPending}
                  onClick={() => setStatus(report, 'in_progress')}
                >
                  <Clock size={12} />
                  In progress
                </Button>
                <Button
                  size="sm"
                  disabled={report.status === 'resolved' || updateReport.isPending}
                  onClick={() => setStatus(report, 'resolved')}
                >
                  <CircleCheck size={12} />
                  Resolve
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
