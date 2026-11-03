import { Snackbar, type SnackbarTone } from './ui/Snackbar'
import { useNetworkStatus, type NetworkStatus } from '../hooks/useNetworkStatus'
import { useTranslation } from '../i18n/useTranslation'

export function ConnectionSnackbar() {
  const { t } = useTranslation()
  const { status, isVisible, retry } = useNetworkStatus()
  const tone: Record<NetworkStatus, SnackbarTone> = {
    online: 'success', offline: 'error', 'server-unreachable': 'error', checking: 'warning', recovered: 'success',
  }
  const content = {
    title: t(`connection.${status}.title`),
    message: t(`connection.${status}.message`),
    tone: tone[status],
  }
  const canRetry = status === 'offline' || status === 'server-unreachable'

  return (
    <Snackbar
      isOpen={isVisible}
      title={content.title}
      message={content.message}
      tone={content.tone}
      action={
        canRetry ? (
          <button
            type="button"
            onClick={() => void retry()}
            className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-label={t('connection.retry')}
          >
            {t('connection.retry')}
          </button>
        ) : undefined
      }
    />
  )
}
