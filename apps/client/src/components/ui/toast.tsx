import { useGSAP } from '@gsap/react'
import { CheckCircle2, CircleAlert, X } from 'lucide-react'
import { useRef } from 'react'
import { DrawSVGPlugin } from '../../lib/gsap/DrawSVGPlugin.js'
import { gsap } from '../../lib/gsap/index.js'
import { useToastStore } from '../../store/toastStore'

gsap.registerPlugin(useGSAP, DrawSVGPlugin)

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 w-80 max-w-[calc(100vw-2.5rem)] pointer-events-none">
      {toasts.map((item) => (
        <ToastItem key={item.id} item={item} onDismiss={dismiss} />
      ))}
    </div>
  )
}

function ToastItem({
  item,
  onDismiss,
}: {
  item: { id: number; kind: 'success' | 'error'; message: string }
  onDismiss: (id: number) => void
}) {
  const elementRef = useRef<HTMLDivElement>(null)
  const progressPathRef = useRef<SVGPathElement>(null)

  useGSAP(() => {
    if (elementRef.current) {
      // Physics2D-like bounce entrance
      gsap.fromTo(
        elementRef.current,
        { opacity: 0, scale: 0.88, y: 35, x: 20 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          x: 0,
          duration: 0.5,
          ease: 'power3.out',
        },
      )
    }

    if (progressPathRef.current) {
      // DrawSVG countdown progress line: shrinks from 100% to 0% over 3.1s
      gsap.fromTo(
        progressPathRef.current,
        { drawSVG: '100%' },
        {
          drawSVG: '0%',
          duration: 3.1,
          ease: 'linear',
          onComplete: () => {
            // Trigger custom GSAP exit animation right before store cleanup
            if (elementRef.current) {
              gsap.to(elementRef.current, {
                opacity: 0,
                scale: 0.9,
                y: -15,
                duration: 0.25,
                ease: 'power2.in',
                onComplete: () => onDismiss(item.id),
              })
            } else {
              onDismiss(item.id)
            }
          },
        },
      )
    }
  }, [])

  const handleManualDismiss = () => {
    if (elementRef.current) {
      gsap.to(elementRef.current, {
        opacity: 0,
        scale: 0.9,
        y: -15,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => onDismiss(item.id),
      })
    } else {
      onDismiss(item.id)
    }
  }

  return (
    <div
      ref={elementRef}
      className="relative overflow-hidden flex items-center gap-3 bg-surface border border-hairline-strong shadow-lg rounded-md pl-4 pr-3 py-3 pointer-events-auto select-none"
      aria-live="polite"
    >
      <span
        className={`absolute left-0 top-0 bottom-0 w-1 ${
          item.kind === 'success' ? 'bg-positive' : 'bg-danger'
        }`}
      />
      {item.kind === 'success' ? (
        <CheckCircle2 size={18} className="text-positive shrink-0" />
      ) : (
        <CircleAlert size={18} className="text-danger shrink-0" />
      )}
      <span className="flex-1 min-w-0 text-xs font-semibold text-ink leading-snug">
        {item.message}
      </span>
      <button
        onClick={handleManualDismiss}
        className="text-ink-tertiary hover:text-ink transition-colors duration-[120ms] shrink-0 rounded-xs cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>

      {/* DrawSVG auto-dismiss progress path */}
      <svg
        className="absolute bottom-0 left-0 right-0 h-[2px] pointer-events-none"
        viewBox="0 0 100 2"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          ref={progressPathRef}
          d="M0 1 L100 1"
          stroke={item.kind === 'success' ? 'var(--positive)' : 'var(--danger)'}
          strokeWidth="3.5"
          fill="none"
        />
      </svg>
    </div>
  )
}
