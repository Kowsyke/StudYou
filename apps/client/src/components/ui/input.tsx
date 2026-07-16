import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { cn } from '../../lib/utils'

const fieldClasses =
  'w-full h-10 px-3.5 rounded-xl bg-surface border border-hairline text-sm text-ink placeholder:text-ink-muted transition-shadow focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClasses, className)} {...props} />
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(fieldClasses, 'appearance-none pr-8 cursor-pointer', className)}
      {...props}
    >
      {children}
    </select>
  )
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClasses, 'h-auto min-h-24 py-2.5', className)} {...props} />
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('block text-sm font-medium text-ink-secondary mb-1.5', className)}
      {...props}
    />
  )
}
