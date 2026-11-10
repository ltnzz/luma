import { Snackbar, type SnackbarTone } from './ui/Snackbar'
import { useNetworkStatus, type NetworkStatus } from '../hooks/useNetworkStatus'
import { useTranslation } from '../i18n/useTranslation'

function ConnectionIcon({ status }: { status: NetworkStatus }) {
  if (status === 'recovered') {
    return (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (status === 'checking') {
    return (
      <svg viewBox="0 0 24 24" className="size-5 animate-spin" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12a9 9 0 1 1-3-6.7" strokeLinecap="round" />
      </svg>
    )
  }

  if (status === 'offline') {
    return (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M2 8.8A16 16 0 0 1 6.1 6.6M9.8 5.1A16.2 16.2 0 0 1 22 8.8M5 12.4a11 11 0 0 1 4.1-2.2m4.2-.5a11 11 0 0 1 5.7 2.7M8.5 16a5.8 5.8 0 0 1 7 0M12 20h.01M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="3" width="16" height="7" rx="2" />
      <rect x="4" y="14" width="16" height="7" rx="2" />
      <path d="M8 6.5h.01M8 17.5h.01M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

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
      icon={<ConnectionIcon status={status} />}
      placement="center"
      action={
        canRetry ? (
          <button
            type="button"
            onClick={() => void retry()}
            className="w-full rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-xs font-bold text-danger transition hover:bg-danger/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger sm:w-auto"
            aria-label={t('connection.retry')}
          >
            {t('connection.retry')}
          </button>
        ) : undefined
      }
    />
  )
}
