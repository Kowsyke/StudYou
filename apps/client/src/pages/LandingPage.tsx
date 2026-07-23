import { motion } from 'framer-motion'
import {
  ArrowRight,
  BadgePoundSterling,
  Building2,
  Calculator,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  FolderTree,
  GraduationCap,
  Mail,
  Map as MapIcon,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { UkGeoMap } from '../components/UkGeoMap'
import { Button } from '../components/ui/button'
import { ContainerScroll } from '../components/ui/container-scroll-animation'
import { ParticleCanvas } from '../components/ui/particle-canvas'
import { InteractiveCardMarquee } from '../components/ui/scroll-text-marquee'
import { WebGLLiquid } from '../components/ui/webgl-liquid'
import { useAuthStore } from '../store/authStore'

import { useGSAP } from '@gsap/react'
import { CustomEase } from '../lib/gsap/CustomEase.js'
import { Draggable } from '../lib/gsap/Draggable.js'
import { DrawSVGPlugin } from '../lib/gsap/DrawSVGPlugin.js'
import { Flip } from '../lib/gsap/Flip.js'
import { InertiaPlugin } from '../lib/gsap/InertiaPlugin.js'
import { MotionPathPlugin } from '../lib/gsap/MotionPathPlugin.js'
import { Physics2DPlugin } from '../lib/gsap/Physics2DPlugin.js'
import { ScrambleTextPlugin } from '../lib/gsap/ScrambleTextPlugin.js'
import { ScrollSmoother } from '../lib/gsap/ScrollSmoother.js'
import { ScrollTrigger } from '../lib/gsap/ScrollTrigger.js'
import { SplitText } from '../lib/gsap/SplitText.js'
import { TextPlugin } from '../lib/gsap/TextPlugin.js'
// GSAP Imports
import { gsap } from '../lib/gsap/index.js'

gsap.registerPlugin(
  useGSAP,
  ScrollTrigger,
  ScrollSmoother,
  SplitText,
  Draggable,
  InertiaPlugin,
  ScrambleTextPlugin,
  DrawSVGPlugin,
  TextPlugin,
  CustomEase,
  Physics2DPlugin,
  MotionPathPlugin,
  Flip,
)

const stats = [
  { value: '200', label: 'UK universities' },
  { value: '21', label: 'Official steps' },
  { value: '47', label: 'Sourced resources' },
  { value: '0', label: 'Agency fees', isCurrency: true },
]

export function LandingPage() {
  const token = useAuthStore((s) => s.token)
  const haloRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const liquidRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const halo = haloRef.current
    if (!halo) return

    const handleMouseMove = (e: MouseEvent) => {
      gsap.to(halo, {
        x: e.clientX,
        y: e.clientY,
        opacity: 1,
        duration: 0.5,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    }

    const handleMouseLeave = () => {
      gsap.to(halo, {
        opacity: 0,
        duration: 0.3,
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  useGSAP(() => {
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    // Tracked so the hero particle loop can be cancelled on unmount (it was
    // leaking a runaway rAF) and paused while the tab is hidden.
    let heroRaf = 0
    let onHeroVisibility: (() => void) | null = null

    // Initialize smooth scrolling. When reduced motion is requested, fall back
    // to native instant scroll (no inertia, no scroll-driven effects) so the
    // page never feels heavy or janky for those users.
    ScrollSmoother.create({
      wrapper: '#smooth-wrapper',
      content: '#smooth-content',
      smooth: prefersReducedMotion ? 0 : 1.2,
      effects: !prefersReducedMotion,
    })

    // Scroll-driven parallax and scale of the background WebGL liquid
    const liquid = liquidRef.current
    if (liquid) {
      if (!prefersReducedMotion) {
        gsap.to(liquid, {
          y: '12vh',
          scale: 1.1,
          ease: 'none',
          scrollTrigger: {
            trigger: '#smooth-content',
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
          },
        })
      }
    }

    // ScrambleText hero decode - characters resolve from symbols
    gsap.to('.hero-headline', {
      duration: 1.2,
      scrambleText: {
        text: 'Your UK study journey, without the agencies.',
        chars: '!<>- _\\/[] {}-=+* ^? #$@%&01',
        speed: 0.35,
        revealDelay: 0.4,
      },
      delay: 0.2,
    })

    // Hero content elements fade in
    gsap.from('.hero-fade', {
      opacity: 0,
      y: 20,
      stagger: 0.12,
      duration: 0.8,
      ease: 'power3.out',
      delay: 0.4,
    })

    // Magnetic CTA buttons
    const magneticBtns = document.querySelectorAll('.magnetic-cta')
    for (const btn of Array.from(magneticBtns)) {
      const el = btn as HTMLElement
      el.addEventListener('mousemove', (e: Event) => {
        const me = e as MouseEvent
        const rect = el.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dx = (me.clientX - cx) * 0.2
        const dy = (me.clientY - cy) * 0.2
        gsap.to(el, {
          x: dx,
          y: dy,
          rotateX: -dy * 0.5,
          rotateY: dx * 0.5,
          duration: 0.3,
          ease: 'power2.out',
          overwrite: 'auto',
        })
      })
      el.addEventListener('mouseleave', () => {
        gsap.to(el, {
          x: 0,
          y: 0,
          rotateX: 0,
          rotateY: 0,
          duration: 0.5,
          ease: 'elastic.out(1,0.4)',
          overwrite: 'auto',
        })
      })
    }

    // Counter animations for landing stats
    const statsElements = document.querySelectorAll('.stat-counter')
    for (const el of Array.from(statsElements)) {
      const targetVal = Number.parseInt(el.getAttribute('data-target') || '0', 10)
      const isCurrency = el.getAttribute('data-currency') === 'true'
      const obj = { val: 0 }
      gsap.to(obj, {
        val: targetVal,
        duration: 1.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          toggleActions: 'play none none none',
        },
        onUpdate: () => {
          el.textContent = isCurrency ? `£${Math.round(obj.val)}` : `${Math.round(obj.val)}`
        },
      })
    }

    // Spotlight cards listener registration
    const spotlightCards = document.querySelectorAll('.spotlight-card')
    for (const card of Array.from(spotlightCards)) {
      const handleMove = (e: Event) => {
        const mouseEvent = e as MouseEvent
        const rect = (card as HTMLElement).getBoundingClientRect()
        const x = mouseEvent.clientX - rect.left
        const y = mouseEvent.clientY - rect.top
        ;(card as HTMLElement).style.setProperty('--spotlight-x', `${x}px`)
        ;(card as HTMLElement).style.setProperty('--spotlight-y', `${y}px`)
      }
      card.addEventListener('mousemove', handleMove)
    }

    // Unified Ethereal Bi-Directional Scroll Reveal Timeline
    // Smoothly handles both scrolling DOWN and scrolling UP seamlessly!
    const revealTargets = [
      '.scroll-container-section',
      '.problem-section',
      '.map-section',
      '.pillars-section',
      '.cta-section',
    ]
    for (const selector of revealTargets) {
      const el = document.querySelector(selector)
      if (!el) continue

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'top 92%',
          end: 'bottom 8%',
          scrub: 0.6,
        },
      })

      tl.fromTo(
        el,
        { opacity: 0.15, y: 30, scale: 0.96, filter: 'blur(3px)' },
        { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.35, ease: 'power2.out' },
      )
        .to(el, { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.5 })
        .to(el, {
          opacity: 0.15,
          y: -30,
          scale: 0.96,
          filter: 'blur(3px)',
          duration: 0.35,
          ease: 'power2.in',
        })
    }

    // 3D Scroll Perspective Tilt for Map Holding Box
    gsap.set('.map-holding-box', { transformPerspective: 1200 })
    gsap.fromTo(
      '.map-holding-box',
      { rotateX: 15, scale: 0.94, opacity: 0.8 },
      {
        rotateX: 0,
        scale: 1,
        opacity: 1,
        scrollTrigger: {
          trigger: '.map-section',
          start: 'top 85%',
          end: 'top 40%',
          scrub: 0.8,
        },
      },
    )

    // Infinite GSAP marquee (primary row)
    const marqueeTrack = document.querySelector('.marquee-track')
    // Counter-scrolling marquee (secondary row)
    const marqueeTrackCounter = document.querySelector('.marquee-track-counter')
    if (marqueeTrack) {
      const marqueeTween = gsap.to(marqueeTrack, {
        xPercent: -50,
        ease: 'none',
        duration: 25,
        repeat: -1,
      })

      if (marqueeTrackCounter) {
        gsap.to(marqueeTrackCounter, {
          xPercent: 50,
          ease: 'none',
          duration: 30,
          repeat: -1,
        })
      }

      // Speed up and skew on scroll velocity
      ScrollTrigger.create({
        onUpdate: (self) => {
          const velocity = self.getVelocity()
          const absVelocity = Math.abs(velocity)
          const targetScale = gsap.utils.mapRange(0, 2000, 1, 5, absVelocity)
          const targetSkew = gsap.utils.mapRange(-3000, 3000, -12, 12, velocity)

          gsap.to(marqueeTween, {
            timeScale: targetScale,
            duration: 0.2,
            overwrite: 'auto',
          })
          gsap.to(marqueeTween, {
            timeScale: 1,
            duration: 0.8,
            ease: 'power2.out',
            delay: 0.15,
            overwrite: 'auto',
          })

          // Skew the tracks dynamically
          gsap.to([marqueeTrack, marqueeTrackCounter], {
            skewX: targetSkew,
            duration: 0.15,
            overwrite: 'auto',
          })
          gsap.to([marqueeTrack, marqueeTrackCounter], {
            skewX: 0,
            duration: 0.6,
            ease: 'power2.out',
            delay: 0.1,
            overwrite: 'auto',
          })
        },
      })

      // Slow down on marquee wrapper hover
      const marqueeWrapper = marqueeTrack.parentElement
      if (marqueeWrapper) {
        const handleEnter = () => {
          gsap.to(marqueeTween, {
            timeScale: 0.2,
            duration: 0.5,
            ease: 'power2.out',
            overwrite: 'auto',
          })
        }
        const handleLeave = () => {
          gsap.to(marqueeTween, {
            timeScale: 1,
            duration: 0.5,
            ease: 'power2.out',
            overwrite: 'auto',
          })
        }
        marqueeWrapper.addEventListener('mouseenter', handleEnter)
        marqueeWrapper.addEventListener('mouseleave', handleLeave)
      }
    }

    // Particle canvas behind hero
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        const resize = () => {
          canvas.width = canvas.offsetWidth * window.devicePixelRatio
          canvas.height = canvas.offsetHeight * window.devicePixelRatio
          ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
        }
        resize()
        window.addEventListener('resize', resize)

        const particles: { x: number; y: number; vx: number; vy: number }[] = []
        const count = 50
        const w = () => canvas.offsetWidth
        const h = () => canvas.offsetHeight

        for (let i = 0; i < count; i++) {
          particles.push({
            x: Math.random() * w(),
            y: Math.random() * h(),
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
          })
        }

        let mouseX = -1000
        let mouseY = -1000
        canvas.parentElement?.addEventListener('mousemove', (e: MouseEvent) => {
          const rect = canvas.getBoundingClientRect()
          mouseX = e.clientX - rect.left
          mouseY = e.clientY - rect.top
        })
        canvas.parentElement?.addEventListener('mouseleave', () => {
          mouseX = -1000
          mouseY = -1000
        })

        const accentColor = getComputedStyle(document.documentElement)
          .getPropertyValue('--accent')
          .trim()

        const animate = () => {
          ctx.clearRect(0, 0, w(), h())
          for (const p of particles) {
            // Gentle repulsion from mouse
            const dxm = p.x - mouseX
            const dym = p.y - mouseY
            const distM = Math.sqrt(dxm * dxm + dym * dym)
            if (distM < 100 && distM > 0) {
              const force = ((100 - distM) / 100) * 0.3
              p.vx += (dxm / distM) * force
              p.vy += (dym / distM) * force
            }

            p.x += p.vx
            p.y += p.vy
            p.vx *= 0.99
            p.vy *= 0.99

            if (p.x < 0 || p.x > w()) p.vx *= -1
            if (p.y < 0 || p.y > h()) p.vy *= -1

            ctx.beginPath()
            ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2)
            ctx.fillStyle = accentColor || '#0066cc'
            ctx.globalAlpha = 0.4
            ctx.fill()
          }

          // Connection lines
          for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
              const dx = particles[i].x - particles[j].x
              const dy = particles[i].y - particles[j].y
              const dist = Math.sqrt(dx * dx + dy * dy)
              if (dist < 120) {
                ctx.beginPath()
                ctx.moveTo(particles[i].x, particles[i].y)
                ctx.lineTo(particles[j].x, particles[j].y)
                ctx.strokeStyle = accentColor || '#0066cc'
                ctx.globalAlpha = 0.06 * (1 - dist / 120)
                ctx.lineWidth = 0.5
                ctx.stroke()
              }
            }
          }

          ctx.globalAlpha = 1
          heroRaf = requestAnimationFrame(animate)
        }
        // Pause the loop when the tab is hidden; skip it entirely for
        // reduced motion, leaving a still canvas.
        onHeroVisibility = () => {
          if (document.hidden) {
            cancelAnimationFrame(heroRaf)
            heroRaf = 0
          } else if (!prefersReducedMotion && !heroRaf) {
            animate()
          }
        }
        if (!prefersReducedMotion) animate()
        document.addEventListener('visibilitychange', onHeroVisibility)
      }
    }

    return () => {
      cancelAnimationFrame(heroRaf)
      if (onHeroVisibility) document.removeEventListener('visibilitychange', onHeroVisibility)
    }
  })

  if (token) return <Navigate to="/" replace />

  return (
    <>
      <div ref={haloRef} className="cursor-halo" aria-hidden="true" />

      {/* Cinematic WebGL Liquid Animated Background */}
      <WebGLLiquid
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
        title=""
        subtitle=""
        description=""
        colorDeep="#040714"
        colorMid="#1a4ca6"
        colorHighlight="#38bdf8"
        speed={0.25}
        flowStrength={0.3}
        grain={0.015}
        contrast={1.25}
        opacity={0.85}
      />

      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 scanner-grid pointer-events-none opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-canvas/10 via-canvas/35 to-canvas/85 pointer-events-none" />
        <div className="absolute inset-0 radial-blender pointer-events-none opacity-60" />
      </div>

      <div id="smooth-wrapper" className="relative min-h-screen bg-transparent overflow-x-hidden">
        <div id="smooth-content">
          <nav className="relative z-10 max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5">
            <Link
              to="/"
              aria-label="StudYou home"
              className="flex items-center gap-2 text-body-lg font-podium font-bold tracking-tight rounded-sm"
            >
              <span className="breathe w-6 h-6 rounded-xs bg-accent-solid text-white text-caption font-extrabold flex items-center justify-center [background-image:var(--accent-gradient)] transition-transform duration-[120ms] hover:rotate-6 hover:scale-110">
                SY
              </span>
              StudYou
            </Link>
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="px-2.5 sm:px-3 text-xs sm:text-sm">
                  Sign in
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="px-3 text-xs sm:text-sm">
                  Get started
                  <ArrowRight size={14} />
                </Button>
              </Link>
            </div>
          </nav>

          <main className="hero-container relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-14 pb-10 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-12 items-center text-center lg:text-left">
            <canvas ref={canvasRef} className="particle-canvas" />
            <div className="flex flex-col items-center lg:items-start">
              <div className="hero-fade inline-flex items-center gap-1.5 bg-accent-soft text-accent text-xs sm:text-caption font-semibold uppercase tracking-[0.05em] px-3 py-1 rounded-full mb-4 sm:mb-5 mx-auto lg:mx-0">
                <ShieldCheck size={12} />
                Every step from official sources
              </div>

              <h1 className="hero-headline text-2xl sm:text-title1 text-ink font-podium font-black tracking-tight max-w-xl mx-auto lg:mx-0 scramble-active text-center lg:text-left leading-tight sm:leading-none">
                &nbsp;
              </h1>

              <p className="hero-fade text-sm sm:text-body-lg text-ink-secondary max-w-md mt-4 sm:mt-5 leading-relaxed mx-auto lg:mx-0 text-center lg:text-left">
                A personal, trackable roadmap through every official step of studying in the UK.
                Real costs, real deadlines, official sources. No commissions, no middlemen.
              </p>

              <div className="hero-fade flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mt-6 sm:mt-8 w-full sm:w-auto">
                <Link to="/register" className="w-full sm:w-auto">
                  <Button size="lg" className="magnetic-cta magnetic-btn w-full sm:w-auto">
                    Start your roadmap
                    <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link to="/login" className="w-full sm:w-auto">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="magnetic-cta magnetic-btn w-full sm:w-auto"
                  >
                    Sign in
                  </Button>
                </Link>
              </div>

              {/* Frameless Interactive Glow Text Stats */}
              <div className="hero-fade grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 sm:mt-10 max-w-md w-full mx-auto lg:mx-0 select-none text-center lg:text-left">
                {stats.map((stat) => (
                  <div key={stat.label} className="group cursor-pointer">
                    <p
                      className="stat-counter text-xl sm:text-title3 text-ink tabular-nums font-black transition-all duration-300 group-hover:text-accent group-hover:scale-105 origin-center lg:origin-left [text-shadow:0_0_0px_transparent] group-hover:[text-shadow:0_0_18px_rgba(140,236,255,0.7),0_0_36px_rgba(140,236,255,0.4)]"
                      data-target={stat.value}
                      data-currency={stat.isCurrency ? 'true' : 'false'}
                    >
                      0
                    </p>
                    <p className="text-xs sm:text-caption font-semibold text-ink-secondary group-hover:text-ink transition-colors duration-200 mt-0.5">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <FloatingPreview />
          </main>

          {/* Interactive Feature Cards Marquee with Mouse Drag & Physics */}
          <InteractiveCardMarquee
            cards={[
              {
                title: '200+ Verified UK Universities',
                subtitle: 'Official UCAS & Portal Links',
                quote:
                  'Direct entry requirements, tuition fee breakdowns, and degree options from official sources.',
                author: 'Ken Masters',
                role: 'MSc Computer Science, Manchester',
                icon: Building2,
              },
              {
                title: 'Step-by-Step CAS & Milestone Tracker',
                subtitle: 'Zero Missed Deadlines',
                quote:
                  'Track your IELTS prep, CAS statement, TB test, and ATAS certificate in chronological order.',
                author: 'Kira Athrun',
                role: 'BEng Mechanical, Bristol',
                icon: CheckCircle2,
              },
              {
                title: 'Real Cost & Proof of Funds Calc',
                subtitle: 'Live Currency Conversion',
                quote:
                  'Calculate living expenses and tuition converted into your home currency with real exchange rates.',
                author: 'Jessica Lin',
                role: 'LLM Law, Edinburgh',
                icon: Calculator,
              },
              {
                title: 'Official Visa & IHS Guidance',
                subtitle: 'GOV.UK Signposting',
                quote:
                  'Direct signposts to official UKVI visa applications, IHS health surcharges, and financial requirements.',
                author: 'David Wright',
                role: 'BA Business, Birmingham',
                icon: ShieldCheck,
              },
            ].map((card, index) => {
              const Icon = card.icon
              return (
                <div
                  key={`marquee-card-${card.title}-${index}`}
                  className="shrink-0 w-80 p-4 rounded-xl liquid-glass-card hover:border-accent/40 hover:shadow-[0_8px_32px_rgba(0,102,204,0.12)] group transition-all"
                >
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-9 h-9 rounded-full overflow-hidden border border-hairline shrink-0 bg-accent-soft flex items-center justify-center">
                      <Icon size={18} className="text-accent" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-body-sm font-bold text-ink truncate group-hover:text-accent transition-colors">
                        {card.title}
                      </p>
                      <p className="text-[11px] font-mono text-ink-tertiary truncate">
                        {card.subtitle}
                      </p>
                    </div>
                  </div>
                  <p className="text-caption text-ink-secondary leading-relaxed line-clamp-2">
                    "{card.quote}"
                  </p>
                  <div className="mt-3 pt-2 border-t border-hairline/50 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-ink">{card.author}</span>
                    <span className="text-accent font-medium">{card.role}</span>
                  </div>
                </div>
              )
            })}
          />

          <ProblemSection />

          {/* 3D Perspective Container Scroll Showcase */}
          <section className="scroll-container-section relative z-10 my-4">
            <ContainerScroll
              titleComponent={
                <div className="space-y-2 max-w-2xl mx-auto">
                  <h2 className="text-title1 sm:text-[2.8rem] font-extrabold text-ink tracking-tight leading-none">
                    Track every step of your UK degree.
                  </h2>
                  <p className="text-body text-ink-secondary mt-2">
                    Official target dates, verified cost calculators, and direct admissions links.
                  </p>
                </div>
              }
            >
              <div className="relative w-full h-full rounded-xl overflow-hidden bg-surface/20 backdrop-blur-md border border-hairline/40 flex flex-col justify-between p-4 md:p-6 text-left shadow-2xl">
                <div className="flex items-center justify-between border-b border-hairline/60 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-danger/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-warning/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-positive/80 inline-block" />
                    <span className="text-caption font-mono text-ink-secondary ml-2">
                      studyou.app/roadmap
                    </span>
                  </div>
                  <span className="text-caption font-semibold bg-accent-soft text-accent px-2.5 py-0.5 rounded-full">
                    Stage 2 of 5 Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 my-auto">
                  <div className="p-3.5 rounded-lg bg-surface/60 border border-hairline space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-caption font-semibold text-ink-secondary">
                        IELTS Test Prep
                      </span>
                      <CheckCircle2 size={16} className="text-positive" />
                    </div>
                    <p className="text-body-lg font-bold text-ink">Score 7.5 Verified</p>
                    <div className="h-1.5 w-full bg-surface-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-positive w-full" />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-surface/60 border border-accent/40 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-caption font-semibold text-accent">CAS Statement</span>
                      <Clock size={16} className="text-accent animate-pulse" />
                    </div>
                    <p className="text-body-lg font-bold text-ink">Due in 14 Days</p>
                    <div className="h-1.5 w-full bg-surface-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-accent w-[65%]" />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-surface/60 border border-hairline space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-caption font-semibold text-ink-secondary">
                        Financial Proof
                      </span>
                      <ShieldCheck size={16} className="text-ink-tertiary" />
                    </div>
                    <p className="text-body-lg font-bold text-ink">£12,006 Required</p>
                    <div className="h-1.5 w-full bg-surface-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-ink-tertiary w-[30%]" />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-hairline/60 flex flex-wrap items-center justify-between gap-3 text-caption text-ink-secondary">
                  <span className="font-semibold text-ink">
                    Top 200 UK Universities Map & Tuition Comparison
                  </span>
                  <span className="text-accent font-medium">
                    Updated live with official UK government guidance &rarr;
                  </span>
                </div>
              </div>
            </ContainerScroll>
          </section>

          {/* Knowledge Tree Quick Resource Banner */}
          <section className="relative z-10 max-w-4xl mx-auto px-4 my-8 text-center">
            <div className="p-6 sm:p-8 rounded-2xl bg-surface/50 backdrop-blur-xl border border-hairline hover:border-accent/40 shadow-xl transition-all duration-300 group flex flex-col md:flex-row items-center justify-between gap-6 text-left">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-soft text-accent text-caption font-semibold uppercase tracking-wider">
                  <FolderTree size={14} />
                  Knowledge Tree
                </div>
                <h3 className="text-xl sm:text-title2 font-bold text-ink">
                  Find all official guides & resources in our Knowledge Tree.
                </h3>
                <p className="text-body-sm text-ink-secondary leading-relaxed">
                  Direct GOV.UK, NHS, and UCAS guidance - 100% verified and free. No hidden costs or
                  middlemen.
                </p>
              </div>
              <Link to="/resources" className="shrink-0 w-full md:w-auto">
                <Button
                  size="lg"
                  className="w-full md:w-auto flex items-center justify-center gap-2 group-hover:scale-105 transition-transform"
                >
                  Explore Knowledge Base
                  <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          </section>

          <InteractiveMapSection />
          <PillarsSection />
          <ClosingCta />

          {/* Premium Footer with Contact Us & Social Links */}
          <footer className="relative z-10 border-t border-hairline bg-surface/40 backdrop-blur-md pt-12 pb-8">
            <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
              <div className="md:col-span-2 space-y-3">
                <Link
                  to="/"
                  className="flex items-center gap-2 text-body-lg font-podium font-bold tracking-tight text-ink"
                >
                  <span className="w-6 h-6 rounded-xs bg-accent-solid text-white text-caption font-extrabold flex items-center justify-center [background-image:var(--accent-gradient)]">
                    SY
                  </span>
                  StudYou
                </Link>
                <p className="text-caption text-ink-secondary max-w-sm leading-relaxed">
                  A transparent, trackable roadmap for international students moving to the UK. Real
                  costs, official sources, zero agency fees.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-caption text-ink-tertiary font-medium mr-1">Socials:</span>
                  <button
                    type="button"
                    title="Facebook - Coming Soon"
                    className="p-2 rounded-md bg-surface-secondary/40 border border-hairline/60 text-ink-secondary hover:text-accent hover:border-accent/40 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <title>Facebook icon</title>
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    title="WhatsApp - Coming Soon"
                    className="p-2 rounded-md bg-surface-secondary/40 border border-hairline/60 text-ink-secondary hover:text-accent hover:border-accent/40 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <title>WhatsApp icon</title>
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    title="Twitter / X - Coming Soon"
                    className="p-2 rounded-md bg-surface-secondary/40 border border-hairline/60 text-ink-secondary hover:text-accent hover:border-accent/40 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <title>Twitter icon</title>
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    title="Instagram - Coming Soon"
                    className="p-2 rounded-md bg-surface-secondary/40 border border-hairline/60 text-ink-secondary hover:text-accent hover:border-accent/40 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <title>Instagram icon</title>
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <p className="text-body-sm font-bold text-ink mb-2">Platform Navigation</p>
                <ul className="space-y-1.5 text-caption text-ink-secondary">
                  <li>
                    <Link to="/universities" className="hover:text-accent transition-colors">
                      Search 200+ Universities
                    </Link>
                  </li>
                  <li>
                    <Link to="/register" className="hover:text-accent transition-colors">
                      Interactive Roadmap
                    </Link>
                  </li>
                  <li>
                    <Link to="/login" className="hover:text-accent transition-colors">
                      Sign in to Progress
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-body-sm font-bold text-ink mb-2">Contact & Support</p>
                <ul className="space-y-1.5 text-caption text-ink-secondary">
                  <li className="flex items-center gap-1.5 text-ink-secondary">
                    <Mail size={13} className="text-accent" />
                    <a
                      href="mailto:support@studyou.app"
                      className="hover:text-accent transition-colors"
                    >
                      support@studyou.app
                    </a>
                  </li>
                  <li className="text-ink-tertiary">London, United Kingdom</li>
                  <li>
                    <span className="inline-flex items-center gap-1 bg-positive-soft text-positive text-[10px] px-2 py-0.5 rounded-full font-semibold">
                      Live Support Active
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 pt-6 border-t border-hairline/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-caption text-ink-tertiary text-center sm:text-left">
              <p>
                StudYou provides guidance and signposting only. It is not legal or immigration
                advice. Always confirm details on official sources such as{' '}
                <a
                  href="https://gov.uk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  gov.uk
                </a>
                .
              </p>
              <p className="shrink-0 font-mono text-[11px] text-ink-tertiary">
                &copy; {new Date().getFullYear()} StudYou. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </div>
    </>
  )
}

function ProblemSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const split = new SplitText('.problem-reveal', { type: 'words' })
      gsap.set(split.words, { position: 'relative', display: 'inline-block' })
      gsap.from(split.words, {
        opacity: 0,
        physics2D: {
          velocity: () => Math.random() * 50 + 30,
          angle: () => Math.random() * 40 + 250, // slightly upwards and sideways
          gravity: 350,
        },
        stagger: 0.015,
        duration: 1.2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      })
    },
    { scope: containerRef },
  )

  return (
    <section
      ref={containerRef}
      className="problem-section relative z-10 max-w-3xl mx-auto px-6 py-24 text-center"
    >
      <p className="text-caption font-semibold uppercase tracking-[0.08em] text-ink-tertiary mb-4">
        Why StudYou exists
      </p>
      <h2 className="problem-reveal text-title2 text-ink leading-tight">
        Agencies charge for guidance the government gives away, and hide the true cost. Some have
        taken students' money and vanished.
      </h2>
      <p className="text-body-lg text-ink-secondary leading-relaxed mt-6 max-w-2xl mx-auto">
        Every rule, fee and form you need is published for free by gov.uk, the NHS and the
        universities themselves. StudYou puts all of it in one place, in the right order, with the
        real numbers, so you never have to trust a middleman again.
      </p>
    </section>
  )
}

