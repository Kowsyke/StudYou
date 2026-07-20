import { useGSAP } from '@gsap/react'
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
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SwipeDeck } from '../components/SwipeDeck'
import { UkGeoMap } from '../components/UkGeoMap'
import { Button } from '../components/ui/button'
import { Input, Label, Select } from '../components/ui/input'
import { useCreateJourney } from '../hooks/useJourney'
import { useCountries } from '../hooks/useMeta'
import { useUniversities } from '../hooks/useUniversities'
import { apiErrorMessage } from '../lib/api'
import { DrawSVGPlugin } from '../lib/gsap/DrawSVGPlugin.js'
import { Flip } from '../lib/gsap/Flip.js'
import { gsap } from '../lib/gsap/index.js'
import { cn } from '../lib/utils'
import { useAuthStore } from '../store/authStore'
import { useProfileStore } from '../store/profileStore'
import { toast } from '../store/toastStore'

gsap.registerPlugin(useGSAP, Flip, DrawSVGPlugin)

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

  // Refs for GSAP
  const stepContainerRef = useRef<HTMLDivElement>(null)
  // biome-ignore lint/suspicious/noExplicitAny: GSAP FlipState is untyped
  const flipStateRef = useRef<any>(null)
  const progressLine1Ref = useRef<SVGLineElement>(null)
  const progressLine2Ref = useRef<SVGLineElement>(null)

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

  const changeStep = (newStep: number) => {
    if (stepContainerRef.current) {
      flipStateRef.current = Flip.getState(stepContainerRef.current)
    }
    setStep(newStep)
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
    changeStep(2)
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

  // GSAP Flip transition + entrance anims
  useGSAP(() => {
    if (stepContainerRef.current && flipStateRef.current) {
      Flip.from(flipStateRef.current, {
        duration: 0.55,
        ease: 'power3.out',
        scale: true,
        fade: true,
        absolute: false,
      })
      flipStateRef.current = null
    } else {
      gsap.fromTo(
        stepContainerRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' },
      )
    }

    // Slow ambient blob drift
    gsap.to('.ambient-a', {
      x: 60,
      y: 40,
      scale: 1.15,
      duration: 20,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    })
    gsap.to('.ambient-b', {
      x: -50,
      y: -30,
      scale: 1.1,
      duration: 24,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    })
  }, [step])

  // DrawSVG course icons on Step 1 mount
  useGSAP(() => {
    if (step === 1) {
      gsap.fromTo(
        '.course-icon path, .course-icon circle',
        { drawSVG: '0%' },
        { drawSVG: '100%', duration: 0.7, ease: 'power2.out', stagger: 0.1 },
      )
    }
  }, [step])

  // DrawSVG progress indicator lines
  useEffect(() => {
    if (progressLine1Ref.current) {
      gsap.to(progressLine1Ref.current, {
        drawSVG: step > 1 ? '100%' : '0%',
        duration: 0.4,
        ease: 'power2.out',
      })
    }
    if (progressLine2Ref.current) {
      gsap.to(progressLine2Ref.current, {
        drawSVG: step > 2 ? '100%' : '0%',
        duration: 0.4,
        ease: 'power2.out',
      })
    }
  }, [step])

  return (
    <div className="noise-overlay min-h-screen bg-canvas py-10 px-4 [background:radial-gradient(circle_at_50%_0%,var(--surface-secondary)_0%,var(--canvas)_60%)] relative overflow-hidden">
      <div className="ambient ambient-a" aria-hidden="true" />
      <div className="ambient ambient-b" aria-hidden="true" />
      <div className="onboarding-card-wrapper max-w-2xl mx-auto relative z-10">
        <header className="text-center mb-8">
          <span className="inline-flex w-8 h-8 rounded-sm bg-accent-solid text-white text-body-lg font-extrabold items-center justify-center [background-image:var(--accent-gradient)] mb-3 shadow-md">
            SY
          </span>
          <h1 className="text-title2 text-ink font-bold text-gradient">Set up your journey</h1>
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

          <svg width="32" height="2" viewBox="0 0 32 2" className="overflow-visible shrink-0">
            <title>Progress connector</title>
            <line x1="0" y1="1" x2="32" y2="1" stroke="var(--border-strong)" strokeWidth="2" />
            <line
              ref={progressLine1Ref}
              x1="0"
              y1="1"
              x2="32"
              y2="1"
              stroke="var(--accent)"
              strokeWidth="2"
            />
          </svg>

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

          <svg width="32" height="2" viewBox="0 0 32 2" className="overflow-visible shrink-0">
            <title>Progress connector</title>
            <line x1="0" y1="1" x2="32" y2="1" stroke="var(--border-strong)" strokeWidth="2" />
            <line
              ref={progressLine2Ref}
              x1="0"
              y1="1"
              x2="32"
              y2="1"
              stroke="var(--accent)"
              strokeWidth="2"
            />
          </svg>

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

        <div ref={stepContainerRef}>
          {step === 1 && (
            <div className="flex flex-col gap-6">
              {/* Course Level */}
              <section className="bg-surface border border-hairline rounded-lg shadow-md p-5 card-lift">
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
                          'rounded-md border p-3.5 text-left transition-all duration-[120ms] hover:-translate-y-0.5 relative overflow-hidden',
                          active
                            ? 'border-transparent text-white shadow-md bg-accent-solid [background-image:var(--accent-gradient)]'
                            : 'bg-surface border-hairline-strong hover:bg-surface-secondary',
                        )}
                      >
                        <level.icon
                          size={18}
                          className={cn('course-icon', active ? 'text-white' : 'text-accent')}
                        />
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
              <section className="bg-surface border border-hairline rounded-lg shadow-md p-5 card-lift">
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
                <div className="draw-focus">
                  <Label htmlFor="major-input">Or type your custom major / subject</Label>
                  <Input
                    id="major-input"
                    type="text"
                    placeholder="e.g. Psychology, Computer Science, Law"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    className="max-w-md mt-1 w-full"
                  />
                </div>
              </section>

              {/* Education completed till */}
              <section className="bg-surface border border-hairline rounded-lg shadow-md p-5 card-lift">
                <h2 className="text-body font-semibold text-ink-secondary uppercase tracking-[0.05em] mb-3">
                  Education completed till
                </h2>
                <div className="draw-focus">
                  <Label htmlFor="education-select">
                    Select your highest level of completed education
                  </Label>
                  <Select
                    id="education-select"
                    value={educationCompleted}
                    onChange={(e) => setEducationCompleted(e.target.value)}
                    className="max-w-md mt-1 w-full"
                  >
                    {educationCompletedOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </section>

              {/* Intake presets */}
              <section className="bg-surface border border-hairline rounded-lg shadow-md p-5 card-lift">
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
                <div className="draw-focus">
                  <Label htmlFor="intake">Or pick an exact intake date</Label>
                  <Input
                    id="intake"
                    type="date"
                    required
                    className="max-w-56 w-full"
                    value={intakeDate}
                    onChange={(e) => setIntakeDate(e.target.value)}
                  />
                </div>
              </section>

              {/* Process Budget */}
              <section className="bg-surface border border-hairline rounded-lg shadow-md p-5 card-lift">
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
                <div className="draw-focus">
                  <Label htmlFor="budget">Or enter your own amount (GBP)</Label>
                  <div className="relative max-w-56 w-full">
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
                      className="pl-8 w-full"
                      value={budgetGbp}
                      onChange={(e) => setBudgetGbp(e.target.value)}
                      placeholder="4000"
                    />
                  </div>
                </div>
                <p className="text-caption text-ink-tertiary mt-2 leading-relaxed">
                  Not tuition, just the process: tests, visa, health surcharge, travel and setup.
                </p>
              </section>

              {error && <p className="text-body text-danger text-center font-medium">{error}</p>}

              <Button
                type="button"
                onClick={handleNextStep}
                size="lg"
                className="self-center min-w-64 magnetic-btn"
              >
                Next: Choose Regions
                <ArrowRight size={16} />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-6">
              <section className="bg-surface border border-hairline rounded-lg shadow-md p-5 flex flex-col items-center card-lift">
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

              {error && <p className="text-body text-danger text-center font-medium">{error}</p>}

              <div className="flex flex-col sm:flex-row justify-center gap-3.5">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => changeStep(1)}
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
                <Button
                  type="button"
                  onClick={() => changeStep(3)}
                  className="w-full sm:w-auto magnetic-btn"
                >
                  Next: Shortlist Universities
                  <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-6">
              <section className="bg-surface border border-hairline rounded-lg shadow-md p-5 flex flex-col items-center card-lift">
                <div className="w-full text-left mb-4">
                  <h2 className="text-body font-semibold text-ink-secondary uppercase tracking-[0.05em] mb-1 flex items-center gap-1.5">
                    <Heart size={16} className="text-danger fill-current animate-pulse" />
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

              {error && <p className="text-body text-danger text-center font-medium">{error}</p>}

              <div className="flex flex-col sm:flex-row justify-center gap-3.5">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => changeStep(2)}
                  className="w-full sm:w-auto"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateJourney}
                  disabled={createJourney.isPending}
                  className="w-full sm:w-auto magnetic-btn"
                >
                  {createJourney.isPending ? 'Building roadmap...' : 'Complete: Go to Dashboard'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
