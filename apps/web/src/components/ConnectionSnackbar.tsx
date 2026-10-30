import { Snackbar, type SnackbarTone } from './ui/Snackbar'
import { useNetworkStatus, type NetworkStatus } from '../hooks/useNetworkStatus'

const copy: Record<NetworkStatus, { title: string; message: string; tone: SnackbarTone }> = {
  online: { title: '', message: '', tone: 'success' },
  offline: {
    title: 'Koneksi internet terputus',
    message: 'Data terbaru belum dapat dimuat. Periksa koneksi internet Anda.',
    tone: 'error',
  },
  'server-unreachable': {
    title: 'Koneksi ke server terputus',
    message: 'Luma tetap dapat digunakan. Coba lagi untuk memuat data terbaru.',
    tone: 'error',
  },
  checking: {
    title: 'Menghubungkan kembali…',
    message: 'Luma sedang memeriksa koneksi ke server.',
    tone: 'warning',
  },
  recovered: {
    title: 'Koneksi kembali normal',
    message: 'Data Luma sedang diperbarui.',
    tone: 'success',
  },
}

export function ConnectionSnackbar() {
  const { status, isVisible, retry } = useNetworkStatus()
  const content = copy[status]
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
            className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
          >
            Coba Lagi
          </button>
        ) : undefined
      }
    />
  )
}
