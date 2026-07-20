import { useGSAP } from '@gsap/react'
import type { JourneyOverview, JourneyTask } from '@studyou/types'
import {
  BookOpen,
  Calendar,
  ExternalLink,
  Info,
  PlaneLanding,
  School,
  Sparkles,
  Stamp,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { QueryError } from '../components/QueryError'
import { Badge } from '../components/ui/badge'
import { ProgressRing } from '../components/ui/progress'
import { Skeleton } from '../components/ui/skeleton'
import { hasNoJourney, useJourney, useToggleTask } from '../hooks/useJourney'
import { formatDate, formatGbp } from '../lib/format'
import { DrawSVGPlugin } from '../lib/gsap/DrawSVGPlugin.js'
import { Flip } from '../lib/gsap/Flip.js'
import { MotionPathPlugin } from '../lib/gsap/MotionPathPlugin.js'
import { gsap } from '../lib/gsap/index.js'
import { cn } from '../lib/utils'
import { toast } from '../store/toastStore'

gsap.registerPlugin(useGSAP, Flip, DrawSVGPlugin, MotionPathPlugin)

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

  if (isPending) {
    return (
      <div className="flex flex-col gap-5 py-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between border-b border-hairline pb-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <QueryError
        message={error.message || 'Failed to load journey.'}
        onRetry={() => refetch()}
        retrying={isRefetching}
      />
    )
  }

  if (hasNoJourney(overview)) {
    return <Navigate to="/onboarding" replace />
  }

  const doneTotal = overview.stages.reduce((sum, s) => sum + s.done, 0)
  const taskTotal = overview.stages.reduce((sum, s) => sum + s.total, 0)

  return (
    <div className="noise-overlay min-h-screen py-6 px-4 bg-canvas/30 rounded-lg">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 border-b border-hairline pb-5 mb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-micro font-semibold uppercase tracking-[0.06em] text-accent bg-accent-soft px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <Sparkles size={11} />
              Personalized Map
            </span>
          </div>
          <h1 className="text-title3 text-ink font-bold text-gradient">Your Study Journey</h1>
          <p className="text-xs text-ink-secondary">
            Track official roadmap milestones and checklist details for your UK visa & departure.
          </p>
        </div>

        <div className="flex items-center shrink-0 bg-surface-secondary/40 p-3 rounded-md border border-hairline card-lift">
          <ProgressRing
            value={overview.percentComplete}
            size={60}
            label={`${doneTotal} of ${taskTotal} tasks completed`}
          />
        </div>
      </header>

      <main className="min-h-[500px]">
        <WalletDeckView stages={overview.stages} />
      </main>
    </div>
  )
}

