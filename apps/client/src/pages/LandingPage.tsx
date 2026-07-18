import {
  ArrowRight,
  BadgePoundSterling,
  CalendarClock,
  Check,
  GraduationCap,
  Map as MapIcon,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { UkGeoMap } from '../components/UkGeoMap'
import { Button } from '../components/ui/button'
import { useAuthStore } from '../store/authStore'

import { useGSAP } from '@gsap/react'
import { Draggable } from '../lib/gsap/Draggable.js'
import { InertiaPlugin } from '../lib/gsap/InertiaPlugin.js'
import { ScrollSmoother } from '../lib/gsap/ScrollSmoother.js'
import { ScrollTrigger } from '../lib/gsap/ScrollTrigger.js'
import { SplitText } from '../lib/gsap/SplitText.js'
// GSAP Imports
import { gsap } from '../lib/gsap/index.js'

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollSmoother, SplitText, Draggable, InertiaPlugin)

const marqueeItems = [
  'IELTS booking',
  'UCAS application',
  'CAS statement',
  'Student visa',
  'Health surcharge',
  'TB test',
  'Financial proof',
  'Accommodation',
  'eVisa status',
  'GP registration',
  'Bank account',
  'NI number',
  'Student discounts',
  'Driving licence',
]

const stats = [
  { value: '200', label: 'UK universities' },
  { value: '21', label: 'Official steps' },
  { value: '47', label: 'Sourced resources' },
  { value: '0', label: 'Agency fees', isCurrency: true },
]

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

