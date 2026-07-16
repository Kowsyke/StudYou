import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input, Label, Select } from '../components/ui/input'
import { useRegister } from '../hooks/useAuth'
import { useCountries } from '../hooks/useMeta'
import { apiErrorMessage } from '../lib/api'

// Mirrors the server side zod password policy so feedback is instant
// while the API remains the authority.
const passwordRules = [
  { label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
  { label: 'Includes a letter', test: (value: string) => /[A-Za-z]/.test(value) },
  { label: 'Includes a number', test: (value: string) => /[0-9]/.test(value) },
]

export function RegisterPage() {
  const navigate = useNavigate()
  const register = useRegister()
  const { data: countries } = useCountries()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [originCountryCode, setOriginCountryCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const originCountries = (countries ?? []).filter((c) => !c.isDestination)
  const passwordValid = passwordRules.every((rule) => rule.test(password))

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    register.mutate(
      { fullName, email, password, originCountryCode: originCountryCode || undefined },
      {
        onSuccess: () => navigate('/onboarding'),
        onError: (err) => setError(apiErrorMessage(err, 'Registration failed, please try again')),
      },
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            Stud<span className="text-accent">You</span>
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Skip the agencies. Follow the official steps yourself.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
                {password.length > 0 && !passwordValid && (
                  <ul className="mt-2 space-y-1">
                    {passwordRules.map((rule) => {
                      const passed = rule.test(password)
                      return (
                        <li
                          key={rule.label}
                          className={`flex items-center gap-1.5 text-xs ${
                            passed ? 'text-positive' : 'text-ink-muted'
                          }`}
                        >
                          {passed ? <Check size={12} /> : <X size={12} />}
                          {rule.label}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
              <div>
                <Label htmlFor="origin">Where are you applying from?</Label>
                <Select
                  id="origin"
                  value={originCountryCode}
                  onChange={(e) => setOriginCountryCode(e.target.value)}
                >
                  <option value="">Select a country (optional)</option>
                  {originCountries.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-ink-muted mt-1">
                  Used to show costs in your home currency too.
                </p>
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button
                type="submit"
                className="w-full"
                disabled={register.isPending || (password.length > 0 && !passwordValid)}
              >
                {register.isPending ? 'Creating account...' : 'Continue'}
              </Button>
            </form>
            <p className="text-sm text-ink-secondary text-center mt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-accent font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
