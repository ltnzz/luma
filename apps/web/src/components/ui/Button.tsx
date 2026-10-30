import type { ReactNode } from 'react'

interface ButtonProps {
  variant?: 'default' | 'primary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
  children: ReactNode
  onClick?: () => void
}

export function Button({
  variant = 'primary',
  size = 'md',
  disabled,
  className,
  children,
  onClick,
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center rounded-md text-sm font-medium'

  const variantClasses = {
    default: 'bg-background text-text hover:bg-accent',
    primary: 'bg-primary text-on-primary hover:bg-primary-hover',
    danger: 'bg-danger text-on-danger hover:bg-danger-hover',
  }

  const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className || ''}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}