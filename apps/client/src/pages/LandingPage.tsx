import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowRight,
  BadgePoundSterling,
  CalendarClock,
  Check,
  ExternalLink,
  GraduationCap,
  Map as MapIcon,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
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
  { value: '200', label: 'UK universities' },
  { value: '21', label: 'Official steps' },
  { value: '47', label: 'Sourced resources' },
  { value: '£0', label: 'Agency fees' },
]

// The five stages of the roadmap, each with a real task, its real cost,
// and the kind of official source that backs it. This is the product's
// whole argument in data form: every step visible, costed and sourced.
const journeyStages = [
  {
    n: 'Stage 1',
    title: 'Prepare',
    task: 'Book and sit an approved English test',
    cost: '£229',
    source: 'ielts.org',
  },
  {
    n: 'Stage 2',
    title: 'Apply',
    task: 'Submit your university application',
    cost: '£28.50',
    source: 'ucas.com',
  },
  {
    n: 'Stage 3',
    title: 'Visa',
    task: 'Pay the Immigration Health Surcharge',
    cost: '£776 / year',
    source: 'gov.uk',
  },
  {
    n: 'Stage 4',
    title: 'Pre departure',
    task: 'Prove your financial requirement',
    cost: 'No fee',
    source: 'gov.uk',
  },
  {
    n: 'Stage 5',
    title: 'Arrive and settle',
    task: 'Register with a GP and get your NI number',
    cost: 'Free',
    source: 'nhs.uk',
  },
]

const pillars = [
  {
    icon: MapIcon,
    title: 'A roadmap that tracks itself',
    body: 'Five stages, twenty one official steps, each with a target date worked back from your intake. Tick things off and your budget and deadlines update live.',
  },
  {
    icon: GraduationCap,
    title: 'Find your university without a middleman',
    body: 'The top 200 UK universities on a real map. Filter by region, compare tuition, swipe to shortlist, and open the official admissions page in one click.',
  },
  {
    icon: BadgePoundSterling,
    title: 'The true cost, in your currency',
    body: 'Every fee from the English test to the health surcharge, added up in GBP and your home currency. No hidden commissions, because there are none.',
  },
]

export function LandingPage() {
  const token = useAuthStore((s) => s.token)
  if (token) return <Navigate to="/" replace />

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-canvas">
      <div className="blob blob-a w-[420px] h-[420px] -top-24 -left-24" />
      <div className="blob blob-b w-[380px] h-[380px] top-[70vh] -right-32" />

      <nav className="relative z-10 max-w-5xl mx-auto flex items-center justify-between px-6 py-5">
        <Link
          to="/"
          aria-label="StudYou home"
          className="flex items-center gap-2 text-body-lg font-bold tracking-[-0.01em] rounded-sm"
        >
          <span className="breathe w-6 h-6 rounded-xs bg-accent-solid text-white text-caption font-extrabold flex items-center justify-center [background-image:var(--accent-gradient)] transition-transform duration-[120ms] hover:rotate-6 hover:scale-110">
            SY
          </span>
          StudYou
        </Link>
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

      <div className="relative z-10 border-y border-hairline bg-surface/60 backdrop-blur-sm py-3.5 overflow-hidden">
        <div className="marquee-track">
          {[...marqueeItems, ...marqueeItems].map((item, index) => (
            <Link
              key={`${item}-${index >= marqueeItems.length ? 'b' : 'a'}`}
              to="/register"
              tabIndex={index >= marqueeItems.length ? -1 : 0}
              className="marquee-chip shrink-0 inline-flex items-center gap-1.5 text-caption font-semibold text-ink-secondary bg-surface border border-hairline rounded-full px-3 py-1.5 shadow-sm"
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background: 'var(--aurora)',
                  backgroundPosition: `${(index % marqueeItems.length) * 8}% 50%`,
                  backgroundSize: '400% 400%',
                }}
              />
              {item}
            </Link>
          ))}
        </div>
      </div>

      <ProblemSection />
      <JourneySpine />
      <PillarsSection />
      <ClosingCta />

      <footer className="relative z-10 max-w-5xl mx-auto px-6 py-8 text-caption text-ink-tertiary text-center leading-relaxed">
        StudYou provides guidance and signposting only. It is not legal or immigration advice.
        Always confirm details on official sources such as gov.uk.
      </footer>
    </div>
  )
}

/* A quiet, factual turn: name the problem StudYou exists to solve. */
function ProblemSection() {
  return (
    <section className="relative z-10 max-w-3xl mx-auto px-6 py-24 text-center">
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: swift }}
        className="text-caption font-semibold uppercase tracking-[0.08em] text-ink-tertiary mb-4"
      >
        Why StudYou exists
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.55, ease: swift }}
        className="text-title2 text-ink leading-tight"
      >
        Agencies charge for guidance the government gives away, and hide the true cost.{' '}
        <span className="text-ink-tertiary">Some have taken students' money and vanished.</span>
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ delay: 0.1, duration: 0.55, ease: swift }}
        className="text-body-lg text-ink-secondary leading-relaxed mt-6 max-w-2xl mx-auto"
      >
        Every rule, fee and form you need is published for free by gov.uk, the NHS and the
        universities themselves. StudYou puts all of it in one place, in the right order, with the
        real numbers, so you never have to trust a middleman again.
      </motion.p>
    </section>
  )
}

