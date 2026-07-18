import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FlaskConical,
  GraduationCap,
  Heart,
  School,
  Wallet,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SwipeDeck } from '../components/SwipeDeck'
import { UkGeoMap } from '../components/UkGeoMap'
import { Button } from '../components/ui/button'
import { Input, Label, Select } from '../components/ui/input'
import { useCreateJourney } from '../hooks/useJourney'
import { useCountries } from '../hooks/useMeta'
import { useUniversities } from '../hooks/useUniversities'
import { apiErrorMessage } from '../lib/api'
import { cn } from '../lib/utils'
import { useAuthStore } from '../store/authStore'
import { useProfileStore } from '../store/profileStore'
import { toast } from '../store/toastStore'

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

const intakePresets = [
  { label: 'September 2026', value: '2026-09-21' },
  { label: 'January 2027', value: '2027-01-18' },
  { label: 'September 2027', value: '2027-09-20' },
]

const budgetPresets = [3000, 4000, 5500, 7000]

const majorPresets = [
  'Computer Science',
  'Business & Finance',
  'Medicine & Health',
  'Engineering',
  'Law',
]

const educationCompletedOptions = [
  { value: 'A-Levels (UK A-Level)', label: 'A-Levels (UK A-Level)' },
  {
    value: 'HSC (Higher Secondary - Bangladesh/Pakistan)',
    label: 'HSC (Higher Secondary - Bangladesh/Pakistan)',
  },
  { value: '12th Standard CBSE/ICSE (India)', label: '12th Standard CBSE/ICSE (India)' },
  { value: 'WAEC / WASSCE (West Africa)', label: 'WAEC / WASSCE (West Africa)' },
  { value: 'Gaokao / Senior High (China)', label: 'Gaokao / Senior High (China)' },
  { value: 'Grade 12 Certificate (Nepal)', label: 'Grade 12 Certificate (Nepal)' },
  { value: 'High School Diploma (US)', label: 'High School Diploma (US)' },
  { value: 'Bachelors Degree', label: 'Bachelors Degree' },
  { value: 'Masters Degree', label: 'Masters Degree' },
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const createJourney = useCreateJourney()

  const user = useAuthStore((s) => s.user)
  const { data: countriesList } = useCountries()

  // Onboarding Wizard Steps: 1 (Academic Details), 2 (Preferred Regions), 3 (University Swiper)
  const [step, setStep] = useState(1)

  const [courseLevel, setCourseLevel] = useState('Undergraduate')
  const [major, setMajor] = useState('')
  const [educationCompleted, setEducationCompleted] = useState('12th Standard CBSE/ICSE (India)')
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [intakeDate, setIntakeDate] = useState('')
  const [budgetGbp, setBudgetGbp] = useState('')
  const [error, setError] = useState<string | null>(null)

  // University shortlisting state
  const shortlistIds = useProfileStore((s) => s.shortlistIds)
  const toggleShortlistId = useProfileStore((s) => s.toggleShortlist)
  const [skipped, setSkipped] = useState<string[]>([])

  // Load user country code to pre-select local 12th grade equivalent
  const userCountryCode = useMemo(() => {
    if (!countriesList || !user?.originCountryId) return null
    return countriesList.find((c) => c.id === user.originCountryId)?.code
  }, [countriesList, user])

  useEffect(() => {
    if (userCountryCode) {
      const match = educationCompletedOptions.find(
        (o) => o.value.includes(userCountryCode) || o.label.includes(userCountryCode),
      )
      if (match) {
        setEducationCompleted(match.value)
      }
    }
  }, [userCountryCode])

  // Query universities filtered by selected regions for Step 3 Swipe
  const onboardingFilters = useMemo(
    () => ({
      search: '',
      regions: selectedRegions,
      russellGroup: false,
      sort: 'rank' as const,
    }),
    [selectedRegions],
  )

  const { data: universities } = useUniversities(onboardingFilters)
  const deckList = useMemo(() => {
    return (universities ?? []).filter(
      (u) => !skipped.includes(u.id) && !shortlistIds.includes(u.id),
    )
  }, [universities, skipped, shortlistIds])

  const toggleRegion = (region: string) => {
    setSelectedRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region],
    )
  }

  const handleNextStep = () => {
    if (!intakeDate) {
      setError('Please select or pick an intake date.')
      return
    }
    if (!budgetGbp) {
      setError('Please choose or enter your process budget.')
      return
    }
    if (!major.trim()) {
      setError('Please choose or enter your major / subject.')
      return
    }
    setError(null)
    setStep(2)
  }

  const handleCreateJourney = () => {
    setError(null)
    createJourney.mutate(
      {
        intakeDate,
        courseLevel,
        budgetPence: Math.round(Number(budgetGbp || '0') * 100),
        major: major || undefined,
        regions: selectedRegions.length > 0 ? selectedRegions : undefined,
        educationCompleted,
      },
      {
        onSuccess: () => {
          toast.success('Your student roadmap has been created!')
          navigate('/')
        },
        onError: (err) => setError(apiErrorMessage(err, 'Could not create your journey')),
      },
    )
  }

  return (
    <div className="min-h-screen bg-canvas py-10 px-4 [background:radial-gradient(circle_at_50%_0%,var(--surface-secondary)_0%,var(--canvas)_60%)]">
      <div className="ambient ambient-a" aria-hidden="true" />
      <div className="ambient ambient-b" aria-hidden="true" />
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
            StudYou builds your personalised roadmap, working backwards from your intake date.
          </p>
        </header>

        {/* Step Indicator Header */}
        <div className="flex items-center justify-center gap-6 mb-8 select-none">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 border',
                step === 1
                  ? 'bg-accent text-white border-accent shadow-sm'
                  : step > 1
                    ? 'bg-positive border-positive text-white'
                    : 'bg-surface border-hairline-strong text-ink-secondary',
              )}
            >
              {step > 1 ? <CheckCircle2 size={13} className="text-white" /> : '1'}
            </span>
            <span
              className={cn(
                'text-xs font-semibold',
                step === 1 ? 'text-accent font-bold' : 'text-ink-secondary',
              )}
            >
              Academic Details
            </span>
          </div>
          <span className="h-px w-8 bg-hairline-strong" />
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 border',
                step === 2
                  ? 'bg-accent text-white border-accent shadow-sm'
                  : step > 2
                    ? 'bg-positive border-positive text-white'
                    : 'bg-surface border-hairline-strong text-ink-secondary',
              )}
            >
              {step > 2 ? <CheckCircle2 size={13} className="text-white" /> : '2'}
            </span>
            <span
              className={cn(
                'text-xs font-semibold',
                step === 2 ? 'text-accent font-bold' : 'text-ink-secondary',
              )}
            >
              Target Regions
            </span>
          </div>
          <span className="h-px w-8 bg-hairline-strong" />
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 border',
                step === 3
                  ? 'bg-accent text-white border-accent shadow-sm'
                  : 'bg-surface border-hairline-strong text-ink-secondary',
              )}
            >
              3
            </span>
            <span
              className={cn(
                'text-xs font-semibold',
                step === 3 ? 'text-accent font-bold' : 'text-ink-secondary',
              )}
            >
              Swipe Shortlist
            </span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-6"
            >
              {/* Course Level */}
              <section className="bg-surface border border-hairline rounded-lg shadow-md p-5">
                <h2 className="text-body font-semibold text-ink-secondary uppercase tracking-[0.05em] mb-3">
                  What level are you studying?
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

              {/* Major or Subject */}
              <section className="bg-surface border border-hairline rounded-lg shadow-md p-5">
                <h2 className="text-body font-semibold text-ink-secondary uppercase tracking-[0.05em] mb-3">
                  What is your major or subject of interest?
                </h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  {majorPresets.map((preset) => {
                    const active = major === preset
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setMajor(preset)}
                        className={cn(
                          'text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-[120ms]',
                          active
                            ? 'border-transparent text-white shadow-sm bg-accent-solid [background-image:var(--accent-gradient)]'
                            : 'bg-surface border-hairline-strong text-ink-secondary hover:bg-surface-secondary hover:text-ink',
                        )}
                      >
                        {preset}
                      </button>
                    )
                  })}
                </div>
                <Label htmlFor="major-input">Or type your custom major / subject</Label>
                <Input
                  id="major-input"
                  type="text"
                  placeholder="e.g. Psychology, Computer Science, Law"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="max-w-md mt-1"
                />
              </section>

              {/* Education completed till */}
              <section className="bg-surface border border-hairline rounded-lg shadow-md p-5">
                <h2 className="text-body font-semibold text-ink-secondary uppercase tracking-[0.05em] mb-3">
                  Education completed till
                </h2>
                <Label htmlFor="education-select">
                  Select your highest level of completed education
                </Label>
                <Select
                  id="education-select"
                  value={educationCompleted}
                  onChange={(e) => setEducationCompleted(e.target.value)}
                  className="max-w-md mt-1"
                >
                  {educationCompletedOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </section>

              {/* Intake presets */}
              <section className="bg-surface border border-hairline rounded-lg shadow-md p-5">
                <h2 className="text-body font-semibold text-ink-secondary uppercase tracking-[0.05em] mb-3">
                  When do you want to start?
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

              {/* Process Budget */}
              <section className="bg-surface border border-hairline rounded-lg shadow-md p-5">
                <h2 className="text-body font-semibold text-ink-secondary uppercase tracking-[0.05em] mb-3">
                  Your process budget
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
                type="button"
                onClick={handleNextStep}
                size="lg"
                className="self-center min-w-64"
              >
                Next: Choose Regions
                <ArrowRight size={16} />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-6"
            >
              <section className="bg-surface border border-hairline rounded-lg shadow-md p-5 flex flex-col items-center">
                <div className="w-full text-left">
                  <h2 className="text-body font-semibold text-ink-secondary uppercase tracking-[0.05em] mb-1">
                    Preferred regions in the UK
                  </h2>
                  <p className="text-xs text-ink-secondary mb-4">
                    Click on the regions where you would like to study. Leave empty to show all
                    regions.
                  </p>
                </div>
                <div className="w-full flex justify-center py-2 bg-surface-secondary/50 rounded-md border border-hairline max-w-[380px]">
                  <UkGeoMap selected={selectedRegions} counts={{}} onToggle={toggleRegion} />
                </div>
                <div className="w-full text-left mt-3">
                  {selectedRegions.length > 0 ? (
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-accent">
                        {selectedRegions.length} region{selectedRegions.length > 1 ? 's' : ''}{' '}
                        selected: {selectedRegions.join(', ')}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedRegions([])}
                        className="text-xs font-medium text-ink-muted hover:text-ink hover:underline"
                      >
                        Clear all
                      </button>
                    </div>
                  ) : (
                    <p className="text-caption text-ink-tertiary">
                      No specific regions selected. We'll show you universities across the entire
                      UK.
                    </p>
                  )}
                </div>
              </section>

              {error && <p className="text-body text-danger text-center">{error}</p>}

              <div className="flex flex-col sm:flex-row justify-center gap-3.5">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep(1)}
                  className="w-full sm:w-auto"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCreateJourney}
                  className="w-full sm:w-auto"
                >
                  Skip shortlisting, build map
                </Button>
                <Button type="button" onClick={() => setStep(3)} className="w-full sm:w-auto">
                  Next: Shortlist Universities
                  <ArrowRight size={16} />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-6"
            >
              <section className="bg-surface border border-hairline rounded-lg shadow-md p-5 flex flex-col items-center">
                <div className="w-full text-left mb-4">
                  <h2 className="text-body font-semibold text-ink-secondary uppercase tracking-[0.05em] mb-1 flex items-center gap-1.5">
                    <Heart size={16} className="text-danger fill-current" />
                    Swipe and Shortlist
                  </h2>
                  <p className="text-xs text-ink-secondary">
                    Swipe right to shortlist desirable universities, or swipe left to skip them.
                  </p>
                </div>

                <div className="py-4 w-full">
                  <SwipeDeck
                    deck={deckList}
                    total={universities?.length ?? 0}
                    onShortlist={(u) => toggleShortlistId(u.id)}
                    onSkip={(u) => setSkipped((s) => [...s, u.id])}
                    onReset={() => setSkipped([])}
                  />
                </div>
              </section>

              {error && <p className="text-body text-danger text-center">{error}</p>}

              <div className="flex flex-col sm:flex-row justify-center gap-3.5">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep(2)}
                  className="w-full sm:w-auto"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateJourney}
                  disabled={createJourney.isPending}
                  className="w-full sm:w-auto"
                >
                  {createJourney.isPending ? 'Building roadmap...' : 'Complete: Go to Dashboard'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
