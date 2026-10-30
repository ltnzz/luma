import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/utils'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  size?: ModalSize
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEsc?: boolean
  footer?: ReactNode
  children: ReactNode
  className?: string
  ariaLabel?: string
}

const ANIMATION_DURATION_MS = 180

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)]',
}

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

let bodyScrollLockCount = 0
let originalBodyOverflow = ''
let originalBodyPaddingRight = ''

function lockBodyScroll() {
  if (bodyScrollLockCount === 0) {
    originalBodyOverflow = document.body.style.overflow
    originalBodyPaddingRight = document.body.style.paddingRight

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
  }

  bodyScrollLockCount += 1
}

function unlockBodyScroll() {
  bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1)

  if (bodyScrollLockCount === 0) {
    document.body.style.overflow = originalBodyOverflow
    document.body.style.paddingRight = originalBodyPaddingRight
  }
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  footer,
  children,
  className,
  ariaLabel = 'Dialog',
}: ModalProps) {
  const [isMounted, setIsMounted] = useState(isOpen)
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    let mountFrame: number | undefined
    let unmountTimer: number | undefined

    if (isOpen && !isMounted) {
      mountFrame = window.requestAnimationFrame(() => setIsMounted(true))
    } else if (isMounted) {
      unmountTimer = window.setTimeout(
        () => setIsMounted(false),
        ANIMATION_DURATION_MS,
      )
    }

    return () => {
      window.cancelAnimationFrame(mountFrame ?? 0)
      window.clearTimeout(unmountTimer)
    }
  }, [isMounted, isOpen])

  useEffect(() => {
    if (!isOpen) return

    lockBodyScroll()
    return unlockBodyScroll
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !isMounted) return

    const previouslyFocusedElement = document.activeElement as HTMLElement | null
    const focusTimer = window.requestAnimationFrame(() => {
      const firstFocusableElement =
        dialogRef.current?.querySelector<HTMLElement>(focusableSelector)

      ;(firstFocusableElement ?? dialogRef.current)?.focus()
    })

    return () => {
      window.cancelAnimationFrame(focusTimer)
      previouslyFocusedElement?.focus()
    }
  }, [isMounted, isOpen])

  useEffect(() => {
    if (!isOpen || !closeOnEsc) return

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [closeOnEsc, isOpen, onClose])

  if (!isMounted || typeof document === 'undefined') return null

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose()
    }
  }

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return

    const focusableElements = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
    )

    if (focusableElements.length === 0) {
      event.preventDefault()
      dialogRef.current?.focus()
      return
    }

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }

  return createPortal(
    <div
      className="luma-modal-overlay fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-md dark:bg-black/55"
      data-state={isOpen ? 'open' : 'closed'}
      onMouseDown={handleOverlayClick}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title ? undefined : ariaLabel}
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          'luma-modal-container relative flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-2xl sm:rounded-3xl',
          'border border-white/10 bg-[rgba(7,20,17,0.8)] text-white backdrop-blur-2xl',
          'shadow-[0_32px_100px_-28px_rgba(0,0,0,0.85),0_0_48px_-28px_rgba(45,212,191,0.32),inset_0_1px_0_rgba(255,255,255,0.12)]',
          'before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/35 before:to-transparent',
          sizeClasses[size],
          className,
        )}
        data-state={isOpen ? 'open' : 'closed'}
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {(title || description || showCloseButton) && (
          <header className="flex shrink-0 items-start gap-4 border-b border-white/10 bg-white/[0.025] px-5 py-4 sm:px-6">
            <div className="min-w-0 flex-1">
              {title && (
                <h2 id={titleId} className="text-lg font-semibold leading-7 text-white">
                  {title}
                </h2>
              )}
              {description && (
                <div
                  id={descriptionId}
                  className={cn('text-sm text-white/60', Boolean(title) && 'mt-1')}
                >
                  {description}
                </div>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                aria-label="Tutup dialog"
                className="-mr-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/60 transition hover:border-white/20 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                onClick={onClose}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            )}
          </header>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>

        {footer && (
          <footer className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-white/10 bg-black/10 px-5 py-4 sm:px-6">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  )
}