/*
  The signature element: the journey spine. A gradient line draws itself
  down the page as you scroll, and each of the five stages reveals a real
  task, its real cost and its official source when it comes into view. The
  product's whole thesis, made physical: the entire journey laid bare.
*/
function JourneySpine() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start center', 'end center'],
  })
  // The line fills from top to bottom as the section scrolls through.
  const fillHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  return (
    <section ref={sectionRef} className="relative z-10 max-w-3xl mx-auto px-6 py-16">
      <div className="text-center mb-14">
        <p className="text-caption font-semibold uppercase tracking-[0.08em] text-ink-tertiary mb-4">
          The whole journey, laid bare
        </p>
        <h2 className="text-title2 text-ink">Five stages. Nothing hidden.</h2>
      </div>

      <div className="relative pl-14 sm:pl-20">
        {/* The spine: a faint track with a gradient fill that follows scroll. */}
        <div className="absolute left-[26px] sm:left-[34px] top-2 bottom-2 w-[3px] rounded-full bg-surface-secondary overflow-hidden">
          <motion.div
            className="w-full rounded-full [background-image:var(--aurora)]"
            style={{ height: reduceMotion ? '100%' : fillHeight }}
          />
        </div>

        <div className="flex flex-col gap-6">
          {journeyStages.map((stage, index) => (
            <motion.div
              key={stage.title}
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, ease: swift, delay: index * 0.04 }}
              className="relative"
            >
              {/* Stage node sitting on the spine. */}
              <span
                className="absolute -left-[46px] sm:-left-[62px] top-4 h-6 w-6 rounded-full border-2 border-canvas [background-image:var(--accent-gradient)] shadow-md flex items-center justify-center"
                aria-hidden="true"
              >
                <span className="h-2 w-2 rounded-full bg-white" />
              </span>

              <div className="aurora-card rounded-lg shadow-md p-5">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="text-micro font-semibold uppercase tracking-[0.06em] text-accent">
                    {stage.n}
                  </span>
                  <span className="text-caption font-semibold text-ink-secondary">
                    {stage.title}
                  </span>
                </div>
                <p className="text-body-lg font-semibold text-ink">{stage.task}</p>
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-hairline text-body">
                  <span
                    className={`font-bold tabular-nums ${
                      stage.cost === 'Free' || stage.cost === 'No fee'
                        ? 'text-ink-tertiary'
                        : 'text-ink'
                    }`}
                  >
                    {stage.cost}
                  </span>
                  <span className="ml-auto inline-flex items-center gap-1 text-caption font-medium text-accent">
                    <span className="h-1.5 w-1.5 rounded-full bg-positive" />
                    {stage.source}
                    <ExternalLink size={11} />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* Three pillars, revealed on scroll, with the aurora hover treatment. */
function PillarsSection() {
  return (
    <section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {pillars.map((pillar, index) => (
          <motion.article
            key={pillar.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, ease: swift, delay: index * 0.08 }}
            className="aurora-card rounded-lg shadow-md p-6"
          >
            <span className="inline-flex h-11 w-11 rounded-md bg-accent-soft text-accent items-center justify-center mb-4">
              <pillar.icon size={20} />
            </span>
            <h3 className="text-body-lg font-bold text-ink leading-snug">{pillar.title}</h3>
            <p className="text-body text-ink-secondary leading-relaxed mt-2">{pillar.body}</p>
          </motion.article>
        ))}
      </div>
    </section>
  )
}

/* The final call, on an aurora band. */
function ClosingCta() {
  return (
    <section className="relative z-10 max-w-5xl mx-auto px-6 py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, ease: swift }}
        className="relative overflow-hidden rounded-xl border border-hairline-strong p-10 sm:p-14 text-center"
      >
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{ background: 'var(--aurora)' }}
          aria-hidden="true"
        />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 text-caption font-semibold uppercase tracking-[0.06em] text-accent bg-accent-soft px-2.5 py-1 rounded-full mb-5">
            <Sparkles size={12} />
            Free, and always will be
          </span>
          <h2 className="text-title2 text-ink max-w-xl mx-auto leading-tight">
            Build the roadmap you wish you had on day one.
          </h2>
          <p className="text-body-lg text-ink-secondary mt-4 max-w-lg mx-auto leading-relaxed">
            Answer three questions and StudYou lays out every step to your UK intake, in order, with
            dates and costs.
          </p>
          <Link to="/register" className="inline-block mt-8">
            <Button size="lg">
              Start your roadmap
              <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </motion.div>
    </section>
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
