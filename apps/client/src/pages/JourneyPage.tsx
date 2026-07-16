import type { JourneyTask } from '@studyou/types'
import { motion } from 'framer-motion'
import { Check, ExternalLink } from 'lucide-react'
import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { ProgressBar } from '../components/ui/progress'
import { hasNoJourney, useJourney, useToggleTask } from '../hooks/useJourney'
import { formatDate, formatGbp } from '../lib/format'
import { cn } from '../lib/utils'

export function JourneyPage() {
  const { data: overview, isPending, error } = useJourney()
  const location = useLocation()

  useEffect(() => {
    if (!location.hash || !overview) return
    const el = document.getElementById(location.hash.slice(1))
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('ring-2', 'ring-accent/50')
      const timer = setTimeout(() => el.classList.remove('ring-2', 'ring-accent/50'), 1600)
      return () => clearTimeout(timer)
    }
  }, [location.hash, overview])

  if (error && hasNoJourney(error)) return <Navigate to="/onboarding" replace />

  if (isPending) {
    return <p className="text-sm text-ink-muted py-16 text-center">Loading your journey...</p>
  }

  if (!overview) {
    return <p className="text-sm text-danger py-16 text-center">Could not load your journey.</p>
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">My journey</h1>
        <p className="text-sm text-ink-secondary mt-1">
          Five stages, every official step. Tick tasks off as you complete them.
        </p>
      </header>

      <div className="space-y-5">
        {overview.stages.map((stageProgress, index) => (
          <motion.div
            key={stageProgress.stage.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.2, ease: 'easeOut' }}
          >
            <Card id={`stage-${stageProgress.stage.key}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      <span className="text-ink-muted font-normal mr-2">{index + 1}</span>
                      {stageProgress.stage.title}
                    </CardTitle>
                    <CardDescription>{stageProgress.stage.description}</CardDescription>
                  </div>
                  <span className="text-sm text-ink-muted tabular-nums shrink-0 ml-4">
                    {stageProgress.done}/{stageProgress.total}
                  </span>
                </div>
                <ProgressBar
                  className="mt-3"
                  value={
                    stageProgress.total === 0 ? 0 : (stageProgress.done / stageProgress.total) * 100
                  }
                />
              </CardHeader>
              <CardContent className="pt-1">
                <ul className="divide-y divide-black/5">
                  {stageProgress.tasks.map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function TaskRow({ task }: { task: JourneyTask }) {
  const toggleTask = useToggleTask()
  const done = task.status === 'done'

  return (
    <li id={`task-${task.id}`} className="flex items-start gap-3 py-3 rounded-lg transition-shadow">
      <button
        onClick={() => toggleTask.mutate({ taskId: task.id, status: done ? 'pending' : 'done' })}
        disabled={toggleTask.isPending}
        aria-label={done ? `Mark ${task.title} as pending` : `Mark ${task.title} as done`}
        className={cn(
          'mt-0.5 h-5 w-5 shrink-0 rounded-md border flex items-center justify-center transition-all duration-150',
          done
            ? 'bg-accent border-accent text-white'
            : 'border-black/20 hover:border-accent bg-surface',
        )}
      >
        <motion.span
          initial={false}
          animate={{ scale: done ? 1 : 0, opacity: done ? 1 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        >
          <Check size={13} strokeWidth={3} />
        </motion.span>
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              'text-sm font-medium transition-colors',
              done && 'line-through text-ink-muted',
            )}
          >
            {task.title}
          </span>
          <Badge category={task.categoryKey} />
          {task.costPence !== null && task.costPence > 0 && (
            <span className="text-xs text-ink-secondary tabular-nums">
              {formatGbp(task.costPence)}
              {task.costType === 'optional' && <span className="text-ink-muted"> optional</span>}
            </span>
          )}
        </div>
        <p className="text-xs text-ink-secondary mt-0.5">{task.description}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-ink-muted">
          <span>Target {formatDate(task.targetDate)}</span>
          {task.sourceUrl && (
            <a
              href={task.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-accent hover:underline"
            >
              Official source
              <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </li>
  )
}
