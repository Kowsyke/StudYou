import { motion } from 'framer-motion'
import { type FormEvent, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { QueryError } from '../components/QueryError'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input, Label, Select } from '../components/ui/input'
import { CardSkeleton } from '../components/ui/skeleton'
import { hasNoJourney, useJourney, useUpdateSettings } from '../hooks/useJourney'
import { useCountries } from '../hooks/useMeta'
import { apiErrorMessage } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { toast } from '../store/toastStore'

export function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const { data: overview, isPending, error, refetch, isRefetching } = useJourney()
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
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-ink-secondary mt-1">
          Adjust your plan. Your roadmap and budget update everywhere, instantly.
        </p>
      </header>

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

      {confirming && (
        <div className="fixed inset-0 z-50 bg-black/25 backdrop-blur-[2px] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="bg-surface rounded-card border border-hairline shadow-card px-6 py-5 max-w-sm w-full"
          >
            <h2 id="confirm-title" className="text-base font-semibold">
              Recalculate your roadmap?
            </h2>
            <p className="text-sm text-ink-secondary mt-1.5">
              Changing your intake date will automatically recalculate every target date in your
              roadmap.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="ghost" onClick={() => setConfirming(false)}>
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
