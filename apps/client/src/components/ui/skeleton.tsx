import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-lg bg-black/[0.06]', className)} {...props} />
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-surface rounded-card border border-hairline shadow-card px-6 py-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: lines }, (_, index) => `line-${index}`).map((key, index) => (
        <Skeleton key={key} className={index % 2 === 0 ? 'h-3 w-full' : 'h-3 w-4/5'} />
      ))}
    </div>
  )
}
