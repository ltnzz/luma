import { useTranslation } from '../../i18n/useTranslation'
import type { TranslationKey } from '../../i18n/dictionaries'
import type { ApiError } from '../../lib/api'
import { Button } from './Button'

function errorMessageKey(error: ApiError | null): TranslationKey {
  if (!error) return 'error.generic'
  if (error.kind === 'http') {
    if (error.status === 429) return 'error.rateLimit.429'
    if (error.status === 404) return 'error.notFound'
    if (error.status !== undefined && error.status >= 500) return 'error.server.500'
    return 'error.generic'
  }
  if (error.kind === 'network') return 'error.network'
  if (error.kind === 'timeout') return 'error.timeout'
  return 'error.generic'
}

interface ErrorBannerProps {
  error: ApiError | null
  onRetry?: () => void
  className?: string
}

/**
 * Responsive error surface handling the backend contract:
 * HTTP 429 (rate limit), HTTP 5xx, network failures, timeouts, empty payloads.
 */
export function ErrorBanner({ error, onRetry, className }: ErrorBannerProps) {
  const { t } = useTranslation()

  return (
    <div
      role="alert"
      className={
        className ??
        'flex items-start justify-between gap-4 rounded-lg border border-danger/40 bg-danger/5 px-4 py-3'
      }
    >
      <p className="text-sm text-danger">{t(errorMessageKey(error))}</p>
      {onRetry ? (
        <Button variant="danger" size="sm" onClick={onRetry} className="shrink-0">
          {t('common.retry')}
        </Button>
      ) : null}
    </div>
  )
}
