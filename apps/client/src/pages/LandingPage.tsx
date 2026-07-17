import { motion } from 'framer-motion'
import { ArrowRight, CalendarClock, Check, ShieldCheck, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { useAuthStore } from '../store/authStore'

const swift = [0.16, 1, 0.3, 1] as const

const headline = ['Your', 'UK', 'study', 'journey,', 'without', 'the', 'agencies.']

const marqueeItems = [
  'IELTS booking',
  'UCAS application',
  'CAS statement',
  'Student visa',
  'Health surcharge',
  'TB test',
  'Financial proof',
  'Accommodation',
  'eVisa status',
  'GP registration',
  'Bank account',
  'NI number',
  'Student discounts',
  'Driving licence',
]

const stats = [
  { value: '5', label: 'Journey stages' },
  { value: '21', label: 'Official steps' },
  { value: '12', label: 'Sourced resources' },
  { value: '0', label: 'Agency fees' },
]

export function LandingPage() {
  const token = useAuthStore((s) => s.token)
  if (token) return <Navigate to="/" replace />

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas">
      <div className="blob blob-a w-[420px] h-[420px] -top-24 -left-24" />
      <div className="blob blob-b w-[380px] h-[380px] top-1/3 -right-32" />

      <nav className="relative z-10 max-w-5xl mx-auto flex items-center justify-between px-6 py-5">
        <span className="flex items-center gap-2 text-body-lg font-bold tracking-[-0.01em]">
          <span className="w-6 h-6 rounded-xs bg-accent-solid text-white text-caption font-extrabold flex items-center justify-center [background-image:var(--accent-gradient)]">
            SY
          </span>
          StudYou
        </span>
        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link to="/register">
            <Button size="sm">
              Get started
              <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-14 pb-10 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: swift }}
            className="inline-flex items-center gap-1.5 bg-accent-soft text-accent text-caption font-semibold uppercase tracking-[0.05em] px-2.5 py-1 rounded-full mb-5"
          >
            <ShieldCheck size={12} />
            Every step from official sources
          </motion.p>

          <h1 className="text-title1 text-ink max-w-xl" aria-label={headline.join(' ')}>
            {headline.map((word, index) => (
              <motion.span
                key={word}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + index * 0.07, duration: 0.45, ease: swift }}
                className={`inline-block mr-[0.28em] ${
                  word === 'agencies.'
                    ? 'text-transparent bg-clip-text [background-image:var(--accent-gradient)]'
                    : ''
                }`}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.4, ease: swift }}
            className="text-body-lg text-ink-secondary max-w-md mt-5 leading-relaxed"
          >
            A personal, trackable roadmap through every official step of studying in the UK. Real
            costs, real deadlines, official sources. No commissions, no middlemen.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.4, ease: swift }}
            className="flex flex-wrap items-center gap-3 mt-8"
          >
            <Link to="/register">
              <Button size="lg">
                Start your roadmap
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg">
                Sign in
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.05, duration: 0.4 }}
            className="grid grid-cols-4 gap-4 mt-10 max-w-md"
          >
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-title3 text-ink tabular-nums">{stat.value}</p>
                <p className="text-caption text-ink-secondary mt-0.5">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <FloatingPreview />
      </main>

      <div className="relative z-10 border-y border-hairline bg-surface/60 backdrop-blur-sm py-3 overflow-hidden">
        <div className="marquee-track">
          {[...marqueeItems, ...marqueeItems].map((item, index) => (
            <span
              key={`${item}-${index >= marqueeItems.length ? 'b' : 'a'}`}
              className="shrink-0 text-caption font-semibold text-ink-secondary bg-surface border border-hairline rounded-full px-3 py-1.5 shadow-sm"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <footer className="relative z-10 max-w-5xl mx-auto px-6 py-6 text-caption text-ink-tertiary text-center leading-relaxed">
        StudYou provides guidance and signposting only. It is not legal or immigration advice.
        Always confirm details on official sources such as gov.uk.
      </footer>
    </div>
  )
}

/* A live miniature of the product: a task card that ticks itself, a
   progress ring that follows it, and a deadline chip, gently floating. */
function FloatingPreview() {
  const [ticked, setTicked] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setTicked((t) => !t), 2600)
    return () => clearInterval(timer)
  }, [])

  const percent = ticked ? 43 : 38
  const circumference = 2 * Math.PI * 30

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, duration: 0.5, ease: swift }}
      className="relative h-[340px] hidden lg:block select-none"
      aria-hidden="true"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        className="absolute top-2 left-4 w-64 bg-surface border border-hairline rounded-lg shadow-lg p-4"
      >
        <div className="flex items-start gap-2.5">
          <span
            className={`mt-0.5 h-4 w-4 shrink-0 rounded-xs border-[1.5px] flex items-center justify-center transition-colors duration-200 ${
              ticked ? 'bg-accent-solid border-accent-solid' : 'border-ink-tertiary bg-surface'
            }`}
          >
            <Check
              size={11}
              strokeWidth={4}
              className={`text-white transition-opacity duration-200 ${ticked ? 'opacity-100' : 'opacity-0'}`}
            />
          </span>
          <span
            className={`text-body font-medium transition-colors duration-200 ${
              ticked ? 'line-through text-ink-tertiary' : 'text-ink'
            }`}
          >
            Book and sit an approved English test
          </span>
        </div>
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-hairline text-caption text-ink-tertiary">
          <span className="font-semibold text-ink-secondary">£229</span>
          <span>Target 25 Nov</span>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 7, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut', delay: 1 }}
        className="absolute top-40 left-0 bg-surface border border-hairline rounded-lg shadow-lg p-4 flex items-center gap-4"
      >
        <svg width={68} height={68} className="-rotate-90" role="presentation">
          <circle
            cx={34}
            cy={34}
            r={30}
            fill="none"
            stroke="var(--surface-secondary)"
            strokeWidth={7}
          />
          <circle
            cx={34}
            cy={34}
            r={30}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={7}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - percent / 100)}
            style={{ transition: 'stroke-dashoffset 400ms var(--ease-swift)' }}
          />
        </svg>
        <div>
          <p className="text-body-lg font-bold text-ink tabular-nums">{percent}%</p>
          <p className="text-caption text-ink-secondary">Roadmap complete</p>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut', delay: 2 }}
        className="absolute top-56 right-0 bg-surface border border-hairline rounded-lg shadow-lg p-3.5 flex items-center gap-3"
      >
        <span className="h-8 w-8 rounded-sm bg-warning-soft text-warning flex items-center justify-center">
          <CalendarClock size={15} />
        </span>
        <div>
          <p className="text-body font-semibold text-ink">Visa application</p>
          <p className="text-caption text-warning font-medium">Due in 12 days</p>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 9, 0] }}
        transition={{
          duration: 8,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'easeInOut',
          delay: 0.5,
        }}
        className="absolute top-8 right-4 bg-surface border border-hairline rounded-lg shadow-lg p-3.5 flex items-center gap-3"
      >
        <span className="h-8 w-8 rounded-sm bg-positive-soft text-positive flex items-center justify-center">
          <Wallet size={15} />
        </span>
        <div>
          <p className="text-body font-semibold text-ink tabular-nums">£3,337 true cost</p>
          <p className="text-caption text-ink-secondary">GBP and your home currency</p>
        </div>
      </motion.div>
    </motion.div>
  )
}
