interface EmptyStateProps {
  title: string
  description?: string
  className?: string
}

/**
 * Inline empty state following the Figma "Data belum tersedia" treatment.
 */
export function EmptyState({ title, description, className }: EmptyStateProps) {
  return (
    <div
      className={
        className ??
        'rounded-lg border border-dashed border-border bg-surface-muted/50 px-4 py-6 text-center'
      }
    >
      <p className="text-sm font-medium text-muted">{title}</p>
      {description ? (
        <p className="mt-1 text-xs text-muted">{description}</p>
      ) : null}
    </div>
  )
}