export function LandingPage() {
  const token = useAuthStore((s) => s.token)
  const haloRef = useRef<HTMLDivElement>(null)

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
    // Initialize smooth scrolling
    ScrollSmoother.create({
      wrapper: '#smooth-wrapper',
      content: '#smooth-content',
      smooth: 1.2,
      effects: true,
    })

    // Headline entrance animation
    const split = new SplitText('.hero-headline', { type: 'words,chars' })
    gsap.from(split.chars, {
      opacity: 0,
      y: 30,
      stagger: 0.02,
      duration: 0.7,
      ease: 'power3.out',
    })

    // Hero content elements fade in
    gsap.from('.hero-fade', {
      opacity: 0,
      y: 20,
      stagger: 0.12,
      duration: 0.8,
      ease: 'power3.out',
      delay: 0.2,
    })

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

    // Scroll reveal sections (dim when scrolled out, bright and focused when reading)
    const revealTargets = [
      '.hero-container',
      '.problem-section',
      '.map-section',
      '.pillars-section',
      '.cta-section',
    ]
    for (const selector of revealTargets) {
      const el = document.querySelector(selector)
      if (!el) continue

      // Fade-in / scale-up / focus when entering
      gsap.fromTo(
        el,
        { opacity: 0.35, scale: 0.98, filter: 'blur(1px)' },
        {
          opacity: 1,
          scale: 1,
          filter: 'blur(0px)',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            end: 'top 40%',
            scrub: 0.5,
          },
        },
      )

      // Fade-out / blur when scrolling past
      gsap.to(el, {
        opacity: 0.35,
        scale: 0.98,
        filter: 'blur(1px)',
        scrollTrigger: {
          trigger: el,
          start: 'bottom 40%',
          end: 'bottom 10%',
          scrub: 0.5,
        },
      })
    }

    // Infinite GSAP marquee
    const marqueeTrack = document.querySelector('.marquee-track')
    if (marqueeTrack) {
      const marqueeTween = gsap.to(marqueeTrack, {
        xPercent: -50,
        ease: 'none',
        duration: 25,
        repeat: -1,
      })

      // Speed up on scroll velocity
      ScrollTrigger.create({
        onUpdate: (self) => {
          const velocity = Math.abs(self.getVelocity())
          const targetScale = gsap.utils.mapRange(0, 2000, 1, 5, velocity)
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
  })

  const createMarqueeHoverHandlers = (idx: number) => {
    return {
      onMouseEnter: (e: React.MouseEvent<HTMLAnchorElement>) => {
        gsap.to(e.currentTarget, {
          scale: 1.15,
          rotate: (idx % 2 === 0 ? 1 : -1) * 3,
          boxShadow: 'var(--shadow-md)',
          color: 'var(--accent)',
          borderColor: 'var(--accent)',
          zIndex: 10,
          duration: 0.3,
          ease: 'back.out(1.7)',
          overwrite: 'auto',
        })
        const dot = e.currentTarget.querySelector('.marquee-dot')
        if (dot) {
          gsap.to(dot, { scale: 2.2, duration: 0.25, ease: 'power2.out', overwrite: 'auto' })
        }
      },
      onMouseLeave: (e: React.MouseEvent<HTMLAnchorElement>) => {
        gsap.to(e.currentTarget, {
          scale: 1,
          rotate: 0,
          boxShadow: 'var(--shadow-sm)',
          color: 'var(--ink-secondary)',
          borderColor: 'var(--border)',
          zIndex: 1,
          duration: 0.3,
          ease: 'power2.out',
          overwrite: 'auto',
        })
        const dot = e.currentTarget.querySelector('.marquee-dot')
        if (dot) {
          gsap.to(dot, { scale: 1, duration: 0.25, ease: 'power2.out', overwrite: 'auto' })
        }
      },
    }
  }

  if (token) return <Navigate to="/" replace />

  return (
    <>
      <div ref={haloRef} className="cursor-halo" aria-hidden="true" />
      <div id="smooth-wrapper" className="relative min-h-screen bg-canvas overflow-x-hidden">
        <div id="smooth-content">
          <div className="blob blob-a w-[420px] h-[420px] -top-24 -left-24" />
          <div className="blob blob-b w-[380px] h-[380px] top-[70vh] -right-32" />

          <nav className="relative z-10 max-w-5xl mx-auto flex items-center justify-between px-6 py-5">
            <Link
              to="/"
              aria-label="StudYou home"
              className="flex items-center gap-2 text-body-lg font-bold tracking-[-0.01em] rounded-sm"
            >
              <span className="breathe w-6 h-6 rounded-xs bg-accent-solid text-white text-caption font-extrabold flex items-center justify-center [background-image:var(--accent-gradient)] transition-transform duration-[120ms] hover:rotate-6 hover:scale-110">
                SY
              </span>
              StudYou
            </Link>
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">
                  Get started
                  <ArrowRight size={14} />
                </Button>
              </Link>
            </div>
          </nav>

          <main className="hero-container relative z-10 max-w-5xl mx-auto px-6 pt-14 pb-10 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
            <div>
              <div className="hero-fade inline-flex items-center gap-1.5 bg-accent-soft text-accent text-caption font-semibold uppercase tracking-[0.05em] px-2.5 py-1 rounded-full mb-5">
                <ShieldCheck size={12} />
                Every step from official sources
              </div>

              <h1 className="hero-headline text-title1 text-ink max-w-xl">
                Your UK study journey, without the agencies.
              </h1>

              <p className="hero-fade text-body-lg text-ink-secondary max-w-md mt-5 leading-relaxed">
                A personal, trackable roadmap through every official step of studying in the UK.
                Real costs, real deadlines, official sources. No commissions, no middlemen.
              </p>

              <div className="hero-fade flex flex-wrap items-center gap-3 mt-8">
                <Link to="/register">
                  <Button size="lg">
                    Start your roadmap
                    <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="secondary" size="lg">
                    Sign in
                  </Button>
                </Link>
              </div>

              <div className="hero-fade grid grid-cols-4 gap-4 mt-10 max-w-md">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <p
                      className="stat-counter text-title3 text-ink tabular-nums font-bold"
                      data-target={stat.value}
                      data-currency={stat.isCurrency ? 'true' : 'false'}
                    >
                      0
                    </p>
                    <p className="text-caption text-ink-secondary mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <FloatingPreview />
          </main>

          <div className="relative z-10 border-y border-hairline bg-surface/60 backdrop-blur-sm py-3.5 overflow-hidden">
            <div className="marquee-track">
              {[...marqueeItems, ...marqueeItems].map((item, index) => (
                <Link
                  key={`${item}-${index >= marqueeItems.length ? 'b' : 'a'}`}
                  to="/register"
                  tabIndex={index >= marqueeItems.length ? -1 : 0}
                  className="marquee-chip shrink-0 inline-flex items-center gap-1.5 text-caption font-semibold text-ink-secondary bg-surface border border-hairline rounded-full px-3 py-1.5 shadow-sm"
                  {...createMarqueeHoverHandlers(index)}
                >
                  <span
                    aria-hidden="true"
                    className="marquee-dot h-1.5 w-1.5 rounded-full"
                    style={{
                      background: 'var(--aurora)',
                      backgroundPosition: `${(index % marqueeItems.length) * 8}% 50%`,
                      backgroundSize: '400% 400%',
                    }}
                  />
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <ProblemSection />
          <InteractiveMapSection />
          <PillarsSection />
          <ClosingCta />

          <footer className="relative z-10 max-w-5xl mx-auto px-6 py-8 text-caption text-ink-tertiary text-center leading-relaxed">
            StudYou provides guidance and signposting only. It is not legal or immigration advice.
            Always confirm details on official sources such as gov.uk.
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
      gsap.from(split.words, {
        opacity: 0.15,
        stagger: 0.02,
        duration: 0.8,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          end: 'bottom 60%',
          scrub: true,
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

function InteractiveMapSection() {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string>('London')
  const detailPanelRef = useRef<HTMLDivElement>(null)

  const activeRegionKey = hoveredRegion || selectedRegion
  const details = REGION_INFOCUS[activeRegionKey] || REGION_INFOCUS.London

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

  // Trigger animations in the details panel on region update
  useEffect(() => {
    if (!detailPanelRef.current || !activeRegionKey) return
    gsap.fromTo(
      detailPanelRef.current.children,
      { opacity: 0, x: 15 },
      { opacity: 1, x: 0, stagger: 0.08, duration: 0.45, ease: 'power2.out' },
    )
  }, [activeRegionKey])

  return (
    <section className="map-section relative z-10 max-w-5xl mx-auto px-6 py-20 border-t border-hairline bg-surface/20">
      <div className="text-center mb-12">
        <p className="text-caption font-semibold uppercase tracking-[0.08em] text-ink-tertiary mb-3">
          Explore UK Geography
        </p>
        <h2 className="text-title2 text-ink font-bold">Discover Regions & Costs</h2>
        <p className="text-body text-ink-secondary mt-2 max-w-md mx-auto">
          Hover or click on any region on the interactive map to compare local living costs, average
          tuition ranges, and notable institutions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-8 items-center bg-surface border border-hairline rounded-lg shadow-md p-6 md:p-8">
        <div className="flex flex-col items-center justify-center p-4 bg-surface-secondary/40 rounded-md border border-hairline max-w-sm mx-auto w-full">
          <UkGeoMap
            selected={[selectedRegion]}
            counts={presetCounts}
            onToggle={(r) => setSelectedRegion(r)}
            onHover={(r) => setHoveredRegion(r)}
          />
          <p className="text-[10px] text-ink-tertiary mt-3 uppercase tracking-wider font-semibold">
            Click to lock selection • Hover to inspect
          </p>
        </div>

        <div ref={detailPanelRef} className="flex flex-col h-full justify-between gap-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h3 className="text-title3 text-ink font-bold">{details.name}</h3>
              <span className="text-xs font-bold text-accent bg-accent-soft px-2 py-0.5 rounded-full">
                {details.unisCount} Universities
              </span>
            </div>

            <p className="text-body text-ink-secondary leading-relaxed">{details.desc}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-canvas border border-hairline rounded-sm p-3.5 flex flex-col gap-1">
                <span className="text-[10px] font-semibold text-ink-tertiary uppercase tracking-wider">
                  Est. Living Expenses
                </span>
                <span className="text-body font-bold text-ink">{details.avgCost}</span>
              </div>
              <div className="bg-canvas border border-hairline rounded-sm p-3.5 flex flex-col gap-1">
                <span className="text-[10px] font-semibold text-ink-tertiary uppercase tracking-wider">
                  Avg. International Tuition
                </span>
                <span className="text-body font-bold text-emerald-600 dark:text-emerald-400">
                  {details.tuition}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider block">
                Featured Institutions
              </span>
              <div className="flex flex-wrap gap-2">
                {details.famous.map((uni) => (
                  <span
                    key={uni}
                    className="text-xs font-medium px-3 py-1 bg-surface-secondary border border-hairline text-ink-secondary rounded-sm"
                  >
                    {uni}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-hairline pt-4 mt-auto">
            <Link to="/register">
              <Button className="w-full sm:w-auto sheen text-white bg-accent-solid [background-image:var(--accent-gradient)]">
                Build my UK roadmap in {details.name}
                <ArrowRight size={14} className="ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function PillarsSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
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
            className="pillar-card spotlight-card rounded-lg shadow-md p-6 border border-hairline"
          >
            <span className="inline-flex h-11 w-11 rounded-md bg-accent-soft text-accent items-center justify-center mb-4">
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
  return (
    <section className="cta-section relative z-10 max-w-5xl mx-auto px-6 py-16">
      <div className="relative overflow-hidden rounded-xl border border-hairline-strong p-10 sm:p-14 text-center">
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{ background: 'var(--aurora)' }}
          aria-hidden="true"
        />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 text-caption font-semibold uppercase tracking-[0.06em] text-accent bg-accent-soft px-2.5 py-1 rounded-full mb-5">
            <Sparkles size={12} />
            Free, and always will be
          </span>
          <h2 className="text-title2 text-ink max-w-xl mx-auto leading-tight font-bold">
            Build the roadmap you wish you had on day one.
          </h2>
          <p className="text-body-lg text-ink-secondary mt-4 max-w-lg mx-auto leading-relaxed">
            Answer three questions and StudYou lays out every step to your UK intake, in order, with
            dates and costs.
          </p>
          <Link to="/register" className="inline-block mt-8">
            <Button size="lg">
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
  )
}
