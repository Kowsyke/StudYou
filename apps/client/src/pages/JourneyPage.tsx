import type { JourneyOverview, JourneyTask } from '@studyou/types'
import { AnimatePresence, motion } from 'framer-motion'
import { Calendar, ExternalLink, Info, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { QueryError } from '../components/QueryError'
import { Badge } from '../components/ui/badge'
import { ProgressRing } from '../components/ui/progress'
import { Skeleton } from '../components/ui/skeleton'
import { hasNoJourney, useJourney, useToggleTask } from '../hooks/useJourney'
import { formatDate, formatGbp } from '../lib/format'
import { cn } from '../lib/utils'
import { toast } from '../store/toastStore'

const swift = [0.16, 1, 0.3, 1] as const

export function JourneyPage() {
  const { data: overview, isPending, error, refetch, isRefetching } = useJourney()
  const location = useLocation()

  useEffect(() => {
    if (!location.hash || !overview) return
    const el = document.getElementById(location.hash.slice(1))
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
      el.classList.add('ring-2', 'ring-accent/50')
      const timer = setTimeout(() => el.classList.remove('ring-2', 'ring-accent/50'), 1600)
      return () => clearTimeout(timer)
    }
  }, [location.hash, overview])

  if (error && hasNoJourney(error)) return <Navigate to="/onboarding" replace />

  if (isPending) {
    return (
      <div>
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-3.5 w-96 mb-6" />
        <div className="flex gap-4 overflow-hidden">
          {['a', 'b', 'c', 'd', 'e'].map((key) => (
            <div
              key={key}
              className="flex-none w-[220px] bg-surface-secondary rounded-md p-3 space-y-2.5 shimmer-host"
            >
              <Skeleton className="h-3.5 w-24 bg-surface" />
              <Skeleton className="h-20 w-full bg-surface" />
              <Skeleton className="h-20 w-full bg-surface" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !overview) {
    return (
      <QueryError
        message="Your journey could not be loaded. Check your connection and try again."
        onRetry={() => refetch()}
        retrying={isRefetching}
      />
    )
  }

  const doneTotal = overview.stages.reduce((sum, s) => sum + s.done, 0)
  const taskTotal = overview.stages.reduce((sum, s) => sum + s.total, 0)

  return (
    <div>
      {/* Apple-style premium header section with progress ring */}
      <header className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-lg bg-surface border border-hairline shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-title3 text-ink">My Journey</h1>
            <span className="bg-accent-soft text-accent text-micro font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles size={10} />
              Sprint 8
            </span>
          </div>
          <p className="text-xs text-ink-secondary">
            Track official roadmap milestones and checklist details for your UK visa & departure.
          </p>
        </div>

        <div className="flex items-center shrink-0 bg-surface-secondary/40 p-3 rounded-md border border-hairline">
          <ProgressRing
            value={overview.percentComplete}
            size={60}
            label={`${doneTotal} of ${taskTotal} tasks completed`}
          />
        </div>
      </header>

      {/* Main Content Render Area */}
      <main className="min-h-[500px]">
        <WalletDeckView stages={overview.stages} />
      </main>
    </div>
  )
}

/* ----------------- APPLE WALLET DECK VIEW ----------------- */
function WalletDeckView({
  stages,
}: {
  stages: JourneyOverview['stages']
}) {
  const [activeIdx, setActiveIdx] = useState(0)

  // Stage progression colour ramp: red, orange, green, light blue, blue.
  const cardGradientStyles = [
    'from-red-500/12 to-rose-500/5 border-red-300/40',
    'from-orange-500/12 to-amber-500/5 border-orange-300/40',
    'from-green-500/12 to-emerald-500/5 border-green-300/40',
    'from-sky-500/12 to-cyan-500/5 border-sky-300/40',
    'from-blue-500/12 to-indigo-500/5 border-blue-300/40',
  ]

  return (
    <div className="flex flex-col gap-3 py-2 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-2 px-1">
        <Info size={13} className="text-accent" />
        <p className="text-caption text-ink-secondary">
          Click any card pass to select that milestone and show its related checklist.
        </p>
      </div>

      {stages.map((stageProgress, index) => {
        const isActive = activeIdx === index
        const isComplete = stageProgress.done === stageProgress.total && stageProgress.total > 0
        const gradientClass = cardGradientStyles[index % cardGradientStyles.length]

        return (
          <motion.div
            key={stageProgress.stage.id}
            onClick={() => {
              if (!isActive) setActiveIdx(index)
            }}
            style={{ originY: 0 }}
            animate={{
              scale: isActive ? 1 : 0.98,
              opacity: isActive ? 1 : 0.85,
            }}
            transition={{ duration: 0.3, ease: swift }}
            className={cn(
              'rounded-lg border bg-gradient-to-br shadow-sm transition-all duration-300',
              gradientClass,
              isActive
                ? 'shadow-md border-accent/40 ring-1 ring-accent/10'
                : 'cursor-pointer hover:border-hairline-strong hover:opacity-100',
            )}
          >
            {/* Card header */}
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={cn(
                    'w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-bold border',
                    isComplete
                      ? 'bg-positive border-positive text-white'
                      : isActive
                        ? 'bg-accent text-white border-accent'
                        : 'bg-surface border-hairline-strong text-ink-secondary',
                  )}
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <span className="text-micro font-semibold uppercase tracking-[0.05em] text-ink-tertiary block leading-none">
                    Milestone Card
                  </span>
                  <h3 className="text-body font-bold text-ink truncate mt-1">
                    {stageProgress.stage.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={cn(
                    'text-micro font-bold px-2 py-0.5 rounded-full tabular-nums',
                    isComplete
                      ? 'bg-positive-soft text-positive'
                      : 'bg-surface text-ink-secondary border border-hairline',
                  )}
                >
                  {stageProgress.done} / {stageProgress.total} Complete
                </span>
                <div className="w-16 h-1.5 bg-surface rounded-full overflow-hidden hidden sm:block">
                  <div
                    className="h-full rounded-full [background-image:var(--accent-gradient)]"
                    style={{
                      width: `${stageProgress.total === 0 ? 0 : (stageProgress.done / stageProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Expandable tasks list inside selected card */}
            <AnimatePresence initial={false}>
              {isActive && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden border-t border-hairline/60 bg-surface/50 backdrop-blur-xs"
                >
                  <div className="p-4">
                    {stageProgress.tasks.length === 0 ? (
                      <p className="text-caption text-ink-tertiary py-3 text-center">
                        No checklist tasks available for this stage.
                      </p>
                    ) : (
                      <motion.ul
                        initial="hidden"
                        animate="visible"
                        variants={{
                          hidden: { opacity: 0 },
                          visible: {
                            opacity: 1,
                            transition: { staggerChildren: 0.05 },
                          },
                        }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-3"
                      >
                        {stageProgress.tasks.map((task) => (
                          <motion.li
                            key={task.id}
                            variants={{
                              hidden: { opacity: 0, y: 6 },
                              visible: { opacity: 1, y: 0 },
                            }}
                          >
                            <TaskCard task={task} />
                          </motion.li>
                        ))}
                      </motion.ul>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}

/* ----------------- INDIVIDUAL ROADMAP TASK CARD ----------------- */
function TaskCard({ task }: { task: JourneyTask }) {
  const toggleTask = useToggleTask()
  const done = task.status === 'done'

  const onToggle = (e: React.MouseEvent) => {
    e.stopPropagation() // prevent accordion toggle
    toggleTask.mutate(
      { taskId: task.id, status: done ? 'pending' : 'done' },
      {
        onSuccess: () =>
          toast.success(done ? 'Task marked as pending.' : 'Task marked as complete.'),
        onError: () => toast.error('Something went wrong. Try again.'),
      },
    )
  }

  return (
    <div
      id={`task-${task.id}`}
      className={cn(
        'aurora-card rounded-md shadow-xs p-3.5 flex flex-col gap-2.5 transition-all duration-200 border bg-surface',
        done
          ? 'border-hairline bg-surface/60 opacity-90'
          : 'border-hairline-strong hover:shadow-sm',
      )}
    >
      <div className="flex items-start gap-3">
        {/* Animated Tap-friendly Spring Checkbox */}
        <motion.button
          type="button"
          onClick={onToggle}
          disabled={toggleTask.isPending}
          whileTap={{ scale: 0.9 }}
          className={cn(
            'mt-px h-4.5 w-4.5 shrink-0 rounded-xs border flex items-center justify-center transition-colors duration-[120ms] cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent',
            done
              ? 'bg-accent-solid border-accent-solid text-white shadow-xs'
              : 'border-ink-tertiary hover:border-accent bg-surface text-transparent',
          )}
          aria-label={done ? `Mark ${task.title} as pending` : `Mark ${task.title} as done`}
        >
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" aria-hidden="true">
            <path
              d="M20 6L9 17l-5-5"
              stroke="currentColor"
              strokeWidth={4}
              className={cn('tick-path', done && 'ticked')}
            />
          </svg>
        </motion.button>

        <div className="space-y-1">
          <span
            className={cn(
              'text-xs font-semibold leading-snug transition-colors duration-[120ms] block',
              done ? 'line-through text-ink-tertiary' : 'text-ink',
            )}
          >
            {task.sourceUrl ? (
              <a
                href={task.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-accent hover:underline inline-flex items-center gap-1"
              >
                {task.title}
                <ExternalLink size={10} className="shrink-0" />
              </a>
            ) : (
              task.title
            )}
          </span>
          <p className="text-caption text-ink-secondary leading-snug">{task.description}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mt-1">
        <Badge category={task.categoryKey} />
        {task.costType === 'optional' && task.costPence !== null && task.costPence > 0 && (
          <Badge>Optional</Badge>
        )}
        <Link
          to={`/resources?category=${task.categoryKey}`}
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent-soft text-accent border border-accent-soft/20 hover:bg-accent hover:text-white transition-all duration-[120ms] inline-flex items-center gap-0.5"
        >
          Related Resources
        </Link>
      </div>

      <div className="flex items-center justify-between border-t border-hairline/80 pt-2 mt-auto text-micro text-ink-tertiary">
        <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
          {task.costPence !== null && task.costPence > 0 ? formatGbp(task.costPence) : 'Free'}
        </span>
        <span className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <Calendar size={10} />
            {formatDate(task.targetDate)}
          </span>
          {task.sourceUrl && (
            <a
              href={task.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 text-accent font-medium hover:underline rounded-xs"
            >
              Source
              <ExternalLink size={9} />
            </a>
          )}
        </span>
      </div>
    </div>
  )
}
