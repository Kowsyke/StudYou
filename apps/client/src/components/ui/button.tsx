import { useGSAP } from '@gsap/react'
import { type VariantProps, cva } from 'class-variance-authority'
import React, { type ButtonHTMLAttributes, useRef } from 'react'
import { gsap } from '../../lib/gsap/index.js'
import { cn } from '../../lib/utils'

gsap.registerPlugin(useGSAP)

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-semibold select-none transition-all duration-[120ms] outline-none focus-visible:[box-shadow:0_0_0_2px_var(--canvas),0_0_0_4px_var(--accent)] disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] relative overflow-hidden',
  {
    variants: {
      variant: {
        primary:
          'sheen bg-accent-solid text-white shadow-md [background-image:var(--accent-gradient)] hover:[background-image:var(--accent-gradient-hover)] active:bg-accent-solid-pressed active:[background-image:none]',
        secondary:
          'bg-surface text-ink border border-hairline-strong shadow-sm hover:bg-surface-secondary',
        ghost: 'text-ink-secondary hover:bg-surface-secondary hover:text-ink',
        danger: 'bg-danger-soft text-danger hover:bg-danger-solid hover:text-white',
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
    VariantProps<typeof buttonVariants> {
  magnetic?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', magnetic = false, onMouseDown, ...props }, ref) => {
    const localRef = useRef<HTMLButtonElement>(null)

    // Sync forwarded ref with localRef
    useGSAP(() => {
      const el = localRef.current
      if (!el) return

      if (typeof ref === 'function') {
        ref(el)
      } else if (ref) {
        // biome-ignore lint/suspicious/noExplicitAny: React forwardRef sync
        ;(ref as any).current = el
      }

      if (!magnetic) return

      const onMouseMove = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect()
        const x = e.clientX - rect.left - rect.width / 2
        const y = e.clientY - rect.top - rect.height / 2

        gsap.to(el, {
          x: x * 0.35,
          y: y * 0.35,
          duration: 0.28,
          ease: 'power2.out',
          overwrite: 'auto',
        })
      }

      const onMouseLeave = () => {
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: 'power3.out',
          overwrite: 'auto',
        })
      }

      el.addEventListener('mousemove', onMouseMove)
      el.addEventListener('mouseleave', onMouseLeave)

      return () => {
        el.removeEventListener('mousemove', onMouseMove)
        el.removeEventListener('mouseleave', onMouseLeave)
      }
    }, [magnetic, ref])

    const handlePointerDown = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (onMouseDown) onMouseDown(e)
      const el = localRef.current
      if (!el) return

      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const ripple = document.createElement('span')
      ripple.className =
        'absolute bg-white/35 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 scale-0'
      ripple.style.left = `${x}px`
      ripple.style.top = `${y}px`
      ripple.style.width = `${Math.max(rect.width, rect.height) * 2.2}px`
      ripple.style.height = `${Math.max(rect.width, rect.height) * 2.2}px`

      el.appendChild(ripple)

      gsap.fromTo(
        ripple,
        { scale: 0, opacity: 0.75 },
        {
          scale: 1,
          opacity: 0,
          duration: 0.5,
          ease: 'power2.out',
          onComplete: () => ripple.remove(),
        },
      )
    }

    return (
      <button
        ref={localRef}
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        onMouseDown={handlePointerDown}
        {...props}
      />
    )
  },
)

Button.displayName = 'Button'
