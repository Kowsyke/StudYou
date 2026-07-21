import { useGSAP } from '@gsap/react'
import { Bell, Calendar, Download, Monitor, Moon, Palette, Sun, Trash2, User } from 'lucide-react'
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

type SettingsTab = 'account' | 'journey' | 'appearance' | 'deadlines' | 'data'

const settingsTabs: { id: SettingsTab; label: string; icon: typeof User; kicker: string }[] = [
  { id: 'account', label: 'Account Profile', icon: User, kicker: 'Identity' },
  { id: 'journey', label: 'Intake & Journey', icon: Calendar, kicker: 'Roadmap' },
  { id: 'appearance', label: 'Appearance & Display', icon: Palette, kicker: 'Preferences' },
  { id: 'deadlines', label: 'Deadlines & Currency', icon: Bell, kicker: 'Notifications' },
  { id: 'data', label: 'Data & Privacy', icon: Download, kicker: 'Storage' },
]

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
      className="inline-flex bg-surface-secondary p-[3px] rounded-md border-0 relative select-none w-full sm:w-auto"
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
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-sm text-caption font-semibold transition-colors duration-[120ms] relative z-10 cursor-pointer text-ink-secondary hover:text-ink"
          >
            {active && (
              <div
                data-flip-id="theme-pill"
                className="theme-indicator absolute inset-0 bg-surface rounded-sm shadow-xs -z-10"
              />
            )}
            <option.icon size={14} className={cn(active ? 'text-accent' : 'text-ink-secondary')} />
            <span className={cn(active && 'text-ink font-bold')}>{option.label}</span>
          </button>
        )
      })}
    </fieldset>
  )
}

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
          className={cn(
            'w-full pr-4 bg-surface-secondary/40 border-hairline focus:border-accent',
            className,
          )}
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
          className={cn(
            'w-full bg-surface-secondary/40 border-hairline focus:border-accent',
            className,
          )}
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

  const [activeTab, setActiveTab] = useState<SettingsTab>('account')
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
  const panelRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!overview) return
    setBudgetGbp(String(overview.journey.budgetPence / 100))
    setIntakeDate(overview.journey.intakeDate)
  }, [overview])

  useEffect(() => {
    setOriginCountryCode(currentOriginCode)
  }, [currentOriginCode])

  // Flip indicator and panel transition on tab change
  const handleTabChange = (tabId: SettingsTab) => {
    if (tabId === activeTab) return
    const state = Flip.getState(navRef.current?.querySelectorAll('.sidebar-pill'))
    setActiveTab(tabId)
    setTimeout(() => {
      if (state && navRef.current) {
        Flip.from(state, {
          duration: 0.3,
          ease: 'power2.out',
        })
      }
    }, 0)

    if (panelRef.current) {
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' },
      )
    }
  }

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
      <div className="space-y-4 max-w-4xl mx-auto">
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
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <h1 className="text-title3 text-ink font-bold text-gradient">Preferences & Settings</h1>
          <p className="text-body-sm text-ink-secondary mt-1">
            Manage your account identity, UK intake roadmap parameters, and visual experience.
          </p>
        </div>
      </header>

      {/* 2-Column Sidebar Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Navigation Sidebar */}
        <nav
          ref={navRef}
          className="md:col-span-4 lg:col-span-3 bg-surface border border-hairline rounded-xl p-2 space-y-1 shadow-xs sticky top-20"
        >
          {settingsTabs.map((tab) => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-sm font-medium transition-colors relative cursor-pointer text-left',
                  active
                    ? 'text-ink font-bold'
                    : 'text-ink-secondary hover:text-ink hover:bg-surface-secondary/50',
                )}
              >
                {active && (
                  <div
                    data-flip-id="sidebar-tab-pill"
                    className="sidebar-pill absolute inset-0 bg-accent-soft rounded-lg border border-accent/20 -z-10"
                  />
                )}
                <tab.icon
                  size={16}
                  className={cn(
                    'shrink-0 transition-colors',
                    active ? 'text-accent' : 'text-ink-tertiary',
                  )}
                />
                <div className="min-w-0 flex-1">
                  <span className="block truncate">{tab.label}</span>
                </div>
              </button>
            )
          })}
        </nav>

        {/* Settings Content Panel */}
        <main ref={panelRef} className="md:col-span-8 lg:col-span-9 space-y-6">
          {/* TAB 1: ACCOUNT */}
          {activeTab === 'account' && (
            <Card className="card-lift border-hairline shadow-sm">
              <CardHeader>
                <div className="text-caption font-semibold uppercase tracking-wider text-accent mb-1">
                  Identity & Profile
                </div>
                <CardTitle>Account Profile</CardTitle>
                <CardDescription>Your account details registered with StudYou.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-surface-secondary/40 border border-hairline">
                  <div>
                    <p className="text-caption text-ink-tertiary font-medium">Full Name</p>
                    <p className="text-body font-bold text-ink mt-0.5">{user?.fullName}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-caption text-ink-tertiary font-medium">Email Address</p>
                    <p className="text-body font-bold text-ink truncate mt-0.5">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-caption text-ink-tertiary font-medium">Account Role</p>
                    <p className="text-body font-bold text-ink capitalize mt-0.5">{user?.role}</p>
                  </div>
                  <div>
                    <p className="text-caption text-ink-tertiary font-medium">
                      Authentication Method
                    </p>
                    <p className="text-body font-bold text-ink mt-0.5">Secure JWT Session</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-caption text-ink-secondary">
                    Looking to update your avatar or view saved universities?
                  </span>
                  <Link to="/profile">
                    <Button variant="secondary" size="sm" className="font-semibold">
                      Edit Profile & Shortlist
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 2: INTAKE & JOURNEY */}
          {activeTab === 'journey' && (
            <Card className="card-lift border-hairline shadow-sm">
              <CardHeader>
                <div className="text-caption font-semibold uppercase tracking-wider text-accent mb-1">
                  Roadmap Engine
                </div>
                <CardTitle>Journey Settings</CardTitle>
                <CardDescription>
                  Changing your target intake date automatically recalculates every milestone in
                  your roadmap.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={onSubmit} className="space-y-5">
                  <DrawFocusInput
                    id="settings-intake"
                    label="Target intake date"
                    type="date"
                    required
                    value={intakeDate}
                    onChange={setIntakeDate}
                  />
                  {intakeChanged && (
                    <p className="text-caption text-warning font-medium -mt-2">
                      ⚠️ Target dates across all 21 roadmap steps will be recalculated from this
                      date.
                    </p>
                  )}

                  <DrawFocusInput
                    id="settings-budget"
                    label="Budget for tuition fees and process costs (GBP £)"
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
                    <option value="">Not set (GBP only)</option>
                    {originCountries.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </DrawFocusSelect>
                  <p className="text-caption text-ink-tertiary -mt-2">
                    Used to calculate approximate costs in your local currency alongside GBP.
                  </p>

                  {formError && <p className="text-body-sm text-danger font-medium">{formError}</p>}

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={updateSettings.isPending}
                      className="font-semibold [background-image:var(--accent-gradient)]"
                    >
                      {updateSettings.isPending ? 'Saving settings...' : 'Save journey settings'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* TAB 3: APPEARANCE & DISPLAY */}
          {activeTab === 'appearance' && (
            <Card className="card-lift border-hairline shadow-sm">
              <CardHeader>
                <div className="text-caption font-semibold uppercase tracking-wider text-accent mb-1">
                  Interface & Theme
                </div>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>
                  Choose how StudYou looks and moves on this device.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-body-sm font-semibold text-ink">Theme Mode</Label>
                  <ThemeToggle />
                </div>

                <div className="border-t border-hairline pt-4 space-y-4">
                  <MotionAndDensity />
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 4: DEADLINES & CURRENCY */}
          {activeTab === 'deadlines' && (
            <Card className="card-lift border-hairline shadow-sm">
              <CardHeader>
                <div className="text-caption font-semibold uppercase tracking-wider text-accent mb-1">
                  Notifications & Formatting
                </div>
                <CardTitle>Planning & Currency</CardTitle>
                <CardDescription>
                  Configure how upcoming deadlines are flagged and displayed on your dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <DueSoonPicker />

                <div className="border-t border-hairline pt-4">
                  <HomeCurrencyToggle />
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 5: DATA & PRIVACY */}
          {activeTab === 'data' && (
            <Card className="card-lift border-hairline shadow-sm">
              <CardHeader>
                <div className="text-caption font-semibold uppercase tracking-wider text-accent mb-1">
                  Local Storage & Export
                </div>
                <CardTitle>Your Data & Privacy</CardTitle>
                <CardDescription>
                  Export your roadmap metrics or clear local storage data on this device.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-surface-secondary/40 border border-hairline space-y-2">
                  <p className="text-body-sm font-semibold text-ink">Data Export</p>
                  <p className="text-caption text-ink-secondary">
                    Download a full JSON copy of your journey progress, budget stats, and local
                    preferences.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    variant="secondary"
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
                    <Download size={14} className="mr-1.5" />
                    Export my data (JSON)
                  </Button>

                  <Button
                    ref={dangerBtnRef}
                    variant="danger"
                    onMouseEnter={wiggleDanger}
                    onClick={() => {
                      clearLocalData()
                      toast.success('Local data cleared.')
                      setTimeout(() => window.location.reload(), 600)
                    }}
                  >
                    <Trash2 size={14} className="mr-1.5" />
                    Clear local data
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Recalculate Modal Dialog */}
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
            className="glass-reflect bg-surface rounded-xl border border-hairline shadow-overlay p-6 w-[420px] max-w-full flex flex-col gap-4 select-none"
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
    <div className="space-y-4">
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
    </div>
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <span>
        <span className="block text-body font-medium text-ink">Due soon window</span>
        <span className="block text-caption text-ink-tertiary mt-0.5">
          Deadlines inside this window get the amber flag on your dashboard.
        </span>
      </span>
      <fieldset
        ref={containerRef}
        className="inline-flex bg-surface-secondary p-[3px] rounded-md border-0 shrink-0 relative select-none"
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
              className="px-3 py-1.5 rounded-sm text-caption font-semibold transition-colors duration-[120ms] tabular-nums relative z-10 cursor-pointer text-ink-secondary hover:text-ink"
            >
              {active && (
                <div
                  data-flip-id="days-pill"
                  className="days-indicator absolute inset-0 bg-surface rounded-sm shadow-xs -z-10"
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
