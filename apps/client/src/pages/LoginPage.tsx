import { motion } from 'framer-motion'
import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input, Label } from '../components/ui/input'
import { useLogin } from '../hooks/useAuth'
import { apiErrorMessage } from '../lib/api'

export function LoginPage() {
  const navigate = useNavigate()
  const login = useLogin()
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
    <div className="min-h-screen flex items-center justify-center px-4">
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
            Every official step to study in the UK, in one place.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
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
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" className="w-full" disabled={login.isPending}>
                {login.isPending ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
            <p className="text-sm text-ink-secondary text-center mt-4">
              New here?{' '}
              <Link to="/register" className="text-accent font-medium hover:underline">
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-xs text-ink-muted text-center mt-6">
          Guidance and signposting only, not legal or immigration advice.
        </p>
      </motion.div>
    </div>
  )
}
