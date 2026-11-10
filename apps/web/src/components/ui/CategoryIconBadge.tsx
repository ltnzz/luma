import type { ReactNode } from 'react'

import {
  BusIcon,
  CheckCircleIcon,
  HospitalIcon,
  SchoolIcon,
  TreeIcon,
  WindIcon,
} from './Icons'
import { cn } from '../../lib/utils'

export type CategoryIconKind =
  | 'health'
  | 'green'
  | 'school'
  | 'transit'
  | 'water'
  | 'air'
  | 'verified'
  | 'boundary'

interface CategoryIconBadgeProps {
  category: CategoryIconKind
  size?: 'sm' | 'md' | 'lg'
  active?: boolean
  className?: string
  label?: string
}

const categoryStyles: Record<CategoryIconKind, string> = {
  health: 'border-transparent bg-rose-500/[0.07] text-rose-600 dark:text-rose-300',
  green: 'border-transparent bg-emerald-500/[0.07] text-emerald-600 dark:text-emerald-300',
  school: 'border-transparent bg-blue-500/[0.07] text-blue-600 dark:text-blue-300',
  transit: 'border-transparent bg-violet-500/[0.07] text-violet-600 dark:text-violet-300',
  water: 'border-transparent bg-sky-500/[0.07] text-sky-600 dark:text-sky-300',
  air: 'border-transparent bg-amber-500/[0.07] text-amber-600 dark:text-amber-300',
  verified: 'border-transparent bg-emerald-500/[0.07] text-emerald-600 dark:text-emerald-300',
  boundary: 'border-transparent bg-primary/[0.06] text-primary',
}

const sizeStyles = {
  sm: 'h-5 w-5 rounded-md [&_svg]:h-3.5 [&_svg]:w-3.5',
  md: 'h-6 w-6 rounded-md [&_svg]:h-4 [&_svg]:w-4',
  lg: 'h-7 w-7 rounded-lg [&_svg]:h-[1.125rem] [&_svg]:w-[1.125rem]',
}

function CategoryGlyph({ category }: { category: CategoryIconKind }): ReactNode {
  switch (category) {
    case 'health':
      return <HospitalIcon />
    case 'green':
      return <TreeIcon />
    case 'school':
      return <SchoolIcon />
    case 'transit':
      return <BusIcon />
    case 'water':
      return <span className="h-0.5 w-3.5 rounded-full bg-current shadow-[0_0_5px_currentColor]" />
    case 'air':
      return <WindIcon />
    case 'verified':
      return <CheckCircleIcon />
    case 'boundary':
      return <span className="h-0.5 w-3 rounded-full bg-current" />
  }
}

/**
 * Satu sistem badge ikon untuk seluruh kategori dashboard.
 * Ukuran, radius, border, dan ketebalan simbol konsisten di setiap card.
 */
export function CategoryIconBadge({
  category,
  size = 'md',
  active = false,
  className,
  label,
}: CategoryIconBadgeProps) {
  return (
    <span
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        'inline-flex shrink-0 items-center justify-center border transition-colors duration-150 [&_svg]:stroke-[1.85]',
        categoryStyles[category],
        sizeStyles[size],
        active && 'bg-current/[0.11] ring-1 ring-current/15',
        className,
      )}
    >
      <CategoryGlyph category={category} />
    </span>
  )
}
