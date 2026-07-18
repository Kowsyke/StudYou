import { motion } from 'framer-motion'
import { Download, Moon, Sun, Trash2 } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
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
import { useAuthStore } from '../store/authStore'
import { DUE_SOON_OPTIONS, clearLocalData, usePreferencesStore } from '../store/preferencesStore'
import { type Theme, useThemeStore } from '../store/themeStore'
import { toast } from '../store/toastStore'

const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
]

function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  return (
    <fieldset
      className="inline-flex bg-surface-secondary p-[3px] rounded-sm border-0"
      aria-label="Appearance"
    >
      {themeOptions.map((option) => {
        const active = theme === option.value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => setTheme(option.value)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-[6px] text-caption font-semibold transition-colors duration-[120ms] ${
              active ? 'bg-surface text-ink shadow-sm' : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <option.icon size={12} />
            {option.label}
          </button>
        )
      })}
    </fieldset>
  )
}

export function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const { data: overview, isPending, error, refetch, isRefetching } = useJourney()

  // Admins have their own settings inside the admin panel; the student
  // settings page depends on a journey which admins do not have.
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

  useEffect(() => {
    if (!overview) return
    setBudgetGbp(String(overview.journey.budgetPence / 100))
    setIntakeDate(overview.journey.intakeDate)
  }, [overview])

  useEffect(() => {
    setOriginCountryCode(currentOriginCode)
  }, [currentOriginCode])

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
          // Keep the cached user in step so the home country select and
          // any currency display stay correct without a re login.
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
        <h1 className="text-title3 text-ink">Settings</h1>
        <p className="text-xs text-ink-secondary mt-1">
          Adjust your plan. Your roadmap and budget update everywhere, instantly.
        </p>
      </header>

      <Card className="max-w-xl mb-5">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Who you are signed in as.</CardDescription>
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
          <Link to="/profile" className="ml-auto text-xs font-medium text-accent hover:underline">
            Edit avatar and shortlist
          </Link>
        </CardContent>
      </Card>

      <Card className="max-w-xl mb-5">
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

      <Card className="max-w-xl mb-5">
        <CardHeader>
          <CardTitle>Planning</CardTitle>
          <CardDescription>How StudYou flags what is coming up.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <DueSoonPicker />
          <HomeCurrencyToggle />
        </CardContent>
      </Card>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Journey settings</CardTitle>
          <CardDescription>
            Changing the intake date recalculates every target date in your roadmap.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="settings-intake">Target intake date</Label>
              <Input
                id="settings-intake"
                type="date"
                required
                value={intakeDate}
                onChange={(e) => setIntakeDate(e.target.value)}
              />
              {intakeChanged && (
                <p className="text-xs text-ink-muted mt-1">
                  All target dates will be recalculated from this date.
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="settings-budget">Budget for fees and process costs (GBP)</Label>
              <Input
                id="settings-budget"
                type="number"
                min={0}
                step="100"
                required
                value={budgetGbp}
                onChange={(e) => setBudgetGbp(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="settings-origin">Home country</Label>
              <Select
                id="settings-origin"
                value={originCountryCode}
                onChange={(e) => setOriginCountryCode(e.target.value)}
              >
                <option value="">Not set</option>
                {originCountries.map((c) => (
                  <option key={c.id} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-ink-muted mt-1">
                Sets the home currency shown next to GBP costs.
              </p>
            </div>
            {formError && <p className="text-sm text-danger">{formError}</p>}
            <Button type="submit" disabled={updateSettings.isPending}>
              {updateSettings.isPending ? 'Saving...' : 'Save settings'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-xl mt-5">
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
            variant="danger"
            size="sm"
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
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: [0.65, 0, 0.35, 1] }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="glass-reflect bg-surface rounded-lg border border-hairline shadow-overlay p-6 w-[400px] max-w-full flex flex-col gap-4"
          >
            <h2 id="confirm-title" className="text-body-lg font-bold text-ink">
              Recalculate your roadmap?
            </h2>
            <p className="text-body text-ink-secondary leading-relaxed">
              Changing your intake date will automatically recalculate every target date in your
              roadmap.
            </p>
            <div className="flex justify-end gap-2.5 mt-2">
              {/* autoFocus moves keyboard focus into the dialog on open. */}
              <Button variant="secondary" autoFocus onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button onClick={submit}>Recalculate and save</Button>
            </div>
          </motion.div>
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

  return (
    <div className="flex items-center justify-between gap-4">
      <span>
        <span className="block text-body font-medium text-ink">Due soon window</span>
        <span className="block text-caption text-ink-tertiary mt-0.5">
          Deadlines inside this window get the amber flag on your dashboard.
        </span>
      </span>
      <fieldset
        className="inline-flex bg-surface-secondary p-[3px] rounded-sm border-0 shrink-0"
        aria-label="Due soon window"
      >
        {DUE_SOON_OPTIONS.map((days) => (
          <button
            key={days}
            type="button"
            aria-pressed={dueSoonDays === days}
            onClick={() => setDueSoonDays(days)}
            className={`px-3 py-1.5 rounded-[6px] text-caption font-semibold transition-colors duration-[120ms] tabular-nums ${
              dueSoonDays === days
                ? 'bg-surface text-ink shadow-sm'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            {days}d
          </button>
        ))}
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
