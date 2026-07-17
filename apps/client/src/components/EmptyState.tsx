import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  body: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-8 bg-surface border border-dashed border-hairline-strong rounded-lg gap-2">
      <Icon size={40} strokeWidth={1.5} className="text-ink-tertiary mb-2" />
      <h3 className="text-body-lg font-semibold text-ink">{title}</h3>
      <p className="text-body text-ink-secondary max-w-xs leading-relaxed">{body}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
