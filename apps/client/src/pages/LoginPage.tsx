import { motion } from 'framer-motion'
import { type FormEvent, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input, Label } from '../components/ui/input'
import { useLogin } from '../hooks/useAuth'
import { apiErrorMessage } from '../lib/api'

const swift = [0.16, 1, 0.3, 1] as const

export function LoginPage() {
  const navigate = useNavigate()
  const login = useLogin()
  const [searchParams] = useSearchParams()
  const sessionExpired = searchParams.get('expired') === '1'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    login.mutate(
      { email, password },
      {
        onSuccess: (payload) => navigate(payload.user.role === 'admin' ? '/admin' : '/'),
        onError: (err) => setError(apiErrorMessage(err, 'Login failed, please try again')),
      },
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 [background:radial-gradient(circle_at_50%_50%,var(--surface-secondary)_0%,var(--canvas)_100%)]">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: swift }}
        className="w-[360px] max-w-full"
      >
        <div className="bg-surface border border-hairline rounded-lg shadow-overlay p-8 flex flex-col gap-5">
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="w-8 h-8 rounded-sm bg-accent-solid text-white text-body-lg font-extrabold flex items-center justify-center">
              SY
            </span>
            <h1 className="text-title3 text-ink">StudYou</h1>
            <p className="text-xs text-ink-secondary">UK student application roadmap</p>
          </div>

          {sessionExpired && !error && (
            <p className="bg-warning-soft border border-warning text-warning rounded-sm px-3 py-2.5 text-caption font-medium leading-relaxed">
              Your session has expired. For your security, please sign in again to resume your
              roadmap progress.
            </p>
          )}

          <form onSubmit={onSubmit} className="flex flex-col gap-3">
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
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
              />
            </div>
            {error && <p className="text-body text-danger">{error}</p>}
            <Button type="submit" className="w-full mt-1" disabled={login.isPending}>
              {login.isPending ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <p className="text-body text-ink-secondary text-center">
            New here?{' '}
            <Link to="/register" className="text-accent font-semibold hover:underline rounded-xs">
              Create an account
            </Link>
          </p>
        </div>

        <p className="text-caption text-ink-tertiary text-center mt-6 leading-relaxed">
          StudYou provides guidance and signposting only. It is not legal or immigration advice.
        </p>
      </motion.div>
    </div>
  )
}
