import { useGSAP } from '@gsap/react'
import { useRef, useState } from 'react'
import { DrawSVGPlugin } from '../../lib/gsap/DrawSVGPlugin.js'
import { gsap } from '../../lib/gsap/index.js'
import { cn } from '../../lib/utils'

gsap.registerPlugin(useGSAP, DrawSVGPlugin)

interface ProgressBarProps {
  value: number
  className?: string
}

export function ProgressBar({ value, className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const fillRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (fillRef.current) {
      gsap.to(fillRef.current, {
        width: `${clamped}%`,
        duration: 0.6,
        ease: 'power2.out',
      })
    }
  }, [clamped])

  return (
    <div
      className={cn(
        'h-1.5 w-full rounded-full bg-surface-secondary overflow-hidden relative',
        className,
      )}
    >
      <div ref={fillRef} className="h-full rounded-full bg-accent" style={{ width: '0%' }} />
    </div>
  )
}

interface ProgressRingProps {
  value: number
  size?: number
  label?: string
}

export function ProgressRing({ value, size = 90, label }: ProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const stroke = 8
  const radius = (size - stroke) / 2

  const [percent, setPercent] = useState(0)
  const circleRef = useRef<SVGCircleElement>(null)

  useGSAP(() => {
    const obj = { val: percent }
    gsap.to(obj, {
      val: clamped,
      duration: 1.0,
      ease: 'power2.out',
      onUpdate: () => {
        setPercent(obj.val)
      },
    })

    if (circleRef.current) {
      gsap.to(circleRef.current, {
        drawSVG: `${clamped}%`,
        duration: 1.0,
        ease: 'power2.out',
      })
    }
  }, [clamped])

  const angleRad = (percent * 3.6 - 90) * (Math.PI / 180)
  const dotCx = size / 2 + radius * Math.cos(angleRad)
  const dotCy = size / 2 + radius * Math.sin(angleRad)

  return (
    <div className="flex items-center gap-6">
      <svg
        width={size}
        height={size}
        className="-rotate-90 shrink-0 overflow-visible"
        role="img"
        aria-label={`${clamped} percent complete`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-secondary)"
          strokeWidth={stroke}
        />
        <circle
          ref={circleRef}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {clamped > 0 && (
          <circle
            cx={dotCx}
            cy={dotCy}
            r={4.5}
            fill="var(--accent)"
            className="orbit-dot"
            style={{ filter: 'drop-shadow(0 0 5px var(--accent))' }}
          />
        )}
      </svg>
      <div className="flex flex-col">
        <span
          data-testid="percent-complete"
          className="text-[28px] leading-tight font-bold text-ink"
        >
          {Math.round(percent)}%
        </span>
        {label && <span className="text-xs text-ink-secondary mt-0.5">{label}</span>}
      </div>
    </div>
  )
}
