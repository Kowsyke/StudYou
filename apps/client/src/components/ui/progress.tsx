import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

const swift = [0.16, 1, 0.3, 1] as const

interface ProgressBarProps {
  value: number
  className?: string
}

export function ProgressBar({ value, className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className={cn('h-1 w-full rounded-full bg-surface-secondary overflow-hidden', className)}>
      <motion.div
        className="h-full rounded-full bg-accent"
        initial={false}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.3, ease: swift }}
      />
    </div>
  )
}

interface ProgressRingProps {
  value: number
  size?: number
  label?: string
}

/* Ring on the left, large percent and description beside it, matching
   the journey completion card in the design reference. */
export function ProgressRing({ value, size = 90, label }: ProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const stroke = 10
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div className="flex items-center gap-6">
      <svg
        width={size}
        height={size}
        className="-rotate-90 shrink-0"
        role="img"
        aria-label={`${clamped} percent complete`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-secondary)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: circumference * (1 - clamped / 100) }}
          transition={{ duration: 0.3, ease: swift }}
        />
      </svg>
      <div className="flex flex-col">
        <span
          data-testid="percent-complete"
          className="text-[28px] leading-tight font-bold text-ink"
        >
          {clamped}%
        </span>
        {label && <span className="text-xs text-ink-secondary mt-0.5">{label}</span>}
      </div>
    </div>
  )
}
