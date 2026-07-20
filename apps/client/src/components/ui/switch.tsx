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
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'group relative h-6 w-10 shrink-0 rounded-full cursor-pointer',
          'transition-[background-color,box-shadow,transform] duration-[200ms]',
          'outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
          'active:scale-[0.96]',
          checked
            ? 'bg-accent-solid [background-image:var(--accent-gradient)] hover:brightness-110'
            : 'bg-surface-secondary border border-hairline-strong hover:border-accent',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'absolute top-1/2 left-[3px] h-[18px] w-[18px] -translate-y-1/2 rounded-full bg-white shadow-sm',
            'transition-transform duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:shadow-md',
            checked ? 'translate-x-4' : 'translate-x-0',
          )}
        />
      </button>
    </div>
  )
}
