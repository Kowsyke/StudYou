import { cn } from '../../lib/utils'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  hint?: string
  id: string
}

/* Accessible toggle switch in the mac style: a real button with the
   switch role, animated knob, gradient track when on. */
export function Switch({ checked, onChange, label, hint, id }: SwitchProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="min-w-0">
        <label htmlFor={id} className="block text-body font-medium text-ink cursor-pointer">
          {label}
        </label>
        {hint && <span className="block text-caption text-ink-tertiary mt-0.5">{hint}</span>}
      </span>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-10 shrink-0 rounded-full transition-colors duration-[200ms]',
          checked
            ? 'bg-accent-solid [background-image:var(--accent-gradient)]'
            : 'bg-surface-secondary border border-hairline-strong',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'absolute top-1/2 -translate-y-1/2 h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-[left] duration-[200ms]',
            checked ? 'left-[19px]' : 'left-[3px]',
          )}
        />
      </button>
    </div>
  )
}
