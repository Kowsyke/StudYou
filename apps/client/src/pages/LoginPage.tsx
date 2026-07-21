import { useGSAP } from '@gsap/react'
import {
  Apple,
  ArrowRight,
  Check,
  CheckCircle2,
  Globe,
  Loader2,
  Lock,
  MessageSquare,
  Phone,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input, Label } from '../components/ui/input'
import { WebGLLiquid } from '../components/ui/webgl-liquid'
import { useLogin } from '../hooks/useAuth'
import { apiErrorMessage } from '../lib/api'
import { CustomEase } from '../lib/gsap/CustomEase.js'
import { CustomWiggle } from '../lib/gsap/CustomWiggle.js'
import { DrawSVGPlugin } from '../lib/gsap/DrawSVGPlugin.js'
import { ScrambleTextPlugin } from '../lib/gsap/ScrambleTextPlugin.js'
import { gsap } from '../lib/gsap/index.js'

gsap.registerPlugin(useGSAP, CustomEase, CustomWiggle, ScrambleTextPlugin, DrawSVGPlugin)

CustomEase.create(
  'wiggleEase',
  'M0,0 C0.1,0 0.15,1 0.25,1 C0.35,1 0.4,0 0.5,0 C0.6,0 0.65,1 0.75,1 C0.85,1 0.9,0 1,0',
)
try {
  CustomWiggle.create('errorShake', { wiggles: 5, type: 'easeOut' })
} catch (_e) {
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
  const slashRef = useRef<SVGLineElement>(null)

  // GSAP entrance and ambient animations
  useGSAP(() => {
    const tl = gsap.timeline()
    tl.fromTo(
      cardRef.current,
      { opacity: 0, y: 30, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out' },
    )
    tl.fromTo(
      '.sy-badge',
      { rotate: -180, scale: 0.5 },
      { rotate: 0, scale: 1, duration: 0.6, ease: 'power3.out' },
      '-=0.4',
    )
    tl.fromTo(
      'form > div',
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, stagger: 0.08, duration: 0.4, ease: 'power2.out' },
      '-=0.3',
    )
    tl.fromTo(
      '.login-feature-item',
      { opacity: 0, x: 20 },
      { opacity: 1, x: 0, stagger: 0.1, duration: 0.5, ease: 'power2.out' },
      '-=0.4',
    )

    // Floating drift on preview card
    gsap.to('.login-preview-widget', {
      y: '-=10',
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      duration: 4.2,
    })
  }, [])

  // Animate slash line on Eye icon toggle
  useEffect(() => {
    if (slashRef.current) {
      if (showPassword) {
        gsap.to(slashRef.current, { drawSVG: '100%', duration: 0.25, ease: 'power2.out' })
      } else {
        gsap.to(slashRef.current, { drawSVG: '0%', duration: 0.25, ease: 'power2.in' })
      }
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

    login.mutate(
      { email, password },
      {
        onSuccess: (payload) => {
          navigate(payload.user.role === 'admin' ? '/admin' : '/')
        },
        onError: (err) => {
          setError(apiErrorMessage(err, 'Login failed, please try again'))
        },
      },
    )
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden bg-[#02040b]">
      {/* GPU WebGL Fluid Field Background */}
      <WebGLLiquid
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
        title=""
        subtitle=""
        description=""
        colorDeep="#04050b"
        colorMid="#134d93"
        colorHighlight="#8cecff"
        speed={0.7}
        flowStrength={0.8}
        grain={0.03}
        contrast={1.05}
        opacity={0.4}
        reveal
      />

      <div className="pointer-events-none absolute inset-0 scanner-grid opacity-30 z-0" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-canvas/40 via-canvas/70 to-canvas z-0" />

      {/* Main Split-Panel Card Container */}
      <div
        ref={cardRef}
        className="relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 rounded-2xl border border-hairline-strong bg-surface/80 backdrop-blur-xl shadow-overlay overflow-hidden"
      >
        {/* Left Side: Sign-In Form */}
        <div className="md:col-span-6 p-6 sm:p-8 md:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-hairline">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="sy-badge w-9 h-9 rounded-sm bg-accent-solid text-white text-body-lg font-extrabold flex items-center justify-center [background-image:var(--accent-gradient)] shadow-md">
                SY
              </span>
              <div>
                <h1 className="text-title3 text-ink font-podium font-bold tracking-tight text-gradient">
                  StudYou
                </h1>
                <p className="text-caption text-ink-secondary">UK student roadmap</p>
              </div>
            </div>

            <div>
              <h2 className="text-title2 text-ink font-bold">Welcome back</h2>
              <p className="text-body text-ink-secondary mt-1">
                Sign in to continue tracking your official UK intake milestones.
              </p>
            </div>

            {sessionExpired && !error && (
              <div className="flex items-start gap-2.5 bg-warning-soft border border-warning text-warning rounded-md p-3 text-caption font-medium leading-relaxed">
                <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                <span>
                  Your session has expired. For security, please sign in again to resume progress.
                </span>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="draw-focus space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-surface-secondary/50 border-hairline focus:border-accent"
                />
              </div>

              <div className="draw-focus space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pr-10 bg-surface-secondary/50 border-hairline focus:border-accent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink transition-colors duration-150 cursor-pointer"
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

              {error && (
                <div className="bg-danger-soft border border-danger text-danger rounded-md p-3 text-caption font-medium">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full mt-2 magnetic-btn bg-accent-solid text-white [background-image:var(--accent-gradient)] font-semibold shadow-md cursor-pointer"
                disabled={login.isPending}
              >
                {login.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign in
                    <ArrowRight size={16} />
                  </span>
                )}
              </Button>

              {/* Social Login Options (Future Features - Coming Soon) */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-hairline" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                  <span className="bg-surface px-2.5 text-ink-tertiary font-medium">
                    Or sign in with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled
                  className="flex items-center justify-between px-3 py-2 rounded-md bg-surface-secondary/30 border border-hairline/60 text-ink-secondary text-caption font-medium opacity-70 cursor-not-allowed"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <title>Google logo</title>
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    Google
                  </span>
                  <span className="text-[10px] bg-accent-soft text-accent px-1.5 py-0.5 rounded-full font-bold">
                    Soon
                  </span>
                </button>

                <button
                  type="button"
                  disabled
                  className="flex items-center justify-between px-3 py-2 rounded-md bg-surface-secondary/30 border border-hairline/60 text-ink-secondary text-caption font-medium opacity-70 cursor-not-allowed"
                >
                  <span className="flex items-center gap-2">
                    <Apple size={14} />
                    Apple
                  </span>
                  <span className="text-[10px] bg-accent-soft text-accent px-1.5 py-0.5 rounded-full font-bold">
                    Soon
                  </span>
                </button>

                <button
                  type="button"
                  disabled
                  className="flex items-center justify-between px-3 py-2 rounded-md bg-surface-secondary/30 border border-hairline/60 text-ink-secondary text-caption font-medium opacity-70 cursor-not-allowed"
                >
                  <span className="flex items-center gap-2">
                    <Phone size={14} />
                    Phone
                  </span>
                  <span className="text-[10px] bg-accent-soft text-accent px-1.5 py-0.5 rounded-full font-bold">
                    Soon
                  </span>
                </button>

                <button
                  type="button"
                  disabled
                  className="flex items-center justify-between px-3 py-2 rounded-md bg-surface-secondary/30 border border-hairline/60 text-ink-secondary text-caption font-medium opacity-70 cursor-not-allowed"
                >
                  <span className="flex items-center gap-2">
                    <MessageSquare size={14} />
                    Reddit
                  </span>
                  <span className="text-[10px] bg-accent-soft text-accent px-1.5 py-0.5 rounded-full font-bold">
                    Soon
                  </span>
                </button>
              </div>
            </form>
          </div>

          <div className="pt-6 mt-6 border-t border-hairline flex flex-col gap-3 text-center sm:text-left">
            <p className="text-body text-ink-secondary">
              Don't have an account?{' '}
              <Link to="/register" className="text-accent font-semibold hover:underline rounded-xs">
                Create an account
              </Link>
            </p>
            <p className="text-caption text-ink-tertiary leading-relaxed">
              StudYou provides guidance and signposting only. It is not legal or immigration advice.
            </p>
          </div>
        </div>

        {/* Right Side: Interactive Feature Showcase Panel */}
        <div className="hidden md:flex md:col-span-6 bg-surface-secondary/40 p-8 lg:p-10 flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-1.5 bg-accent-soft text-accent text-caption font-semibold uppercase tracking-wider px-3 py-1 rounded-full">
              <Sparkles size={12} />
              Self-service UK Roadmap
            </div>

            <h3 className="text-title1 text-ink font-bold leading-tight">
              Track every official step without agency fees.
            </h3>

            <p className="text-body text-ink-secondary leading-relaxed">
              From English language tests to CAS statements and health surcharges, track your real
              deadlines and total costs in your currency.
            </p>

            {/* Floating Live Preview Widget */}
            <div className="login-preview-widget bg-surface border border-hairline rounded-xl p-4 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-xs bg-positive-soft text-positive flex items-center justify-center">
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <span className="text-body font-semibold text-ink">IELTS Academic Test</span>
                </div>
                <span className="text-caption font-bold text-accent">£229</span>
              </div>
              <div className="flex items-center justify-between text-caption text-ink-tertiary pt-2 border-t border-hairline">
                <span>Target: 25 Nov</span>
                <span className="text-positive font-medium">Completed</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="login-feature-item flex items-center gap-3 text-body text-ink">
                <CheckCircle2 size={16} className="text-accent shrink-0" />
                <span>21 official UK intake steps with real deadlines</span>
              </div>
              <div className="login-feature-item flex items-center gap-3 text-body text-ink">
                <Globe size={16} className="text-accent shrink-0" />
                <span>Live currency converter for tuition & living costs</span>
              </div>
              <div className="login-feature-item flex items-center gap-3 text-body text-ink">
                <Lock size={16} className="text-accent shrink-0" />
                <span>Zero hidden agency commissions or markups</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-hairline/60 flex items-center justify-between text-caption text-ink-tertiary">
            <span>200+ UK Universities</span>
            <span>Official gov.uk sources</span>
          </div>
        </div>
      </div>
    </div>
  )
}
