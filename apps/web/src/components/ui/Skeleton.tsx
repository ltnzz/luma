import { cn } from '../../lib/utils'

interface SkeletonProps {
  className?: string
  /** Defaults to a rounded bar; use `circle` for avatar-like placeholders. */
  variant?: 'bar' | 'circle'
}

export function Skeleton({ className, variant = 'bar' }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse bg-surface-muted',
        variant === 'circle' ? 'rounded-full' : 'rounded-md',
        className,
      )}
    />
  )
}
