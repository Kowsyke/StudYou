import { useGSAP } from '@gsap/react'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input, Label } from '../components/ui/input'
import { useLogin } from '../hooks/useAuth'
import { apiErrorMessage } from '../lib/api'
import { CustomEase } from '../lib/gsap/CustomEase.js'
import { CustomWiggle } from '../lib/gsap/CustomWiggle.js'
import { DrawSVGPlugin } from '../lib/gsap/DrawSVGPlugin.js'
import { ScrambleTextPlugin } from '../lib/gsap/ScrambleTextPlugin.js'
import { gsap } from '../lib/gsap/index.js'

gsap.registerPlugin(useGSAP, CustomEase, CustomWiggle, ScrambleTextPlugin, DrawSVGPlugin)

// Create the error wiggle ease on load
CustomEase.create(
  'wiggleEase',
  'M0,0 C0.1,0 0.15,1 0.25,1 C0.35,1 0.4,0 0.5,0 C0.6,0 0.65,1 0.75,1 C0.85,1 0.9,0 1,0',
)
try {
  CustomWiggle.create('errorShake', { wiggles: 5, type: 'easeOut' })
} catch (e) {
  // fallback if errorShake creation fails
}

export function LoginPage() {
  const navigate = useNavigate()
  const login = useLogin()
  const [searchParams] = useSearchParams()
  const sessionExpired = searchParams.get('expired') === '1'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)
  const submitBtnRef = useRef<HTMLButtonElement>(null)
  const slashRef = useRef<SVGLineElement>(null)

  // GSAP entrance and ambient animation
  useGSAP(() => {
    // Entrance timeline
    const tl = gsap.timeline()
    tl.fromTo(
      cardRef.current,
      { opacity: 0, y: 15, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power2.out' },
    )
    tl.fromTo(
      '.sy-badge',
      { rotate: -180, scale: 0.5 },
      { rotate: 0, scale: 1, duration: 0.6, ease: 'power3.out' },
      '-=0.3',
    )
    tl.fromTo(
      'form > div',
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, stagger: 0.08, duration: 0.4, ease: 'power2.out' },
      '-=0.2',
    )

    // Slow ambient blob drift
    gsap.to('.ambient-a', {
      x: 70,
      y: 50,
      scale: 1.2,
      duration: 16,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    })
    gsap.to('.ambient-b', {
      x: -60,
      y: -40,
      scale: 1.15,
      duration: 20,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    })
  })

  // Animate eye slash line on showPassword change
  useEffect(() => {
    const slash = slashRef.current
    if (slash) {
      gsap.to(slash, {
        drawSVG: showPassword ? '0%' : '100%',
        duration: 0.25,
        ease: 'power2.out',
      })
    }
  }, [showPassword])

  // Error shake animation
  useEffect(() => {
    if (error && cardRef.current) {
      gsap.fromTo(cardRef.current, { x: -6 }, { x: 0, duration: 0.4, ease: 'errorShake' })
    }
  }, [error])

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (submitBtnRef.current) {
      gsap.to(submitBtnRef.current, {
        scrambleText: {
          text: 'Authenticating...',
          chars: '01',
          speed: 0.5,
        },
        duration: 0.8,
      })
    }

    login.mutate(
      { email, password },
      {
        onSuccess: (payload) => {
          if (submitBtnRef.current) {
            gsap.to(submitBtnRef.current, {
              scrambleText: {
                text: 'Welcome back!',
                chars: '01',
                speed: 0.5,
              },
              duration: 0.6,
              onComplete: () => {
                navigate(payload.user.role === 'admin' ? '/admin' : '/')
              },
            })
          } else {
            navigate(payload.user.role === 'admin' ? '/admin' : '/')
          }
        },
        onError: (err) => {
          setError(apiErrorMessage(err, 'Login failed, please try again'))
          if (submitBtnRef.current) {
            gsap.to(submitBtnRef.current, {
              text: 'Sign in',
              duration: 0.3,
            })
          }
        },
      },
    )
  }

  return (
    <div className="noise-overlay min-h-screen flex items-center justify-center px-4 [background:radial-gradient(circle_at_50%_50%,var(--surface-secondary)_0%,var(--canvas)_100%)] relative overflow-hidden">
      <div className="ambient ambient-a" aria-hidden="true" />
      <div className="ambient ambient-b" aria-hidden="true" />
      <div ref={cardRef} className="w-[360px] max-w-full relative z-10">
        <div className="glass-reflect bg-surface border border-hairline rounded-lg shadow-overlay p-8 flex flex-col gap-5">
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="sy-badge w-8 h-8 rounded-sm bg-accent-solid text-white text-body-lg font-extrabold flex items-center justify-center [background-image:var(--accent-gradient)] shadow-md">
              SY
            </span>
            <h1 className="text-title3 text-ink font-bold text-gradient">StudYou</h1>
            <p className="text-xs text-ink-secondary">UK student application roadmap</p>
          </div>

          {sessionExpired && !error && (
            <p className="bg-warning-soft border border-warning text-warning rounded-sm px-3 py-2.5 text-caption font-medium leading-relaxed">
              Your session has expired. For your security, please sign in again to resume your
              roadmap progress.
            </p>
          )}

          <form onSubmit={onSubmit} className="flex flex-col gap-3">
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
            <div className="draw-focus relative">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-secondary hover:text-ink transition-colors duration-100 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <title>Password visibility toggle icon</title>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                    <line ref={slashRef} x1="2" y1="2" x2="22" y2="22" />
                  </svg>
                </button>
              </div>
            </div>
            {error && <p className="text-body text-danger font-medium">{error}</p>}
            <Button
              ref={submitBtnRef}
              type="submit"
              className="w-full mt-1 magnetic-btn"
              disabled={login.isPending}
            >
              Sign in
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
      </div>
    </div>
  )
}
