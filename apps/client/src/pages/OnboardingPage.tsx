import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, FlaskConical, GraduationCap, School, Wallet } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input, Label } from '../components/ui/input'
import { useCreateJourney } from '../hooks/useJourney'
import { apiErrorMessage } from '../lib/api'
import { cn } from '../lib/utils'

const swift = [0.16, 1, 0.3, 1] as const

const courseLevels = [
  {
    value: 'Foundation',
    icon: School,
    hint: 'A preparation year before your degree',
  },
  {
    value: 'Undergraduate',
    icon: GraduationCap,
    hint: 'Bachelors, usually three to four years',
  },
  {
    value: 'Postgraduate taught',
    icon: BookOpen,
    hint: 'Masters by coursework, usually one year',
  },
  {
    value: 'Postgraduate research',
    icon: FlaskConical,
    hint: 'Research masters or PhD',
  },
]

// Common UK intake months as quick picks, with the date input for
// anything else. Values are computed from fixed academic dates.
const intakePresets = [
  { label: 'September 2026', value: '2026-09-21' },
  { label: 'January 2027', value: '2027-01-18' },
  { label: 'September 2027', value: '2027-09-20' },
]

const budgetPresets = [3000, 4000, 5500, 7000]

export function OnboardingPage() {
  const navigate = useNavigate()
  const createJourney = useCreateJourney()
  const [courseLevel, setCourseLevel] = useState('Undergraduate')
  const [intakeDate, setIntakeDate] = useState('')
  const [budgetGbp, setBudgetGbp] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    createJourney.mutate(
      {
        intakeDate,
        courseLevel,
        budgetPence: Math.round(Number(budgetGbp || '0') * 100),
      },
      {
        onSuccess: () => navigate('/'),
        onError: (err) => setError(apiErrorMessage(err, 'Could not create your journey')),
      },
    )
  }

  return (
    <div className="min-h-screen bg-canvas py-10 px-4 [background:radial-gradient(circle_at_50%_0%,var(--surface-secondary)_0%,var(--canvas)_60%)]">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: swift }}
        className="max-w-2xl mx-auto"
      >
        <header className="text-center mb-8">
          <span className="inline-flex w-8 h-8 rounded-sm bg-accent-solid text-white text-body-lg font-extrabold items-center justify-center [background-image:var(--accent-gradient)] mb-3">
            SY
          </span>
          <h1 className="text-title2 text-ink">Set up your journey</h1>
          <p className="text-body text-ink-secondary mt-1.5 max-w-md mx-auto">
            Three choices and StudYou builds your personalised roadmap, working backwards from your
            intake date.
          </p>
        </header>

        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <section className="bg-surface border border-hairline rounded-lg shadow-md p-5">
            <h2 className="text-body font-semibold text-ink-secondary uppercase tracking-[0.05em] mb-3">
              1. What are you studying?
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {courseLevels.map((level) => {
                const active = courseLevel === level.value
                return (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setCourseLevel(level.value)}
                    aria-pressed={active}
                    className={cn(
                      'rounded-md border p-3.5 text-left transition-all duration-[120ms] hover:-translate-y-0.5',
                      active
                        ? 'border-transparent text-white shadow-md bg-accent-solid [background-image:var(--accent-gradient)]'
                        : 'bg-surface border-hairline-strong hover:bg-surface-secondary',
                    )}
                  >
                    <level.icon size={18} className={active ? 'text-white' : 'text-accent'} />
                    <p
                      className={cn(
                        'text-body font-semibold mt-2',
                        active ? 'text-white' : 'text-ink',
                      )}
                    >
                      {level.value}
                    </p>
                    <p
                      className={cn(
                        'text-caption mt-0.5 leading-snug',
                        active ? 'text-white/85' : 'text-ink-tertiary',
                      )}
                    >
                      {level.hint}
                    </p>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="bg-surface border border-hairline rounded-lg shadow-md p-5">
            <h2 className="text-body font-semibold text-ink-secondary uppercase tracking-[0.05em] mb-3">
              2. When do you want to start?
            </h2>
            <div className="flex flex-wrap gap-2.5 mb-3">
              {intakePresets.map((preset) => {
                const active = intakeDate === preset.value
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setIntakeDate(preset.value)}
                    aria-pressed={active}
                    className={cn(
                      'text-xs font-semibold px-3.5 py-2 rounded-md border transition-colors duration-[120ms]',
                      active
                        ? 'border-transparent text-white shadow-sm bg-accent-solid [background-image:var(--accent-gradient)]'
                        : 'bg-surface border-hairline-strong text-ink-secondary hover:bg-surface-secondary hover:text-ink',
                    )}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>
            <Label htmlFor="intake">Or pick an exact intake date</Label>
            <Input
              id="intake"
              type="date"
              required
              className="max-w-56"
              value={intakeDate}
              onChange={(e) => setIntakeDate(e.target.value)}
            />
          </section>

          <section className="bg-surface border border-hairline rounded-lg shadow-md p-5">
            <h2 className="text-body font-semibold text-ink-secondary uppercase tracking-[0.05em] mb-3">
              3. Your process budget
            </h2>
            <div className="flex flex-wrap gap-2.5 mb-3">
              {budgetPresets.map((amount) => {
                const active = budgetGbp === String(amount)
                return (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setBudgetGbp(String(amount))}
                    aria-pressed={active}
                    className={cn(
                      'text-xs font-semibold px-3.5 py-2 rounded-md border transition-colors duration-[120ms] tabular-nums',
                      active
                        ? 'border-transparent text-white shadow-sm bg-accent-solid [background-image:var(--accent-gradient)]'
                        : 'bg-surface border-hairline-strong text-ink-secondary hover:bg-surface-secondary hover:text-ink',
                    )}
                  >
                    £{amount.toLocaleString('en-GB')}
                  </button>
                )
              })}
            </div>
            <Label htmlFor="budget">Or enter your own amount (GBP)</Label>
            <div className="relative max-w-56">
              <Wallet
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-tertiary"
              />
              <Input
                id="budget"
                type="number"
                min={0}
                step="100"
                required
                className="pl-8"
                value={budgetGbp}
                onChange={(e) => setBudgetGbp(e.target.value)}
                placeholder="4000"
              />
            </div>
            <p className="text-caption text-ink-tertiary mt-2 leading-relaxed">
              Not tuition, just the process: tests, visa, health surcharge, travel and setup.
            </p>
          </section>

          {error && <p className="text-body text-danger text-center">{error}</p>}

          <Button
            type="submit"
            size="lg"
            className="self-center min-w-64"
            disabled={createJourney.isPending}
          >
            {createJourney.isPending ? 'Building your roadmap...' : 'Build my roadmap'}
            <ArrowRight size={16} />
          </Button>
        </form>
      </motion.div>
    </div>
  )
}