const REGION_INFOCUS: Record<
  string,
  {
    name: string
    unisCount: number
    avgCost: string
    tuition: string
    famous: string[]
    desc: string
  }
> = {
  London: {
    name: 'London',
    unisCount: 40,
    avgCost: '£720 - £950 / month',
    tuition: '£18,000 - £35,000 / year',
    famous: ['Imperial College London', 'University College London (UCL)', 'LSE'],
    desc: 'The capital city offers a massive student community, unmatched career networking, and rich cultural hubs, though living costs are the highest in the UK.',
  },
  'South East': {
    name: 'South East England',
    unisCount: 22,
    avgCost: '£550 - £700 / month',
    tuition: '£16,000 - £29,000 / year',
    famous: ['University of Oxford', 'University of Southampton', 'University of Sussex'],
    desc: 'Boasts globally renowned institutions, beautiful coastlines, and historic towns, with close proximity to London without the high inner-city rent.',
  },
  'South West': {
    name: 'South West England',
    unisCount: 12,
    avgCost: '£480 - £620 / month',
    tuition: '£15,000 - £26,000 / year',
    famous: ['University of Bristol', 'University of Exeter', 'University of Bath'],
    desc: 'Famous for sandy beaches, creative cities. It is a highly popular student region with active campuses and strong student societies.',
  },
  'West Midlands': {
    name: 'West Midlands',
    unisCount: 14,
    avgCost: '£450 - £580 / month',
    tuition: '£14,500 - £25,000 / year',
    famous: ['University of Birmingham', 'University of Warwick', 'Coventry University'],
    desc: 'The heart of the UK industrial heritage, now a bustling multicultural region with major universities and extremely affordable living costs.',
  },
  'East Midlands': {
    name: 'East Midlands',
    unisCount: 10,
    avgCost: '£420 - £550 / month',
    tuition: '£14,000 - £24,000 / year',
    famous: ['University of Nottingham', 'University of Leicester', 'Loughborough University'],
    desc: 'Offers a superb balance of green countrysides (like Sherwood Forest) and lively, student-centered cities with top-tier research universities.',
  },
  'East of England': {
    name: 'East of England',
    unisCount: 8,
    avgCost: '£520 - £680 / month',
    tuition: '£16,000 - £30,000 / year',
    famous: ['University of Cambridge', 'University of East Anglia (UEA)', 'University of Essex'],
    desc: 'Home to Cambridge, high-tech science parks, and quiet coastal towns. It features outstanding academic tradition and excellent connectivity.',
  },
  'Yorkshire and the Humber': {
    name: 'Yorkshire and the Humber',
    unisCount: 11,
    avgCost: '£400 - £520 / month',
    tuition: '£14,000 - £25,000 / year',
    famous: ['University of Leeds', 'University of Sheffield', 'University of York'],
    desc: 'Renowned for warm northern hospitality, breathtaking national parks, and vibrant student capitals like Leeds and Sheffield.',
  },
  'North West': {
    name: 'North West England',
    unisCount: 16,
    avgCost: '£420 - £550 / month',
    tuition: '£14,000 - £26,000 / year',
    famous: ['University of Manchester', 'University of Liverpool', 'Lancaster University'],
    desc: 'The birth region of industrialism and pop music, Manchester and Liverpool offer incredible culture, legendary nightlife, and world-class universities.',
  },
  'North East': {
    name: 'North East England',
    unisCount: 5,
    avgCost: '£380 - £480 / month',
    tuition: '£13,500 - £23,000 / year',
    famous: ['Durham University', 'Newcastle University', 'Northumbria University'],
    desc: "One of the most cost-effective regions in the UK, featuring historic castles, coastlines, and Durham's prestigious collegiate system.",
  },
  Scotland: {
    name: 'Scotland',
    unisCount: 19,
    avgCost: '£440 - £580 / month',
    tuition: '£15,000 - £28,000 / year',
    famous: ['University of Edinburgh', 'University of Glasgow', 'University of St Andrews'],
    desc: "Boasts centuries of academic prestige, stunning highlands, and Edinburgh's festival culture, with a unique 4-year degree structure.",
  },
  Wales: {
    name: 'Wales',
    unisCount: 9,
    avgCost: '£400 - £520 / month',
    tuition: '£13,500 - £22,000 / year',
    famous: ['Cardiff University', 'Swansea University', 'Bangor University'],
    desc: 'Nestled between mountains and the sea, Wales offers a distinct cultural identity, cozy university towns, and excellent standard of living.',
  },
  'Northern Ireland': {
    name: 'Northern Ireland',
    unisCount: 2,
    avgCost: '£360 - £460 / month',
    tuition: '£13,500 - £20,000 / year',
    famous: ["Queen's University Belfast", 'Ulster University'],
    desc: 'Belfast is a booming technological and cultural hub with friendly neighborhoods, low living costs, and rich collegiate history.',
  },
}

