import { AnimatePresence, motion } from 'framer-motion'
import {
  BadgePoundSterling,
  GraduationCap,
  HeartPulse,
  Landmark,
  Languages,
  ShieldCheck,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

// The official source CATEGORIES StudYou signposts. Deliberately lucide
// glyphs, not real government logos: reproducing gov.uk / UCAS / NHS brand
// marks carries usage constraints, and the point here is the promise ("every
// step comes from an official source"), not a logo wall.
const SOURCES = [
  {
    key: 'ukvi',
    icon: ShieldCheck,
    name: 'UK Visas & Immigration',
    role: 'Student visa, IHS, and financial requirements',
  },
  {
    key: 'govuk',
    icon: Landmark,
    name: 'GOV.UK',
    role: 'Official rules, fees, and application routes',
  },
  {
    key: 'ucas',
    icon: GraduationCap,
    name: 'UCAS & universities',
    role: 'Entry requirements and admissions links',
  },
  {
    key: 'nhs',
    icon: HeartPulse,
    name: 'NHS',
    role: 'Healthcare access and GP registration',
  },
  {
    key: 'ielts',
    icon: Languages,
    name: 'IELTS & English tests',
    role: 'Approved test bookings and score targets',
  },
  {
    key: 'funds',
    icon: BadgePoundSterling,
    name: 'Proof of funds',
    role: 'Real tuition and living-cost figures',
  },
] as const

const CENTER = (SOURCES.length - 1) / 2

// A gentle arc: tiles farther from centre rotate outward and drop, giving the
// fanned look from the reference without any layout dependency. Only applied
// on wider viewports; on mobile the tiles sit in a flat wrapped grid.
function arcTransform(index: number, active: boolean, wide: boolean): string {
  if (!wide) return active ? 'scale(1.08)' : 'scale(1)'
  if (active) return 'translateY(-12px) scale(1.14)'
  const offset = index - CENTER
  const rotate = offset * 7
  const drop = Math.abs(offset) * 9
  return `translateY(${drop}px) rotate(${rotate}deg)`
}

function useMinWidth(px: number): boolean {
  const [matches, setMatches] = useState(
    () => window.matchMedia?.(`(min-width: ${px}px)`).matches ?? true,
  )
  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${px}px)`)
    const onChange = () => setMatches(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [px])
  return matches
}

export function OfficialSourcesOrbit() {
  const wide = useMinWidth(640)
  const reducedMotion = useRef(
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  )
  const [active, setActive] = useState(0)

  // Auto-advance the highlight, paused while the tab is hidden and disabled
  // entirely under reduced motion (where every tile stays equally lit).
  useEffect(() => {
    if (reducedMotion.current) return
    let id: ReturnType<typeof setInterval> | undefined
    const start = () => {
      if (!id) id = setInterval(() => setActive((a) => (a + 1) % SOURCES.length), 2200)
    }
    const stop = () => {
      if (id) {
        clearInterval(id)
        id = undefined
      }
    }
    start()
    const onVisibility = () => (document.hidden ? stop() : start())
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const dimInactive = !reducedMotion.current
  const activeSource = SOURCES[active]

  return (
    <section
      aria-label="StudYou signposts every step from official sources"
      className="relative z-10 mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 text-center"
    >
      <p className="text-caption font-semibold uppercase tracking-[0.18em] text-accent">
        No middlemen, no guesswork
      </p>
      <h2 className="mx-auto mt-2 max-w-2xl font-podium text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
        Every step comes from an{' '}
        <span className="bg-clip-text text-transparent [background-image:var(--accent-gradient)]">
          official source
        </span>
        .
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-secondary">
        StudYou never invents a rule or a fee. Every requirement links straight back to where it is
        published.
      </p>

      {/* Fanned arc of source tiles */}
      <div className="mt-12 flex flex-wrap items-end justify-center gap-3 sm:mt-16 md:flex-nowrap md:gap-4">
        {SOURCES.map((source, i) => {
          const Icon = source.icon
          const isActive = i === active
          return (
            <button
              key={source.key}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`${source.name}: ${source.role}`}
              aria-pressed={isActive}
              className="group relative shrink-0 cursor-pointer rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-accent"
              style={{
                transform: arcTransform(i, isActive, wide),
                transition: 'transform 450ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <span
                className={`flex h-16 w-16 items-center justify-center rounded-2xl border backdrop-blur-xl transition-colors duration-300 sm:h-[4.5rem] sm:w-[4.5rem] ${
                  isActive
                    ? 'border-accent/60 bg-[color:var(--surface)]/80 text-accent shadow-[0_0_28px_-6px_var(--accent)]'
                    : `border-white/10 bg-[color:var(--canvas)]/70 text-ink-tertiary ${dimInactive ? 'opacity-55' : 'opacity-100'} group-hover:opacity-100`
                }`}
              >
                <Icon size={26} strokeWidth={2} />
              </span>
            </button>
          )
        })}
      </div>

      {/* Active source caption. Under reduced motion the highlight never moves,
          so state a single summary line instead of naming one source. */}
      <div className="mt-10 min-h-[3.5rem]">
        {reducedMotion.current ? (
          <p className="text-sm text-ink-secondary">
            Sourced directly from UKVI, GOV.UK, UCAS, the NHS, approved English tests, and published
            cost data.
          </p>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSource.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="text-base font-bold text-white sm:text-lg">{activeSource.name}</p>
              <p className="mt-1 text-sm text-ink-secondary">{activeSource.role}</p>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </section>
  )
}
