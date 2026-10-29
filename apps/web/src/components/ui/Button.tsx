import type { ReactNode } from 'react'

interface ButtonProps {
  variant?: 'default' | 'primary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
  /** Native tooltip (e.g. phase-gated actions). */
  title?: string
  children: ReactNode
  onClick?: () => void
}

export function Button({
  variant = 'primary',
  size = 'md',
  disabled,
  className,
  type = 'button',
  title,
  children,
  onClick,
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center rounded-md text-sm font-medium'

  const variantClasses = {
    default: 'bg-surface text-foreground border border-border hover:bg-surface-muted',
    primary: 'bg-primary text-on-primary hover:bg-primary-hover',
    danger: 'border border-danger text-danger hover:bg-danger/10',
  }

  const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  }

  const disabledClasses = disabled
    ? 'cursor-not-allowed opacity-50'
    : 'cursor-pointer'

  return (
    <button
      type={type}
      title={title}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className || ''}`}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
    >
      {children}
    </button>
  )
}
