import type { JourneyTask } from '@studyou/types'
import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { QueryError } from '../components/QueryError'
import { Badge } from '../components/ui/badge'
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

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-title3 text-ink">My journey</h1>
        <p className="text-xs text-ink-secondary mt-1">
          Five stages, every official step. Tick tasks off as you complete them.
        </p>
      </header>

      <div className="flex gap-4 overflow-x-auto items-start pb-4">
        {overview.stages.map((stageProgress, index) => (
          <motion.section
            key={stageProgress.stage.id}
            id={`stage-${stageProgress.stage.key}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.3, ease: swift }}
            className="flex-none w-[220px] bg-surface-secondary rounded-md p-3 flex flex-col gap-3"
            aria-label={stageProgress.stage.title}
          >
            <div className="px-1 flex flex-col gap-0.5">
              <h2 className="text-body font-semibold text-ink">
                {index + 1}. {stageProgress.stage.title}
              </h2>
              <p className="text-micro text-ink-tertiary">
                {stageProgress.done} of {stageProgress.total} completed
              </p>
            </div>
            <ul className="flex flex-col gap-2">
              {stageProgress.tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </ul>
          </motion.section>
        ))}
      </div>
    </div>
  )
}

function TaskCard({ task }: { task: JourneyTask }) {
  const toggleTask = useToggleTask()
  const done = task.status === 'done'

  const onToggle = () => {
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
    <li
      id={`task-${task.id}`}
      className="bg-surface border border-hairline rounded-sm shadow-sm p-2.5 flex flex-col gap-2 transition-[border-color,transform] duration-[120ms] hover:border-ink-tertiary hover:-translate-y-px"
    >
      <div className="flex items-start gap-2">
        <button
          onClick={onToggle}
          disabled={toggleTask.isPending}
          aria-label={done ? `Mark ${task.title} as pending` : `Mark ${task.title} as done`}
          className={cn(
            'mt-px h-4 w-4 shrink-0 rounded-xs border-[1.5px] flex items-center justify-center transition-colors duration-[120ms]',
            done
              ? 'bg-accent-solid border-accent-solid'
              : 'border-ink-tertiary hover:border-accent bg-surface',
          )}
        >
          <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" aria-hidden="true">
            <path
              d="M20 6L9 17l-5-5"
              stroke="white"
              strokeWidth={4}
              className={cn('tick-path', done && 'ticked')}
            />
          </svg>
        </button>
        <span
          className={cn(
            'text-xs font-medium leading-snug transition-colors duration-[120ms]',
            done ? 'line-through text-ink-tertiary' : 'text-ink',
          )}
        >
          {task.title}
        </span>
      </div>

      <div className="flex flex-wrap gap-1">
        <Badge category={task.categoryKey} />
        {task.costType === 'optional' && task.costPence !== null && task.costPence > 0 && (
          <Badge>Optional</Badge>
        )}
      </div>

      <p className="text-caption text-ink-secondary leading-snug">{task.description}</p>

      <div className="flex items-center justify-between border-t border-hairline pt-1.5 text-micro text-ink-tertiary">
        <span className="font-semibold text-ink-secondary tabular-nums">
          {task.costPence !== null && task.costPence > 0 ? formatGbp(task.costPence) : 'Free'}
        </span>
        <span className="flex items-center gap-2">
          {formatDate(task.targetDate)}
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
    </li>
  )
}
