import { useGSAP } from '@gsap/react'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input, Label, Select } from '../components/ui/input'
import { useRegister } from '../hooks/useAuth'
import { useCountries } from '../hooks/useMeta'
import { apiErrorMessage } from '../lib/api'
import { DrawSVGPlugin } from '../lib/gsap/DrawSVGPlugin.js'
import { Physics2DPlugin } from '../lib/gsap/Physics2DPlugin.js'
import { gsap } from '../lib/gsap/index.js'

gsap.registerPlugin(useGSAP, DrawSVGPlugin, Physics2DPlugin)

// Mirrors the Zod policy with custom DrawSVG checks
const passwordRules = [
  { label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
  { label: 'Includes a letter', test: (value: string) => /[A-Za-z]/.test(value) },
  { label: 'Includes a number', test: (value: string) => /[0-9]/.test(value) },
]

function CheckMarkSvg({ passed }: { passed: boolean }) {
  const pathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    if (!pathRef.current) return
    gsap.to(pathRef.current, {
      drawSVG: passed ? '100%' : '0%',
      duration: 0.3,
      ease: 'power2.out',
    })
  }, [passed])

  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={passed ? 'text-positive' : 'text-ink-tertiary'}
    >
      <title>Rule verification status</title>
      <path ref={pathRef} d="M20 6L9 17l-5-5" />
    </svg>
  )
}

export function RegisterPage() {
  const navigate = useNavigate()
  const register = useRegister()
  const { data: countries } = useCountries()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [originCountryCode, setOriginCountryCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const cardRef = useRef<HTMLDivElement>(null)

  const originCountries = (countries ?? []).filter((c) => !c.isDestination)
  const passwordValid = passwordRules.every((rule) => rule.test(password))

  // GSAP entrance animation
  useGSAP(() => {
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 15, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power2.out' },
    )

    gsap.fromTo(
      'form > div',
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, stagger: 0.08, duration: 0.4, ease: 'power2.out', delay: 0.15 },
    )
  })

  // Confetti helper
  const launchConfetti = () => {
    const container = document.createElement('div')
    container.className = 'fixed inset-0 pointer-events-none z-50 overflow-hidden'
    document.body.appendChild(container)

    const colors = ['#0066cc', '#4364f7', '#2b4eff', '#5b51c9', '#0b7285', '#30d158']
    const count = 45

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div')
      const size = Math.random() * 8 + 6
      el.style.width = `${size}px`
      el.style.height = `${size}px`
      el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
      el.style.position = 'absolute'
      el.style.left = '50%'
      el.style.top = '60%'
      el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px'
      container.appendChild(el)

      gsap.to(el, {
        physics2D: {
          velocity: Math.random() * 260 + 140,
          angle: Math.random() * 60 + 240, // 240 to 300 deg
          gravity: 420,
        },
        opacity: 0,
        rotation: Math.random() * 360,
        duration: Math.random() * 1.5 + 1.0,
        onComplete: () => el.remove(),
      })
    }

    setTimeout(() => {
      container.remove()
    }, 3000)
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    register.mutate(
      { fullName, email, password, originCountryCode: originCountryCode || undefined },
      {
        onSuccess: () => {
          launchConfetti()
          setTimeout(() => {
            navigate('/onboarding')
          }, 800)
        },
        onError: (err) => setError(apiErrorMessage(err, 'Registration failed, please try again')),
      },
    )
  }

  return (
    <div className="noise-overlay min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="ambient ambient-a" aria-hidden="true" />
      <div className="ambient ambient-b" aria-hidden="true" />
      <div ref={cardRef} className="w-full max-w-sm relative z-10">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gradient">StudYou</h1>
          <p className="text-sm text-ink-secondary mt-1">
            Skip the agencies. Follow the official steps yourself.
          </p>
        </div>

        <Card className="glass-reflect">
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="draw-focus">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full"
                />
              </div>
              <div className="draw-focus">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full"
                />
              </div>
              <div className="draw-focus">
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
                  className="w-full"
                />
                {password.length > 0 && (
                  <ul className="mt-2 space-y-1 bg-surface-secondary/40 rounded-sm p-2 border border-hairline">
                    {passwordRules.map((rule) => {
                      const passed = rule.test(password)
                      return (
                        <li
                          key={rule.label}
                          className={`flex items-center gap-1.5 text-xs font-medium ${
                            passed ? 'text-positive' : 'text-ink-secondary'
                          }`}
                        >
                          <CheckMarkSvg passed={passed} />
                          {rule.label}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
              <div className="draw-focus">
                <Label htmlFor="origin">Where are you applying from?</Label>
                <Select
                  id="origin"
                  value={originCountryCode}
                  onChange={(e) => setOriginCountryCode(e.target.value)}
                  className="w-full"
                >
                  <option value="">Select a country (optional)</option>
                  {originCountries.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-ink-tertiary mt-1">
                  Used to show costs in your home currency too.
                </p>
              </div>
              {error && <p className="text-sm text-danger font-medium">{error}</p>}
              <Button
                type="submit"
                className="w-full magnetic-btn"
                disabled={register.isPending || (password.length > 0 && !passwordValid)}
              >
                {register.isPending ? 'Creating account...' : 'Continue'}
              </Button>
            </form>
            <p className="text-sm text-ink-secondary text-center mt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-accent font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
