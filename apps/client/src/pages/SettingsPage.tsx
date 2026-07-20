import { useGSAP } from '@gsap/react'
import { Download, Monitor, Moon, Sun, Trash2 } from 'lucide-react'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { QueryError } from '../components/QueryError'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input, Label, Select } from '../components/ui/input'
import { CardSkeleton } from '../components/ui/skeleton'
import { Switch } from '../components/ui/switch'
import { hasNoJourney, useJourney, useUpdateSettings } from '../hooks/useJourney'
import { useCountries } from '../hooks/useMeta'
import { apiErrorMessage } from '../lib/api'
import { CustomEase } from '../lib/gsap/CustomEase.js'
import { CustomWiggle } from '../lib/gsap/CustomWiggle.js'
import { Flip } from '../lib/gsap/Flip.js'
import { gsap } from '../lib/gsap/index.js'
import { cn } from '../lib/utils'
import { useAuthStore } from '../store/authStore'
import { DUE_SOON_OPTIONS, clearLocalData, usePreferencesStore } from '../store/preferencesStore'
import { type ThemePreference, useThemeStore } from '../store/themeStore'
import { toast } from '../store/toastStore'

gsap.registerPlugin(useGSAP, Flip, CustomEase, CustomWiggle)

const themeOptions: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

function ThemeToggle() {
  const themePreference = useThemeStore((s) => s.themePreference)
  const setTheme = useThemeStore((s) => s.setTheme)
  const containerRef = useRef<HTMLFieldSetElement>(null)

  const handleThemeChange = (value: ThemePreference) => {
    const state = Flip.getState(containerRef.current?.querySelectorAll('.theme-indicator'))
    setTheme(value)
    setTimeout(() => {
      if (state && containerRef.current) {
        Flip.from(state, {
          duration: 0.3,
          ease: 'power2.out',
        })
      }
    }, 0)
  }

  return (
    <fieldset
      ref={containerRef}
      className="inline-flex bg-surface-secondary p-[3px] rounded-sm border-0 relative select-none"
      aria-label="Appearance"
    >
      {themeOptions.map((option) => {
        const active = themePreference === option.value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => handleThemeChange(option.value)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-[6px] text-caption font-semibold transition-colors duration-[120ms] relative z-10 cursor-pointer text-ink-secondary hover:text-ink"
          >
            {active && (
              <div
                data-flip-id="theme-pill"
                className="theme-indicator absolute inset-0 bg-surface rounded-[6px] shadow-sm -z-10"
              />
            )}
            <option.icon size={12} className={cn(active ? 'text-accent' : 'text-ink-secondary')} />
            <span className={cn(active && 'text-ink font-bold')}>{option.label}</span>
          </button>
        )
      })}
    </fieldset>
  )
}

/* Reusable DrawSVG Input Focus Wrapper */
function DrawFocusInput({
  label,
  id,
  type,
  value,
  onChange,
  className,
  ...props
}: {
  label: string
  id: string
  type: string
  value: string
  onChange: (val: string) => void
  // biome-ignore lint/suspicious/noExplicitAny: React components props map
  [key: string]: any
}) {
  const underlineRef = useRef<SVGPathElement>(null)

  const onFocus = () => {
    if (underlineRef.current) {
      gsap.to(underlineRef.current, { drawSVG: '100%', duration: 0.35, ease: 'power2.out' })
    }
  }

  const onBlur = () => {
    if (underlineRef.current) {
      gsap.to(underlineRef.current, { drawSVG: '0%', duration: 0.25, ease: 'power2.out' })
    }
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative overflow-hidden rounded-sm">
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          className={cn('w-full pr-4', className)}
          {...props}
        />
        <svg
          className="absolute bottom-0 left-0 right-0 h-[2px] pointer-events-none"
          viewBox="0 0 100 2"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            ref={underlineRef}
            d="M0 1 L100 1"
            stroke="var(--accent)"
            strokeWidth="3"
            fill="none"
            style={{ strokeDasharray: 100, strokeDashoffset: 100 }}
          />
        </svg>
      </div>
    </div>
  )
}

