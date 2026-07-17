import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { cn } from '../../lib/utils'

const fieldClasses =
  'w-full h-9 px-3 rounded-sm bg-surface border border-hairline-strong text-body text-ink placeholder:text-ink-tertiary outline-none transition-[border-color,box-shadow] duration-[120ms] hover:border-ink-tertiary focus:border-accent focus:[box-shadow:0_0_0_3px_var(--accent-soft)]'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClasses, className)} {...props} />
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(fieldClasses, 'appearance-none pr-8 cursor-pointer font-medium', className)}
      {...props}
    >
      {children}
    </select>
  )
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClasses, 'h-auto min-h-24 py-2', className)} {...props} />
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('block text-xs font-semibold text-ink-secondary mb-1.5', className)}
      {...props}
    />
  )
}
