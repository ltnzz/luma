interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps {
  label: string
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

export function Select({
  label,
  options,
  value,
  onChange,
  disabled = false,
  className,
}: SelectProps) {
  return (
    <div className={className}>
      <p className="text-xs text-muted">{label}</p>
      <select
        className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}