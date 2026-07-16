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
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="h-11 w-11 rounded-xl bg-accent-soft text-accent flex items-center justify-center mb-3">
        <Icon size={20} />
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-sm text-ink-muted mt-1 max-w-sm">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
