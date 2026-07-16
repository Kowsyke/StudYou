import type { CategoryKey } from '@studyou/types'
import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

const categoryStyles: Record<CategoryKey, string> = {
  visa: 'bg-[#eaf3fe] text-[#1c5cab]',
  health: 'bg-[#e8f6e8] text-[#006300]',
  finance: 'bg-[#fdf3e3] text-[#8a5a00]',
  housing: 'bg-[#f3effc] text-[#4a3aa7]',
  documents: 'bg-[#eef1f4] text-[#3d4852]',
  arrival: 'bg-[#e6f7f0] text-[#0d6b4c]',
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
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
        category ? categoryStyles[category] : 'bg-canvas text-ink-secondary',
        className,
      )}
      {...props}
    >
      {category ? categoryLabels[category] : children}
    </span>
  )
}
