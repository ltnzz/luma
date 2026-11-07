import type { ReactNode } from 'react'

import { cn } from '../../lib/utils'

export type SnackbarTone = 'warning' | 'error' | 'success'

interface SnackbarProps {
  isOpen: boolean
  title: string
  message?: string
  tone?: SnackbarTone
  icon?: ReactNode
  action?: ReactNode
  placement?: 'bottom' | 'center'
  className?: string
}

const toneClasses: Record<SnackbarTone, string> = {
  warning: 'bg-amber-400',
  error: 'bg-red-500',
  success: 'bg-emerald-400',
}

const toneIconClasses: Record<SnackbarTone, string> = {
  warning: 'border-amber-500/20 bg-amber-400/10 text-amber-600 dark:text-amber-300',
  error: 'border-danger/25 bg-danger/10 text-danger',
  success: 'border-emerald-500/20 bg-emerald-400/10 text-emerald-700 dark:text-emerald-300',
}

const toneTitleClasses: Record<SnackbarTone, string> = {
  warning: 'text-amber-700 dark:text-amber-300',
  error: 'text-danger',
  success: 'text-emerald-700 dark:text-emerald-300',
}

export function Snackbar({
  isOpen,
  title,
  message,
  tone = 'warning',
  icon,
  action,
  placement = 'bottom',
  className,
}: SnackbarProps) {
  if (!isOpen) return null

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 z-[70] flex justify-center px-4',
        placement === 'center'
          ? 'top-1/2 -translate-y-1/2'
          : 'bottom-[5.5rem] sm:bottom-[5.25rem]',
      )}
    >
      <div
        role={tone === 'error' ? 'alert' : 'status'}
        aria-live={tone === 'error' ? 'assertive' : 'polite'}
        className={cn(
          'luma-snackbar luma-glass pointer-events-auto flex w-full max-w-md flex-col items-stretch gap-3 overflow-hidden rounded-2xl sm:flex-row sm:items-center',
          'p-3.5 text-foreground sm:p-4',
          'shadow-[0_24px_70px_-24px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.14)]',
          className,
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {icon ? (
            <span
              aria-hidden="true"
              className={cn(
                'grid size-10 shrink-0 place-items-center rounded-xl border',
                toneIconClasses[tone],
              )}
            >
              {icon}
            </span>
          ) : (
            <span aria-hidden="true" className={cn('size-2.5 shrink-0 rounded-full', toneClasses[tone])} />
          )}
          <div className="min-w-0 flex-1">
            <p className={cn('text-sm font-bold leading-5', toneTitleClasses[tone])}>{title}</p>
            {message ? <p className="mt-0.5 text-[11.5px] leading-4.5 text-foreground/75">{message}</p> : null}
          </div>
        </div>
        {action ? <div className="w-full shrink-0 sm:w-auto">{action}</div> : null}
      </div>
    </div>
  )
}