function Draggable3DMapWrapper({ children }: { children: React.ReactNode }) {
  const [isDragging, setIsDragging] = useState(false)
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const startPosRef = useRef({ x: 0, y: 0 })

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true)
    startPosRef.current = { x: e.clientX - rotation.y * 3, y: e.clientY + rotation.x * 3 }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    const deltaX = e.clientX - startPosRef.current.x
    const deltaY = e.clientY - startPosRef.current.y

    const rotY = Math.max(-28, Math.min(28, deltaX * 0.35))
    const rotX = Math.max(-28, Math.min(28, -deltaY * 0.35))
    setRotation({ x: rotX, y: rotY })
  }

  const handlePointerUp = () => {
    setIsDragging(false)
    setRotation({ x: 0, y: 0 })
  }

  return (
    <div
      style={{ perspective: 1000, touchAction: 'pan-y' }}
      className="relative cursor-grab active:cursor-grabbing select-none w-full flex flex-col items-center py-1"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <motion.div
        animate={{
          rotateX: rotation.x,
          rotateY: rotation.y,
          scale: isDragging ? 1.06 : 1,
          y: isDragging ? -6 : 0,
        }}
        transition={{
          rotateX: {
            type: 'spring',
            stiffness: isDragging ? 400 : 250,
            damping: isDragging ? 30 : 20,
          },
          rotateY: {
            type: 'spring',
            stiffness: isDragging ? 400 : 250,
            damping: isDragging ? 30 : 20,
          },
          scale: { duration: 0.2 },
          y: { duration: 0.2 },
        }}
        className="w-full flex flex-col items-center justify-center transform-gpu"
      >
        {children}
      </motion.div>
    </div>
  )
}

