import { RotateCw, TriangleAlert } from 'lucide-react'
import { Button } from './ui/button'

interface QueryErrorProps {
  message: string
  onRetry: () => void
  retrying?: boolean
}

export function QueryError({ message, onRetry, retrying = false }: QueryErrorProps) {
  return (
    <div className="flex justify-center py-16 px-4">
      <div className="flex items-start gap-3 bg-surface border border-danger rounded-md shadow-sm p-4 max-w-md">
        <TriangleAlert size={18} className="text-danger shrink-0 mt-0.5" />
        <div className="flex flex-col gap-2">
          <h3 className="text-body font-semibold text-ink">Could not load this view</h3>
          <p className="text-xs text-ink-secondary leading-relaxed">{message}</p>
          <div>
            <Button variant="secondary" size="sm" onClick={onRetry} disabled={retrying}>
              <RotateCw size={13} className={retrying ? 'animate-spin' : undefined} />
              {retrying ? 'Retrying...' : 'Try again'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