/* ----------------- HELPER FOR SOURCE LINK DRAWING UNDERLINES ----------------- */
function SourceLink({ url, title }: { url: string; title: string }) {
  const underlineRef = useRef<SVGPathElement>(null)

  const onEnter = () => {
    if (underlineRef.current) {
      gsap.fromTo(
        underlineRef.current,
        { drawSVG: '0%' },
        { drawSVG: '100%', duration: 0.3, ease: 'power2.out', overwrite: 'auto' },
      )
    }
  }

  const onLeave = () => {
    if (underlineRef.current) {
      gsap.to(underlineRef.current, {
        drawSVG: '0%',
        duration: 0.25,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    }
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="relative inline-flex items-center gap-0.5 text-accent font-semibold rounded-xs pr-1"
    >
      {title}
      <ExternalLink size={10} className="shrink-0" />
      <svg
        className="absolute bottom-0 left-0 right-0 h-[1.5px] pointer-events-none"
        viewBox="0 0 100 2"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          ref={underlineRef}
          d="M0 1 L100 1"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </a>
  )
}

/* ----------------- HELPER FOR DRAWSVG CHECKBOX ----------------- */
function CheckboxIcon({ done }: { done: boolean }) {
  const pathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    if (!pathRef.current) return
    gsap.to(pathRef.current, {
      drawSVG: done ? '100%' : '0%',
      duration: 0.28,
      ease: 'power2.out',
    })
  }, [done])

  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" aria-hidden="true">
      <path
        ref={pathRef}
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ----------------- APPLE WALLET DECK VIEW ----------------- */
function WalletDeckView({
  stages,
}: {
  stages: JourneyOverview['stages']
}) {
  const [activeIdx, setActiveIdx] = useState(0)

  const deckRef = useRef<HTMLDivElement>(null)
  // biome-ignore lint/suspicious/noExplicitAny: GSAP FlipState is untyped
  const flipStateRef = useRef<any>(null)

  const cardGradientStyles = [
    'from-red-500/12 to-rose-500/5 border-red-300/40',
    'from-orange-500/12 to-amber-500/5 border-orange-300/40',
    'from-green-500/12 to-emerald-500/5 border-green-300/40',
    'from-sky-500/12 to-cyan-500/5 border-sky-300/40',
    'from-blue-500/12 to-indigo-500/5 border-blue-300/40',
  ]

  const getStageIcon = (title: string): LucideIcon => {
    const t = title.toLowerCase()
    if (t.includes('english') || t.includes('ielts')) return BookOpen
    if (
      t.includes('university') ||
      t.includes('offer') ||
      t.includes('ucas') ||
      t.includes('shortlist')
    )
      return School
    if (t.includes('cas') || t.includes('deposit') || t.includes('finance')) return Wallet
    if (t.includes('visa') || t.includes('surcharge') || t.includes('tb test')) return Stamp
    return PlaneLanding
  }

  const handleCardClick = (index: number) => {
    if (deckRef.current) {
      flipStateRef.current = Flip.getState(deckRef.current.querySelectorAll('.wallet-pass-card'))
    }
    setActiveIdx(index)
  }

  // GSAP Flip animation when selected pass card changes
  useGSAP(() => {
    if (flipStateRef.current && deckRef.current) {
      Flip.from(flipStateRef.current, {
        duration: 0.55,
        ease: 'power3.out',
        scale: true,
        fade: true,
        absolute: false,
      })
      flipStateRef.current = null
    }

    // Animate stage icon entrance inside active card
    const activeIcon = document.querySelector('.wallet-pass-card-active .stage-icon-svg')
    if (activeIcon) {
      gsap.fromTo(
        activeIcon,
        { opacity: 0, scale: 0.5, x: -30, y: 20 },
        {
          opacity: 1,
          scale: 1,
          motionPath: {
            path: [
              { x: -30, y: 20 },
              { x: -10, y: -10 },
              { x: 0, y: 0 },
            ],
            curviness: 1.5,
          },
          duration: 0.7,
          ease: 'power2.out',
        },
      )
    }
  }, [activeIdx])

  return (
    <div ref={deckRef} className="flex flex-col gap-3 py-2 max-w-4xl mx-auto select-none">
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
        const StageIcon = getStageIcon(stageProgress.stage.title)

        return (
          <div
            key={stageProgress.stage.id}
            data-flip-id={`stage-${stageProgress.stage.id}`}
            // biome-ignore lint/a11y/useSemanticElements: Wallet pass card container
            role="button"
            tabIndex={0}
            onClick={() => {
              if (!isActive) handleCardClick(index)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                if (!isActive) handleCardClick(index)
              }
            }}
            className={cn(
              'wallet-pass-card rounded-lg border bg-gradient-to-br shadow-sm transition-all duration-300 relative overflow-hidden',
              gradientClass,
              isActive
                ? 'wallet-pass-card-active shadow-md border-accent/40 ring-1 ring-accent/10'
                : 'cursor-pointer hover:border-hairline-strong hover:opacity-100 opacity-85',
            )}
          >
            {/* Card header */}
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={cn(
                    'w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold border relative',
                    isComplete
                      ? 'bg-positive border-positive text-white animate-pulse'
                      : isActive
                        ? 'bg-accent text-white border-accent'
                        : 'bg-surface border-hairline-strong text-ink-secondary',
                  )}
                >
                  <StageIcon size={14} className="stage-icon-svg relative z-10" />
                </span>
                <div className="min-w-0">
                  <span className="text-micro font-semibold uppercase tracking-[0.05em] text-ink-tertiary block leading-none">
                    Milestone Pass {index + 1}
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
            {isActive && (
              <div className="overflow-hidden border-t border-hairline/60 bg-surface/50 backdrop-blur-xs">
                <div className="p-4">
                  {stageProgress.tasks.length === 0 ? (
                    <p className="text-caption text-ink-tertiary py-3 text-center">
                      No checklist tasks available for this stage.
                    </p>
                  ) : (
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {stageProgress.tasks.map((task) => (
                        <li key={task.id}>
                          <TaskCard task={task} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
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
        'aurora-card rounded-md shadow-xs p-3.5 flex flex-col gap-2.5 transition-all duration-200 border bg-surface card-lift',
        done
          ? 'border-hairline bg-surface/60 opacity-90'
          : 'border-hairline-strong hover:shadow-sm',
      )}
    >
      <div className="flex items-start gap-3">
        {/* Animated Checkbox */}
        <button
          type="button"
          onClick={onToggle}
          disabled={toggleTask.isPending}
          className={cn(
            'mt-px h-5 w-5 shrink-0 rounded-xs border flex items-center justify-center transition-colors duration-[120ms] cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent active:scale-90',
            done
              ? 'bg-accent-solid border-accent-solid text-white shadow-xs'
              : 'border-ink-tertiary hover:border-accent bg-surface text-transparent',
          )}
          aria-label={done ? `Mark ${task.title} as pending` : `Mark ${task.title} as done`}
        >
          <CheckboxIcon done={done} />
        </button>

        <div className="space-y-1 min-w-0">
          <span
            className={cn(
              'text-xs font-semibold leading-snug transition-colors duration-[120ms] block truncate',
              done ? 'line-through text-ink-tertiary' : 'text-ink',
            )}
          >
            {task.sourceUrl ? <SourceLink url={task.sourceUrl} title={task.title} /> : task.title}
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
        <span className="font-bold text-positive tabular-nums">
          {task.costPence !== null && task.costPence > 0 ? formatGbp(task.costPence) : 'Free'}
        </span>
        <span className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <Calendar size={10} />
            {formatDate(task.targetDate)}
          </span>
          {task.sourceUrl && <SourceLink url={task.sourceUrl} title="Source" />}
        </span>
      </div>
    </div>
  )
}
