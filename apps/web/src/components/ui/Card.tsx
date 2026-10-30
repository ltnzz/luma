import type { ReactNode } from 'react'

import { cn } from '../../lib/utils'

interface CardProps {
  className?: string
  children: ReactNode
}

/**
 * Shared surface container used by dashboard panels & KPI cards.
 * Uses the globals design tokens so it supports both themes.
 */
export function Card({ className, children }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  )
}
