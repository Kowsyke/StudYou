import type { CategoryKey } from '@studyou/types'
import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

const categoryStyles: Record<CategoryKey, string> = {
  visa: 'bg-accent-soft text-accent',
  health: 'bg-positive-soft text-positive',
  finance: 'bg-warning-soft text-warning',
  housing: 'bg-category-housing-soft text-category-housing',
  documents: 'bg-surface-secondary text-ink-secondary',
  arrival: 'bg-category-arrival-soft text-category-arrival',
}

export const categoryLabels: Record<CategoryKey, string> = {
  visa: 'Visa',
  health: 'Health',
  finance: 'Finance',
  housing: 'Housing',
  documents: 'Documents',
  arrival: 'Arrival',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  category?: CategoryKey
}

export function Badge({ className, category, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded-xs text-micro font-semibold uppercase tracking-[0.02em]',
        category ? categoryStyles[category] : 'bg-surface-secondary text-ink-secondary',
        className,
      )}
      {...props}
    >
      {category ? categoryLabels[category] : children}
    </span>
  )
}