function InteractiveMapSection() {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const detailPanelRef = useRef<HTMLDivElement>(null)
  // biome-ignore lint/suspicious/noExplicitAny: GSAP FlipState is untyped
  const flipStateRef = useRef<any>(null)

  const activeRegionKey =
    hoveredRegion ||
    (selectedRegions.length > 0 ? selectedRegions[selectedRegions.length - 1] : null)
  const details = activeRegionKey ? REGION_INFOCUS[activeRegionKey] || REGION_INFOCUS.London : null

  const presetCounts: Record<string, number> = {
    London: 40,
    'South East': 22,
    'South West': 12,
    'West Midlands': 14,
    'East Midlands': 10,
    'East of England': 8,
    'Yorkshire and the Humber': 11,
    'North West': 16,
    'North East': 5,
    Scotland: 19,
    Wales: 9,
    'Northern Ireland': 2,
  }

  const handleToggle = (r: string) => {
    if (detailPanelRef.current) {
      const targets = detailPanelRef.current.querySelectorAll('[data-flip-id]')
      flipStateRef.current = Flip.getState(targets)
    }
    setSelectedRegions((prev) => {
      if (prev.includes(r)) {
        return prev.filter((item) => item !== r)
      }
      return [...prev, r]
    })
  }

  const handleHover = (r: string | null) => {
    if (detailPanelRef.current) {
      const targets = detailPanelRef.current.querySelectorAll('[data-flip-id]')
      flipStateRef.current = Flip.getState(targets)
    }
    setHoveredRegion(r)
  }

  useGSAP(() => {
    if (!detailPanelRef.current) return
    const targets = detailPanelRef.current.querySelectorAll('[data-flip-id]')
    if (flipStateRef.current) {
      Flip.from(flipStateRef.current, {
        targets: targets,
        duration: 0.45,
        ease: 'power2.out',
        scale: true,
        absolute: false,
        stagger: 0.03,
      })
      flipStateRef.current = null
    } else {
      gsap.fromTo(
        targets,
        { opacity: 0, x: 15 },
        { opacity: 1, x: 0, stagger: 0.05, duration: 0.4, ease: 'power2.out' },
      )
    }
  }, [activeRegionKey])

  return (
    <section className="scroll-container-section map-section relative z-10 max-w-5xl mx-auto px-4 sm:px-6 overflow-hidden">
      <ContainerScroll
        titleComponent={
          <div className="text-center mb-6">
            <p className="text-caption font-semibold uppercase tracking-[0.08em] text-ink-tertiary mb-2">
              Explore UK Geography
            </p>
            <h2 className="text-title1 text-ink font-bold font-apple">Discover Regions & Costs</h2>
            <p className="text-body text-ink-secondary mt-2 max-w-md mx-auto">
              Hover or click on any region on the interactive map to compare local living costs,
              average tuition ranges, and notable institutions.
            </p>
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6 items-center h-full w-full p-3 md:p-6 text-left overflow-hidden">
          <div className="flex flex-col items-center justify-center p-4 bg-surface-secondary/20 rounded-2xl border border-hairline/60 w-full overflow-hidden">
            <Draggable3DMapWrapper>
              <UkGeoMap
                selected={selectedRegions}
                counts={presetCounts}
                onToggle={handleToggle}
                onHover={handleHover}
              />
            </Draggable3DMapWrapper>
            <p className="text-[10px] text-ink-tertiary mt-3 uppercase tracking-wider font-semibold">
              Click & drag to tilt map in 3D • Click region to select
            </p>
          </div>

          <div
            ref={detailPanelRef}
            className="flex flex-col h-full justify-between gap-4 overflow-hidden"
          >
            {details ? (
              <div className="space-y-3">
                {/* Selected Regions Tag List */}
                {selectedRegions.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 border-b border-hairline pb-2 mb-1">
                    <span className="text-[10px] uppercase font-bold text-ink-tertiary mr-1">
                      Selected:
                    </span>
                    {selectedRegions.map((reg) => (
                      <button
                        key={reg}
                        type="button"
                        onClick={() => handleToggle(reg)}
                        className="text-[11px] font-semibold bg-accent-soft text-accent px-2 py-0.5 rounded-full hover:bg-danger-soft hover:text-danger transition-colors flex items-center gap-1"
                      >
                        {reg}
                        <span className="text-[9px] font-bold">&times;</span>
                      </button>
                    ))}
                  </div>
                )}

                <div
                  data-flip-id="map-header"
                  className="flex items-center justify-between border-b border-hairline pb-2"
                >
                  <h3 className="text-title3 text-ink font-bold">{details.name}</h3>
                  <span className="text-xs font-bold text-accent bg-accent-soft px-2 py-0.5 rounded-full">
                    {details.unisCount} Universities
                  </span>
                </div>

                <p
                  data-flip-id="map-desc"
                  className="text-body-sm text-ink-secondary leading-relaxed"
                >
                  {details.desc}
                </p>

                <div
                  data-flip-id="map-stats"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1"
                >
                  <div className="bg-canvas border border-hairline rounded-sm p-3 flex flex-col gap-0.5">
                    <span className="text-[10px] font-semibold text-ink-tertiary uppercase tracking-wider">
                      Est. Living Expenses
                    </span>
                    <span className="text-body-sm font-bold text-ink">{details.avgCost}</span>
                  </div>
                  <div className="bg-canvas border border-hairline rounded-sm p-3 flex flex-col gap-0.5">
                    <span className="text-[10px] font-semibold text-ink-tertiary uppercase tracking-wider">
                      Avg. International Tuition
                    </span>
                    <span className="text-body-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {details.tuition}
                    </span>
                  </div>
                </div>

                <div data-flip-id="map-unis" className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider block">
                    Featured Institutions
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {details.famous.map((uni) => (
                      <span
                        key={uni}
                        className="text-[11px] font-medium px-2.5 py-0.5 bg-surface-secondary border border-hairline text-ink-secondary rounded-sm"
                      >
                        {uni}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div
                  data-flip-id="map-header"
                  className="flex items-center justify-between border-b border-hairline pb-2"
                >
                  <h3 className="text-title3 text-ink font-bold">Compare UK Regions</h3>
                  <span className="text-xs font-bold text-accent bg-accent-soft px-2 py-0.5 rounded-full">
                    12 Regions total
                  </span>
                </div>

                <p
                  data-flip-id="map-desc"
                  className="text-body-sm text-ink-secondary leading-relaxed"
                >
                  Explore local expenses, tuition levels, and universities by hovering over or
                  clicking on any UK region. Select multiple regions on the map to compare and
                  shortlist options for your customized degree roadmap.
                </p>

                <div
                  data-flip-id="map-stats"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1"
                >
                  <div className="bg-canvas border border-hairline rounded-sm p-3 flex flex-col gap-0.5">
                    <span className="text-[10px] font-semibold text-ink-tertiary uppercase tracking-wider">
                      UK Living Costs Range
                    </span>
                    <span className="text-body-sm font-bold text-ink">£380 - £950 / month</span>
                  </div>
                  <div className="bg-canvas border border-hairline rounded-sm p-3 flex flex-col gap-0.5">
                    <span className="text-[10px] font-semibold text-ink-tertiary uppercase tracking-wider">
                      Average Tuition Range
                    </span>
                    <span className="text-body-sm font-bold text-emerald-600 dark:text-emerald-400">
                      £13,500 - £35,000 / year
                    </span>
                  </div>
                </div>

                <div data-flip-id="map-unis" className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider block">
                    Shortlist Universities
                  </span>
                  <div className="flex flex-wrap gap-1.5 opacity-60">
                    {['Oxford', 'Cambridge', 'Imperial', 'Edinburgh', 'Manchester', 'Bristol'].map(
                      (uni) => (
                        <span
                          key={uni}
                          className="text-[11px] font-medium px-2.5 py-0.5 bg-surface-secondary border border-hairline text-ink-secondary rounded-sm"
                        >
                          {uni}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              </div>
            )}

            <div data-flip-id="map-cta" className="border-t border-hairline pt-3 mt-auto">
              <Link to="/register">
                <Button className="w-full sheen text-white bg-accent-solid [background-image:var(--accent-gradient)]">
                  {details
                    ? `Build my UK roadmap in ${details.name}`
                    : 'Start building my UK degree roadmap'}
                  <ArrowRight size={14} className="ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </ContainerScroll>
    </section>
  )
}

const pillars = [
  {
    icon: MapIcon,
    title: 'A roadmap that tracks itself',
    body: 'Five stages, twenty one official steps, each with a target date worked back from your intake. Tick things off and your budget and deadlines update live.',
  },
  {
    icon: GraduationCap,
    title: 'Find your university without a middleman',
    body: 'The top 200 UK universities on a real map. Filter by region, compare tuition, swipe to shortlist, and open the official admissions page in one click.',
  },
  {
    icon: BadgePoundSterling,
    title: 'The true cost, in your currency',
    body: 'Every fee from the English test to the health surcharge, added up in GBP and your home currency. No hidden commissions, because there are none.',
  },
]

function PillarsSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      // Animate card entries
      gsap.from('.pillar-card', {
        opacity: 0,
        y: 40,
        stagger: 0.15,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      })

      // Animate icon entrances on curved motion path
      gsap.from('.pillar-icon-span', {
        opacity: 0,
        scale: 0.5,
        motionPath: {
          path: [
            { x: -50, y: 40 },
            { x: -20, y: -20 },
            { x: 0, y: 0 },
          ],
          curviness: 1.5,
        },
        duration: 1.1,
        ease: 'power2.out',
        stagger: 0.15,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      })
    },
    { scope: containerRef },
  )

  return (
    <section
      ref={containerRef}
      className="pillars-section relative z-10 max-w-5xl mx-auto px-6 py-20"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {pillars.map((pillar) => (
          <article
            key={pillar.title}
            className="pillar-card spotlight-card card-lift rounded-lg shadow-md p-6 border border-hairline group"
          >
            <span className="pillar-icon-span inline-flex h-11 w-11 rounded-md bg-accent-soft text-accent items-center justify-center mb-4 group-hover:glow-pulse transition-shadow duration-300">
              <pillar.icon size={20} />
            </span>
            <h3 className="text-body-lg font-bold text-ink leading-snug">{pillar.title}</h3>
            <p className="text-body text-ink-secondary leading-relaxed mt-2">{pillar.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function ClosingCta() {
  const auroraRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useGSAP(() => {
    if (auroraRef.current) {
      gsap.to(auroraRef.current, {
        backgroundPosition: '200% 50%',
        duration: 8,
        ease: 'none',
        repeat: -1,
      })
    }

    if (headingRef.current) {
      gsap.fromTo(
        headingRef.current,
        { text: '' },
        {
          text: 'Build the roadmap you wish you had on day one.',
          duration: 1.5,
          ease: 'power1.inOut',
          scrollTrigger: {
            trigger: headingRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        },
      )
    }
  })

  return (
    <section className="cta-section relative z-10 max-w-5xl mx-auto px-6 py-16">
      <div className="relative overflow-hidden rounded-xl border border-hairline-strong p-10 sm:p-14 text-center">
        <div className="absolute inset-0 opacity-35 pointer-events-none">
          <ParticleCanvas pointerSize={3} pointerColor="#8cecff" />
        </div>
        <div
          ref={auroraRef}
          className="absolute inset-0 opacity-[0.14] pointer-events-none"
          style={{
            background: 'var(--aurora)',
            backgroundSize: '200% 100%',
          }}
          aria-hidden="true"
        />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 text-caption font-semibold uppercase tracking-[0.06em] text-accent bg-accent-soft px-2.5 py-1 rounded-full mb-5">
            <Sparkles size={12} />
            Free, and always will be
          </span>
          <h2
            ref={headingRef}
            className="text-title2 text-ink max-w-xl mx-auto leading-tight font-bold h-[2.5em] sm:h-auto"
          >
            &nbsp;
          </h2>
          <p className="text-body-lg text-ink-secondary mt-4 max-w-lg mx-auto leading-relaxed">
            Answer three questions and StudYou lays out every step to your UK intake, in order, with
            dates and costs.
          </p>
          <Link to="/register" className="inline-block mt-8">
            <Button size="lg" className="magnetic-cta magnetic-btn">
              Start your roadmap
              <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

function FloatingPreview() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [ticked, setTicked] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setTicked((t) => !t), 2600)
    return () => clearInterval(timer)
  }, [])

  useGSAP(
    () => {
      // Draggable components physics
      Draggable.create('.draggable-widget', {
        type: 'x,y',
        bounds: containerRef.current,
        edgeResistance: 0.65,
        inertia: true,
        onPress: function () {
          gsap.killTweensOf(this.target, { y: true })
          gsap.to(this.target, { scale: 1.05, duration: 0.15, zIndex: 30 })
        },
        onRelease: function () {
          gsap.to(this.target, { scale: 1, duration: 0.15, zIndex: 10 })
          // Resume floating motion
          const floatOffset =
            this.target.classList.contains('widget-1') || this.target.classList.contains('widget-3')
              ? -8
              : 8
          gsap.to(this.target, {
            y: `+=${floatOffset}`,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            duration: 4.5 + Math.random(),
            delay: Math.random() * 0.5,
          })
        },
      })

      // Setup smooth vertical drift on cards initially
      gsap.to('.widget-1', {
        y: '+=10',
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        duration: 4.8,
      })
      gsap.to('.widget-2', {
        y: '-=12',
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        duration: 5.4,
        delay: 0.4,
      })
      gsap.to('.widget-3', {
        y: '+=8',
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        duration: 4.2,
        delay: 0.8,
      })
      gsap.to('.widget-4', {
        y: '-=10',
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        duration: 5.0,
        delay: 0.2,
      })
    },
    { scope: containerRef },
  )

  const percent = ticked ? 43 : 38
  const circumference = 2 * Math.PI * 30

  return (
    <>
      {/* Mobile Centered Preview Showcase */}
      <div className="lg:hidden flex flex-col gap-3 w-full max-w-sm mx-auto mt-6 select-none text-left">
        <div className="bg-surface/80 backdrop-blur-md border border-hairline rounded-lg shadow-md p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width={48} height={48} className="-rotate-90" role="presentation">
              <circle
                cx={24}
                cy={24}
                r={20}
                fill="none"
                stroke="var(--surface-secondary)"
                strokeWidth={5}
              />
              <circle
                cx={24}
                cy={24}
                r={20}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={5}
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 20}
                strokeDashoffset={2 * Math.PI * 20 * (1 - percent / 100)}
                style={{ transition: 'stroke-dashoffset 400ms var(--ease-swift)' }}
              />
            </svg>
            <div>
              <p className="text-body font-bold text-ink tabular-nums">{percent}% complete</p>
              <p className="text-caption text-ink-secondary">Roadmap progress</p>
            </div>
          </div>
          <span className="text-caption font-semibold text-accent bg-accent-soft px-2.5 py-1 rounded-full">
            Active
          </span>
        </div>

        <div className="bg-surface/80 backdrop-blur-md border border-hairline rounded-lg shadow-md p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-8 w-8 rounded-sm bg-warning-soft text-warning flex items-center justify-center shrink-0">
              <CalendarClock size={16} />
            </span>
            <div>
              <p className="text-body font-semibold text-ink">Student Visa Application</p>
              <p className="text-caption text-warning font-medium">Due in 12 days</p>
            </div>
          </div>
          <span className="text-caption font-semibold text-ink-tertiary">£524</span>
        </div>
      </div>

      {/* Desktop Physics Interactive Draggable Canvas */}
      <div
        ref={containerRef}
        className="relative h-[360px] w-full hidden lg:block select-none"
        aria-hidden="true"
      >
        <div className="draggable-widget widget-1 absolute top-2 left-4 w-64 bg-surface border border-hairline rounded-lg shadow-lg p-4 cursor-grab active:cursor-grabbing z-10">
          <div className="flex items-start gap-2.5">
            <span
              className={`mt-0.5 h-4 w-4 shrink-0 rounded-xs border-[1.5px] flex items-center justify-center transition-colors duration-200 ${
                ticked ? 'bg-accent-solid border-accent-solid' : 'border-ink-tertiary bg-surface'
              }`}
            >
              <Check
                size={11}
                strokeWidth={4}
                className={`text-white transition-opacity duration-200 ${ticked ? 'opacity-100' : 'opacity-0'}`}
              />
            </span>
            <span
              className={`text-body font-medium transition-colors duration-200 ${
                ticked ? 'line-through text-ink-tertiary' : 'text-ink'
              }`}
            >
              Book and sit an approved English test
            </span>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-hairline text-caption text-ink-tertiary">
            <span className="font-semibold text-ink-secondary">£229</span>
            <span>Target 25 Nov</span>
          </div>
        </div>

        <div className="draggable-widget widget-2 absolute top-40 left-0 bg-surface border border-hairline rounded-lg shadow-lg p-4 flex items-center gap-4 cursor-grab active:cursor-grabbing z-10">
          <svg width={68} height={68} className="-rotate-90" role="presentation">
            <circle
              cx={34}
              cy={34}
              r={30}
              fill="none"
              stroke="var(--surface-secondary)"
              strokeWidth={7}
            />
            <circle
              cx={34}
              cy={34}
              r={30}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={7}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - percent / 100)}
              style={{ transition: 'stroke-dashoffset 400ms var(--ease-swift)' }}
            />
          </svg>
          <div>
            <p className="text-body-lg font-bold text-ink tabular-nums">{percent}%</p>
            <p className="text-caption text-ink-secondary">Roadmap complete</p>
          </div>
        </div>

        <div className="draggable-widget widget-3 absolute top-56 right-0 bg-surface border border-hairline rounded-lg shadow-lg p-3.5 flex items-center gap-3 cursor-grab active:cursor-grabbing z-10">
          <span className="h-8 w-8 rounded-sm bg-warning-soft text-warning flex items-center justify-center">
            <CalendarClock size={15} />
          </span>
          <div>
            <p className="text-body font-semibold text-ink">Visa application</p>
            <p className="text-caption text-warning font-medium">Due in 12 days</p>
          </div>
        </div>

        <div className="draggable-widget widget-4 absolute top-8 right-4 bg-surface border border-hairline rounded-lg shadow-lg p-3.5 flex items-center gap-3 cursor-grab active:cursor-grabbing z-10">
          <span className="h-8 w-8 rounded-sm bg-positive-soft text-positive flex items-center justify-center">
            <Wallet size={15} />
          </span>
          <div>
            <p className="text-body font-semibold text-ink tabular-nums">£3,337 true cost</p>
            <p className="text-caption text-ink-secondary">GBP and home currency</p>
          </div>
        </div>
      </div>
    </>
  )
}
