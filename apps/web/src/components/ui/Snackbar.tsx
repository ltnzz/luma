import type { ReactNode } from 'react'

import { cn } from '../../lib/utils'

export type SnackbarTone = 'warning' | 'error' | 'success'

interface SnackbarProps {
  isOpen: boolean
  title: string
  message?: string
  tone?: SnackbarTone
  action?: ReactNode
  className?: string
}

const toneClasses: Record<SnackbarTone, string> = {
  warning: 'bg-amber-400',
  error: 'bg-red-500',
  success: 'bg-emerald-400',
}

export function Snackbar({
  isOpen,
  title,
  message,
  tone = 'warning',
  action,
  className,
}: SnackbarProps) {
  if (!isOpen) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex justify-center px-4 sm:bottom-6">
      <div
        role={tone === 'error' ? 'alert' : 'status'}
        aria-live={tone === 'error' ? 'assertive' : 'polite'}
        className={cn(
          'luma-snackbar pointer-events-auto flex w-full max-w-xl items-start gap-3 overflow-hidden rounded-2xl',
          'border border-white/15 bg-[rgba(7,20,17,0.84)] p-4 text-white backdrop-blur-2xl',
          'shadow-[0_24px_70px_-24px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.14)]',
          className,
        )}
      >
        <span aria-hidden="true" className={cn('mt-1 size-2.5 shrink-0 rounded-full', toneClasses[tone])} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">{title}</p>
          {message ? <p className="mt-0.5 text-xs leading-5 text-white/65">{message}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  )
}
