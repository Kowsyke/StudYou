import { useGSAP } from '@gsap/react'
import {
  Apple,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  Globe,
  Loader2,
  MessageSquare,
  Phone,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input, Label, Select } from '../components/ui/input'
import { WebGLLiquid } from '../components/ui/webgl-liquid'
import { useRegister } from '../hooks/useAuth'
import { useCountries } from '../hooks/useMeta'
import { apiErrorMessage } from '../lib/api'
import { DrawSVGPlugin } from '../lib/gsap/DrawSVGPlugin.js'
import { Physics2DPlugin } from '../lib/gsap/Physics2DPlugin.js'
import { gsap } from '../lib/gsap/index.js'

gsap.registerPlugin(useGSAP, DrawSVGPlugin, Physics2DPlugin)

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
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [originCountryCode, setOriginCountryCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const cardRef = useRef<HTMLDivElement>(null)
  const slashRef = useRef<SVGLineElement>(null)
  const confirmSlashRef = useRef<SVGLineElement>(null)

  const originCountries = (countries ?? []).filter((c) => !c.isDestination)
  const passwordValid = passwordRules.every((rule) => rule.test(password))
  const passedCount = passwordRules.filter((rule) => rule.test(password)).length
  const passwordsMatch = password.length > 0 && password === confirmPassword

  // GSAP entrance animation
  useGSAP(() => {
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 20, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' },
    )

    gsap.fromTo(
      'form > div',
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, stagger: 0.08, duration: 0.4, ease: 'power2.out', delay: 0.15 },
    )

    gsap.fromTo(
      '.reg-feature-item',
      { opacity: 0, x: 20 },
      { opacity: 1, x: 0, stagger: 0.1, duration: 0.5, ease: 'power2.out', delay: 0.2 },
    )
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

  // Animate eye slash line on showConfirmPassword change
  useEffect(() => {
    const slash = confirmSlashRef.current
    if (slash) {
      gsap.to(slash, {
        drawSVG: showConfirmPassword ? '0%' : '100%',
        duration: 0.25,
        ease: 'power2.out',
      })
    }
  }, [showConfirmPassword])

  // Confetti explosion helper
  const launchConfetti = () => {
    const container = document.createElement('div')
    container.className = 'fixed inset-0 pointer-events-none z-50 overflow-hidden'
    document.body.appendChild(container)

    const colors = ['#0066cc', '#4364f7', '#2b4eff', '#5b51c9', '#0b7285', '#30d158']
    const count = 50

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div')
      const size = Math.random() * 8 + 6
      el.style.width = `${size}px`
      el.style.height = `${size}px`
      el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
      el.style.position = 'absolute'
      el.style.left = '50%'
      el.style.top = '50%'
      el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px'
      container.appendChild(el)

      gsap.to(el, {
        physics2D: {
          velocity: Math.random() * 280 + 160,
          angle: Math.random() * 360,
          gravity: 400,
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

    if (confirmPassword && !passwordsMatch) {
      setError('Passwords do not match.')
      return
    }

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
        speed={0.2}
        flowStrength={0.8}
        grain={0.03}
        contrast={1.05}
        opacity={0.4}
        reveal
      />

      <div className="pointer-events-none absolute inset-0 scanner-grid opacity-30 z-0" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-canvas/40 via-canvas/70 to-canvas z-0" />

      {/* Main Split-Panel Registration Container */}
      <div
        ref={cardRef}
        className="relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 rounded-2xl border border-hairline-strong bg-surface/80 backdrop-blur-xl shadow-overlay overflow-hidden"
      >
        {/* Left Side: Registration Form */}
        <div className="md:col-span-7 p-6 sm:p-8 md:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-hairline">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-sm bg-accent-solid text-white text-body-lg font-extrabold flex items-center justify-center [background-image:var(--accent-gradient)] shadow-md">
                SY
              </span>
              <div>
                <h1 className="text-title3 text-ink font-bold tracking-tight text-gradient">
                  StudYou
                </h1>
                <p className="text-caption text-ink-secondary">Create your account</p>
              </div>
            </div>

            <div>
              <h2 className="text-title2 text-ink font-bold">Start your UK study roadmap</h2>
              <p className="text-body text-ink-secondary mt-1">
                Skip the middlemen. Follow official steps with real target dates.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="draw-focus space-y-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full bg-surface-secondary/50 border-hairline focus:border-accent"
                />
              </div>

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

              {/* Password Input with Eye Visibility Toggle */}
              <div className="draw-focus space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
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

                {/* Password Strength Meter */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-2 bg-surface-secondary/40 rounded-md p-3 border border-hairline">
                    <div className="flex items-center justify-between text-caption font-medium">
                      <span className="text-ink-secondary">Password strength</span>
                      <span
                        className={
                          passedCount === 3
                            ? 'text-positive font-bold'
                            : passedCount === 2
                              ? 'text-warning font-bold'
                              : 'text-ink-tertiary'
                        }
                      >
                        {passedCount === 3 ? 'Strong' : passedCount === 2 ? 'Medium' : 'Weak'}
                      </span>
                    </div>

                    <div className="h-1.5 w-full bg-surface-secondary rounded-full overflow-hidden flex gap-1">
                      <div
                        className={`h-full transition-all duration-300 flex-1 ${
                          passedCount >= 1 ? 'bg-danger' : 'bg-transparent'
                        }`}
                      />
                      <div
                        className={`h-full transition-all duration-300 flex-1 ${
                          passedCount >= 2 ? 'bg-warning' : 'bg-transparent'
                        }`}
                      />
                      <div
                        className={`h-full transition-all duration-300 flex-1 ${
                          passedCount === 3 ? 'bg-positive' : 'bg-transparent'
                        }`}
                      />
                    </div>

                    <ul className="space-y-1 pt-1">
                      {passwordRules.map((rule) => {
                        const passed = rule.test(password)
                        return (
                          <li
                            key={rule.label}
                            className={`flex items-center gap-2 text-caption font-medium ${
                              passed ? 'text-positive' : 'text-ink-tertiary'
                            }`}
                          >
                            <CheckMarkSvg passed={passed} />
                            {rule.label}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </div>

              {/* Confirm Password Input with Eye Visibility Toggle */}
              <div className="draw-focus space-y-1.5">
                <Label htmlFor="confirmPassword">Re-enter password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full pr-10 bg-surface-secondary/50 border-hairline focus:border-accent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink transition-colors duration-150 cursor-pointer"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
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
                      <title>Confirm password visibility toggle icon</title>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                      <line ref={confirmSlashRef} x1="2" y1="2" x2="22" y2="22" />
                    </svg>
                  </button>
                </div>

                {/* Confirm Password Match Indicator */}
                {confirmPassword.length > 0 && (
                  <p
                    className={`text-caption font-semibold flex items-center gap-1.5 mt-1 ${
                      passwordsMatch ? 'text-positive' : 'text-danger'
                    }`}
                  >
                    <CheckMarkSvg passed={passwordsMatch} />
                    {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                  </p>
                )}
              </div>

              <div className="draw-focus space-y-1.5">
                <Label htmlFor="origin">Where are you applying from?</Label>
                <Select
                  id="origin"
                  value={originCountryCode}
                  onChange={(e) => setOriginCountryCode(e.target.value)}
                  className="w-full bg-surface-secondary/50 border-hairline focus:border-accent"
                >
                  <option value="">Select your home country (optional)</option>
                  {originCountries.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </Select>
                <p className="text-caption text-ink-tertiary">
                  Used to automatically convert costs into your home currency.
                </p>
              </div>

              {error && (
                <div className="bg-danger-soft border border-danger text-danger rounded-md p-3 text-caption font-medium">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full mt-2 magnetic-btn bg-accent-solid text-white [background-image:var(--accent-gradient)] font-podium font-semibold shadow-md cursor-pointer"
                disabled={
                  register.isPending ||
                  (password.length > 0 && !passwordValid) ||
                  (confirmPassword.length > 0 && !passwordsMatch)
                }
              >
                {register.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Create account
                    <ArrowRight size={16} />
                  </span>
                )}
              </Button>

              {/* Social Registration Options (Future Features - Coming Soon) */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-hairline" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                  <span className="bg-surface px-2.5 text-ink-tertiary font-medium">
                    Or register with
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
              Already have an account?{' '}
              <Link to="/login" className="text-accent font-semibold hover:underline">
                Sign in
              </Link>
            </p>
            <p className="text-caption text-ink-tertiary leading-relaxed">
              StudYou provides guidance and signposting only. It is not legal or immigration advice.
            </p>
          </div>
        </div>

        {/* Right Side: Showcase Panel */}
        <div className="hidden md:flex md:col-span-5 bg-surface-secondary/40 p-8 lg:p-10 flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-1.5 bg-accent-soft text-accent text-caption font-semibold uppercase tracking-wider px-3 py-1 rounded-full">
              <Sparkles size={12} />
              Free & Open Guidance
            </div>

            <h3 className="text-title1 text-ink font-bold leading-tight">
              Your UK degree, directly under your control.
            </h3>

            <p className="text-body text-ink-secondary leading-relaxed">
              Join thousands of international students bypassing traditional agencies with our
              trackable 5-stage roadmap.
            </p>

            <div className="space-y-4 pt-2">
              <div className="reg-feature-item flex items-start gap-3 text-body text-ink">
                <CheckCircle2 size={18} className="text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-ink">Top 200 UK Universities</p>
                  <p className="text-caption text-ink-secondary">
                    Compare tuition & living costs on an interactive map.
                  </p>
                </div>
              </div>

              <div className="reg-feature-item flex items-start gap-3 text-body text-ink">
                <Globe size={18} className="text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-ink">Home Currency Budgeting</p>
                  <p className="text-caption text-ink-secondary">
                    Real-time exchange rate math with zero hidden fees.
                  </p>
                </div>
              </div>

              <div className="reg-feature-item flex items-start gap-3 text-body text-ink">
                <Compass size={18} className="text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-ink">Smart Target Dates</p>
                  <p className="text-caption text-ink-secondary">
                    Calculated backwards from your intake month.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-hairline/60 flex items-center justify-between text-caption text-ink-tertiary">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-accent" />
              Verified gov.uk steps
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen size={14} className="text-accent" />
              Free forever
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
