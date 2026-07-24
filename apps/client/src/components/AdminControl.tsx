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
  open: 'bg-danger/20 text-danger border-danger/30',
  in_progress: 'bg-warning/20 text-warning border-warning/30',
  resolved: 'bg-positive/20 text-positive border-positive/30',
}

const statusLabels: Record<ReportStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
}

const avatarColors = [
  'bg-blue-600 text-white',
  'bg-emerald-600 text-white',
  'bg-purple-600 text-white',
  'bg-indigo-600 text-white',
  'bg-amber-600 text-white',
  'bg-rose-600 text-white',
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

      {/* Live Support Window Header */}
      <div className="bg-[#17212b] border border-hairline/40 rounded-xl overflow-hidden shadow-xl">
        <div className="bg-[#0e1621] px-4 py-3 border-b border-hairline/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
              <MessageSquare size={16} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                Live Support Feed
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </h3>
              <p className="text-[11px] text-gray-400">
                Live customer bug reports & feedback queue
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-gray-400 bg-white/5 px-2 py-1 rounded-md border border-white/10">
            {filtered.length} messages
          </span>
        </div>

        {/* Chat Message Body */}
        <div className="p-4 sm:p-6 bg-[#0e1621] bg-[radial-gradient(#17212b_1px,transparent_1px)] [background-size:16px_16px] min-h-[300px]">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-400 space-y-2">
              <Inbox className="mx-auto text-gray-500" size={32} />
              <p className="text-sm font-semibold text-gray-300">No messages in this filter</p>
              <p className="text-xs text-gray-500">
                When students send bug reports or feature feedback, they will appear here in the
                live support feed.
              </p>
            </div>
          ) : (
            <div className="space-y-6 max-w-3xl mx-auto">
              {filtered.map((report, idx) => {
                const initial = (report.userName ?? 'Student').charAt(0).toUpperCase()
                const avatarColor = avatarColors[idx % avatarColors.length]

                return (
                  <div key={report.id} className="flex items-start gap-3 group animate-fadeIn">
                    {/* User Avatar Circle */}
                    <div
                      className={cn(
                        'w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-md border border-white/10',
                        avatarColor,
                      )}
                    >
                      {initial}
                    </div>

                    {/* Message bubble */}
                    <div className="relative flex-1 bg-[#182533] border border-white/10 rounded-2xl rounded-tl-xs p-4 shadow-lg text-left">
                      {/* Message header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-blue-300">
                            {report.userName ?? 'Unknown Student'}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            ({report.userEmail ?? 'no-email'})
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-micro font-mono bg-white/10 text-gray-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            <Bug size={10} className="inline mr-1 text-amber-400" />
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
                          <span className="text-[10px] font-mono text-gray-400">
                            {formatDate(report.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Message Content */}
                      <p className="text-sm text-gray-100 leading-relaxed font-sans whitespace-pre-wrap">
                        {report.message}
                      </p>

                      {report.pagePath && (
                        <div className="mt-2 text-[11px] font-mono text-blue-400/90 bg-blue-500/10 border border-blue-500/20 rounded-md px-2 py-1 inline-block">
                          Path: {report.pagePath}
                        </div>
                      )}

                      {/* Message action bar (email reply and status controls) */}
                      <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                        {/* Direct Email Reply Button */}
                        {report.userEmail ? (
                          <a
                            href={getMailtoLink(report)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                          >
                            <Mail size={13} />
                            Reply to {report.userEmail}
                            <ExternalLink size={11} className="opacity-70" />
                          </a>
                        ) : (
                          <span className="text-xs text-gray-500">No email provided</span>
                        )}

                        {/* Status Change Chips */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={report.status === 'open' || updateReport.isPending}
                            onClick={() => setStatus(report, 'open')}
                            className={cn(
                              'px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
                              report.status === 'open'
                                ? 'bg-danger/20 text-danger font-bold border border-danger/30'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white',
                            )}
                          >
                            <CircleDot size={11} className="inline mr-1" />
                            Open
                          </button>

                          <button
                            type="button"
                            disabled={report.status === 'in_progress' || updateReport.isPending}
                            onClick={() => setStatus(report, 'in_progress')}
                            className={cn(
                              'px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
                              report.status === 'in_progress'
                                ? 'bg-warning/20 text-warning font-bold border border-warning/30'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white',
                            )}
                          >
                            <Clock size={11} className="inline mr-1" />
                            In Progress
                          </button>

                          <button
                            type="button"
                            disabled={report.status === 'resolved' || updateReport.isPending}
                            onClick={() => setStatus(report, 'resolved')}
                            className={cn(
                              'px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
                              report.status === 'resolved'
                                ? 'bg-positive/20 text-positive font-bold border border-positive/30'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white',
                            )}
                          >
                            <CircleCheck size={11} className="inline mr-1" />
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
