import { type VariantProps, cva } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-semibold select-none transition-all duration-[120ms] outline-none focus-visible:[box-shadow:0_0_0_2px_var(--canvas),0_0_0_4px_var(--accent)] disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-white hover:bg-accent-hover active:bg-accent-pressed',
        secondary:
          'bg-surface text-ink border border-hairline-strong shadow-sm hover:bg-surface-secondary',
        ghost: 'text-ink-secondary hover:bg-surface-secondary hover:text-ink',
        danger: 'bg-danger-soft text-danger hover:bg-danger hover:text-white',
      },
      size: {
        sm: 'h-8 px-3 text-body rounded-sm',
        md: 'h-9 px-3.5 text-body rounded-sm',
        lg: 'h-11 px-5 text-body-lg rounded-sm',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, type = 'button', ...props }: ButtonProps) {
  return (
    <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
}
