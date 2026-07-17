import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-xs bg-surface-secondary', className)} {...props} />
}

/* Card shaped placeholder with the shimmer sweep from the design
   reference, so loading views keep the exact silhouette of the loaded
   content and never shift the layout. */
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-surface rounded-md border border-hairline shadow-sm p-5 space-y-3.5 shimmer-host">
      <Skeleton className="h-3.5 w-2/5" />
      <div className="space-y-2">
        {Array.from({ length: lines }, (_, index) => `line-${index}`).map((key, index) => (
          <Skeleton
            key={key}
            className={
              index % 3 === 0 ? 'h-2.5 w-[85%]' : index % 3 === 1 ? 'h-2.5 w-[90%]' : 'h-2.5 w-3/5'
            }
          />
        ))}
      </div>
    </div>
  )
}