function DrawFocusSelect({
  label,
  id,
  value,
  onChange,
  children,
  className,
  ...props
}: {
  label: string
  id: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  children: React.ReactNode
  // biome-ignore lint/suspicious/noExplicitAny: React components props map
  [key: string]: any
}) {
  const underlineRef = useRef<SVGPathElement>(null)

  const onFocus = () => {
    if (underlineRef.current) {
      gsap.to(underlineRef.current, { drawSVG: '100%', duration: 0.35, ease: 'power2.out' })
    }
  }

  const onBlur = () => {
    if (underlineRef.current) {
      gsap.to(underlineRef.current, { drawSVG: '0%', duration: 0.25, ease: 'power2.out' })
    }
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative overflow-hidden rounded-sm">
        <Select
          id={id}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          className={cn('w-full', className)}
          {...props}
        >
          {children}
        </Select>
        <svg
          className="absolute bottom-0 left-0 right-0 h-[2px] pointer-events-none"
          viewBox="0 0 100 2"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            ref={underlineRef}
            d="M0 1 L100 1"
            stroke="var(--accent)"
            strokeWidth="3"
            fill="none"
            style={{ strokeDasharray: 100, strokeDashoffset: 100 }}
          />
        </svg>
      </div>
    </div>
  )
}

export function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const { data: overview, isPending, error, refetch, isRefetching } = useJourney()

  if (user?.role === 'admin') return <Navigate to="/admin/settings" replace />
  const { data: countries } = useCountries()
  const updateSettings = useUpdateSettings()

  const [budgetGbp, setBudgetGbp] = useState('')
  const [intakeDate, setIntakeDate] = useState('')
  const [originCountryCode, setOriginCountryCode] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const originCountries = (countries ?? []).filter((c) => !c.isDestination)
  const currentOriginCode =
    (countries ?? []).find((c) => c.id === user?.originCountryId)?.code ?? ''

  const dangerBtnRef = useRef<HTMLButtonElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!overview) return
    setBudgetGbp(String(overview.journey.budgetPence / 100))
    setIntakeDate(overview.journey.intakeDate)
  }, [overview])

  useEffect(() => {
    setOriginCountryCode(currentOriginCode)
  }, [currentOriginCode])

  // CustomWiggle danger button warn animation
  const wiggleDanger = () => {
    if (dangerBtnRef.current) {
      CustomWiggle.create('warnWiggle', { wiggles: 5, type: 'ease-out' })
      gsap.to(dangerBtnRef.current, {
        x: 4,
        ease: 'warnWiggle',
        duration: 0.5,
      })
    }
  }

  // Recalculate dialog entrance transition
  useEffect(() => {
    if (confirming && modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.94, y: 15 },
        { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'power3.out', overwrite: 'auto' },
      )
    }
  }, [confirming])

  if (error && hasNoJourney(error)) return <Navigate to="/onboarding" replace />

  if (isPending) {
    return (
      <div className="space-y-4">
        <CardSkeleton lines={4} />
        <CardSkeleton lines={2} />
      </div>
    )
  }

  if (error || !overview) {
    return (
      <QueryError
        message="Your settings could not be loaded. Check your connection and try again."
        onRetry={() => refetch()}
        retrying={isRefetching}
      />
    )
  }

  const intakeChanged = intakeDate !== overview.journey.intakeDate

  const submit = () => {
    setFormError(null)
    setConfirming(false)
    updateSettings.mutate(
      {
        intakeDate: intakeChanged ? intakeDate : undefined,
        budgetPence: Math.round(Number(budgetGbp || '0') * 100),
        originCountryCode:
          originCountryCode === currentOriginCode ? undefined : originCountryCode || null,
      },
      {
        onSuccess: () => {
          if (originCountryCode !== currentOriginCode) {
            const state = useAuthStore.getState()
            if (state.user && state.token) {
              const newCountryId =
                (countries ?? []).find((c) => c.code === originCountryCode)?.id ?? null
              state.setAuth({ ...state.user, originCountryId: newCountryId }, state.token)
            }
          }
          toast.success('Settings saved.')
        },
        onError: (err) => {
          const message = apiErrorMessage(err, 'Could not save your settings')
          setFormError(message)
          toast.error('Something went wrong. Try again.')
        },
      },
    )
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (intakeChanged) {
      setConfirming(true)
      return
    }
    submit()
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-title3 text-ink font-bold text-gradient">Settings</h1>
        <p className="text-xs text-ink-secondary mt-1">
          Adjust your plan. Your roadmap and budget update everywhere, instantly.
        </p>
      </header>

      <Card className="max-w-xl mb-5 card-lift">
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-2">
          <div>
            <p className="text-caption text-ink-tertiary">Name</p>
            <p className="text-body font-semibold text-ink">{user?.fullName}</p>
          </div>
          <div className="min-w-0">
            <p className="text-caption text-ink-tertiary">Email</p>
            <p className="text-body font-semibold text-ink truncate">{user?.email}</p>
          </div>
          <div>
            <p className="text-caption text-ink-tertiary">Role</p>
            <p className="text-body font-semibold text-ink capitalize">{user?.role}</p>
          </div>
          <Link to="/profile" className="ml-auto text-xs font-semibold text-accent hover:underline">
            Edit avatar and shortlist
          </Link>
        </CardContent>
      </Card>

      <Card className="max-w-xl mb-5 card-lift">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Choose how StudYou looks and moves. Saved on this device.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ThemeToggle />
          <MotionAndDensity />
        </CardContent>
      </Card>

      <Card className="max-w-xl mb-5 card-lift">
        <CardHeader>
          <CardTitle>Planning</CardTitle>
          <CardDescription>How StudYou flags what is coming up.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <DueSoonPicker />
          <HomeCurrencyToggle />
        </CardContent>
      </Card>

      <Card className="max-w-xl card-lift">
        <CardHeader>
          <CardTitle>Journey settings</CardTitle>
          <CardDescription>
            Changing the intake date recalculates every target date in your roadmap.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <DrawFocusInput
              id="settings-intake"
              label="Target intake date"
              type="date"
              required
              value={intakeDate}
              onChange={setIntakeDate}
            />
            {intakeChanged && (
              <p className="text-xs text-ink-muted -mt-2">
                All target dates will be recalculated from this date.
              </p>
            )}

            <DrawFocusInput
              id="settings-budget"
              label="Budget for fees and process costs (GBP)"
              type="number"
              min={0}
              step="100"
              required
              value={budgetGbp}
              onChange={setBudgetGbp}
            />

            <DrawFocusSelect
              id="settings-origin"
              label="Home country"
              value={originCountryCode}
              onChange={(e) => setOriginCountryCode(e.target.value)}
            >
              <option value="">Not set</option>
              {originCountries.map((c) => (
                <option key={c.id} value={c.code}>
                  {c.name}
                </option>
              ))}
            </DrawFocusSelect>
            <p className="text-xs text-ink-muted -mt-2">
              Sets the home currency shown next to GBP costs.
            </p>

            {formError && <p className="text-sm text-danger">{formError}</p>}
            <Button
              type="submit"
              disabled={updateSettings.isPending}
              className="font-semibold [background-image:var(--accent-gradient)]"
            >
              {updateSettings.isPending ? 'Saving...' : 'Save settings'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-xl mt-5 card-lift">
        <CardHeader>
          <CardTitle>Your data</CardTitle>
          <CardDescription>
            Everything StudYou stores on this device stays on this device.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const payload = {
                exportedAt: new Date().toISOString(),
                account: { name: user?.fullName, email: user?.email, role: user?.role },
                journey: overview.journey,
                progress: {
                  percentComplete: overview.percentComplete,
                  budget: overview.budget,
                  upcomingDeadlines: overview.upcomingDeadlines,
                },
                localPreferences: JSON.parse(localStorage.getItem('studyou_prefs') ?? '{}'),
                profileChoices: JSON.parse(localStorage.getItem('studyou_profile') ?? '{}'),
              }
              const blob = new Blob([JSON.stringify(payload, null, 2)], {
                type: 'application/json',
              })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'studyou-export.json'
              a.click()
              URL.revokeObjectURL(url)
              toast.success('Export downloaded.')
            }}
          >
            <Download size={13} />
            Export my data
          </Button>
          <Button
            ref={dangerBtnRef}
            variant="danger"
            size="sm"
            onMouseEnter={wiggleDanger}
            onClick={() => {
              clearLocalData()
              toast.success('Local data cleared.')
              setTimeout(() => window.location.reload(), 600)
            }}
          >
            <Trash2 size={13} />
            Clear local data
          </Button>
        </CardContent>
      </Card>

      {confirming && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[4px] flex items-center justify-center px-4"
          onKeyDown={(event) => {
            if (event.key === 'Escape') setConfirming(false)
          }}
        >
          <div
            ref={modalRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="glass-reflect bg-surface rounded-lg border border-hairline shadow-overlay p-6 w-[400px] max-w-full flex flex-col gap-4 select-none"
          >
            <h2 id="confirm-title" className="text-body-lg font-bold text-ink">
              Recalculate your roadmap?
            </h2>
            <p className="text-body text-ink-secondary leading-relaxed text-xs">
              Changing your intake date will automatically recalculate every target date in your
              roadmap.
            </p>
            <div className="flex justify-end gap-2.5 mt-2">
              <Button variant="secondary" autoFocus onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button onClick={submit} className="[background-image:var(--accent-gradient)]">
                Recalculate and save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MotionAndDensity() {
  const reduceMotion = usePreferencesStore((s) => s.reduceMotion)
  const setReduceMotion = usePreferencesStore((s) => s.setReduceMotion)
  const compactCards = usePreferencesStore((s) => s.compactCards)
  const setCompactCards = usePreferencesStore((s) => s.setCompactCards)

  return (
    <>
      <Switch
        id="pref-motion"
        checked={reduceMotion}
        onChange={setReduceMotion}
        label="Reduce motion"
        hint="Turns off page transitions and ambient animation, on top of your system setting."
      />
      <Switch
        id="pref-compact"
        checked={compactCards}
        onChange={setCompactCards}
        label="Compact cards"
        hint="Fits more universities and resources on screen with tighter cards."
      />
    </>
  )
}

function DueSoonPicker() {
  const dueSoonDays = usePreferencesStore((s) => s.dueSoonDays)
  const setDueSoonDays = usePreferencesStore((s) => s.setDueSoonDays)
  const containerRef = useRef<HTMLFieldSetElement>(null)

  const handleDaysChange = (days: 7 | 14 | 30) => {
    const state = Flip.getState(containerRef.current?.querySelectorAll('.days-indicator'))
    setDueSoonDays(days)
    setTimeout(() => {
      if (state && containerRef.current) {
        Flip.from(state, {
          duration: 0.3,
          ease: 'power2.out',
        })
      }
    }, 0)
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <span>
        <span className="block text-body font-medium text-ink">Due soon window</span>
        <span className="block text-caption text-ink-tertiary mt-0.5">
          Deadlines inside this window get the amber flag on your dashboard.
        </span>
      </span>
      <fieldset
        ref={containerRef}
        className="inline-flex bg-surface-secondary p-[3px] rounded-sm border-0 shrink-0 relative select-none"
        aria-label="Due soon window"
      >
        {DUE_SOON_OPTIONS.map((days) => {
          const active = dueSoonDays === days
          return (
            <button
              key={days}
              type="button"
              aria-pressed={active}
              onClick={() => handleDaysChange(days)}
              className="px-3 py-1.5 rounded-[6px] text-caption font-semibold transition-colors duration-[120ms] tabular-nums relative z-10 cursor-pointer text-ink-secondary hover:text-ink"
            >
              {active && (
                <div
                  data-flip-id="days-pill"
                  className="days-indicator absolute inset-0 bg-surface rounded-[6px] shadow-sm -z-10"
                />
              )}
              <span className={cn(active && 'text-ink font-bold')}>{days}d</span>
            </button>
          )
        })}
      </fieldset>
    </div>
  )
}

function HomeCurrencyToggle() {
  const showHomeCurrency = usePreferencesStore((s) => s.showHomeCurrency)
  const setShowHomeCurrency = usePreferencesStore((s) => s.setShowHomeCurrency)

  return (
    <Switch
      id="pref-currency"
      checked={showHomeCurrency}
      onChange={setShowHomeCurrency}
      label="Show home currency"
      hint="Displays approximate amounts in your home currency next to GBP."
    />
  )
}
