import { useTranslation } from '../../../i18n/useTranslation'

export function StatusBadge() {
  const { t } = useTranslation()

  return (
    <span className="inline-flex rounded-full bg-surface-muted px-3 py-1 text-sm font-medium text-primary">
      {t('home.status')}
    </span>
  )
}