import { useGSAP } from '@gsap/react'
import { useState } from 'react'
import { gsap } from '../../lib/gsap/index.js'
import { usePreferencesStore } from '../../store/preferencesStore'

gsap.registerPlugin(useGSAP)

function osReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

interface CountUpProps {
  /** The final numeric value to count to. */
  value: number
  /** Formats the running number into display text (e.g. currency, percent). */
  format?: (n: number) => string
  /** Seconds; kept inside the design system motion budget. */
  duration?: number
  className?: string
}

/*
  A number that counts from zero up to `value` on mount, and re-counts from
  the previous value whenever `value` changes. It honours both the app's
  reduce-motion preference and the OS prefers-reduced-motion setting by
  showing the final value immediately, so the number is always readable and
  never animates for users who opted out.
*/
export function CountUp({ value, format, duration = 0.9, className }: CountUpProps) {
  const reduceMotion = usePreferencesStore((s) => s.reduceMotion)
  const fmt = format ?? ((n: number) => String(Math.round(n)))
  const [display, setDisplay] = useState(() => (reduceMotion || osReducedMotion() ? value : 0))

  useGSAP(() => {
    if (reduceMotion || osReducedMotion()) {
      setDisplay(value)
      return
    }
    const obj = { n: display }
    gsap.to(obj, {
      n: value,
      duration,
      ease: 'power2.out',
      onUpdate: () => setDisplay(obj.n),
    })
    // display is intentionally read once as the animation start point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduceMotion])

  return <span className={className}>{fmt(display)}</span>
}
