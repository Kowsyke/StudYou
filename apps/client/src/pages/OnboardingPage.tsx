import { motion } from 'framer-motion'
import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input, Label, Select } from '../components/ui/input'
import { useCreateJourney } from '../hooks/useJourney'
import { apiErrorMessage } from '../lib/api'

const courseLevels = ['Foundation', 'Undergraduate', 'Postgraduate taught', 'Postgraduate research']

export function OnboardingPage() {
  const navigate = useNavigate()
  const createJourney = useCreateJourney()
  const [intakeDate, setIntakeDate] = useState('')
  const [courseLevel, setCourseLevel] = useState('Undergraduate')
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
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader>
            <CardTitle>Set up your journey</CardTitle>
            <CardDescription>
              We will build a personalised roadmap of every official step, working backwards from
              your intake date.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="intake">Target intake date</Label>
                <Input
                  id="intake"
                  type="date"
                  required
                  value={intakeDate}
                  onChange={(e) => setIntakeDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="level">Course level</Label>
                <Select
                  id="level"
                  value={courseLevel}
                  onChange={(e) => setCourseLevel(e.target.value)}
                >
                  {courseLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="budget">Budget for fees and process costs (GBP)</Label>
                <Input
                  id="budget"
                  type="number"
                  min={0}
                  step="100"
                  required
                  value={budgetGbp}
                  onChange={(e) => setBudgetGbp(e.target.value)}
                  placeholder="4000"
                />
                <p className="text-xs text-ink-muted mt-1">
                  Not tuition, just the process: tests, visa, health surcharge, travel and setup.
                </p>
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" className="w-full" disabled={createJourney.isPending}>
                {createJourney.isPending ? 'Building your roadmap...' : 'Build my roadmap'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
