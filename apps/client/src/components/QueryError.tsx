import { RotateCw } from 'lucide-react'
import { Button } from './ui/button'

interface QueryErrorProps {
  message: string
  onRetry: () => void
  retrying?: boolean
}

export function QueryError({ message, onRetry, retrying = false }: QueryErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="h-11 w-11 rounded-xl bg-danger-soft text-danger flex items-center justify-center mb-3">
        <RotateCw size={20} />
      </div>
      <h3 className="text-sm font-semibold">Could not load this view</h3>
      <p className="text-sm text-ink-muted mt-1 max-w-sm">{message}</p>
      <Button variant="secondary" className="mt-4" onClick={onRetry} disabled={retrying}>
        <RotateCw size={14} className={retrying ? 'animate-spin' : undefined} />
        {retrying ? 'Retrying...' : 'Try again'}
      </Button>
    </div>
  )
}
