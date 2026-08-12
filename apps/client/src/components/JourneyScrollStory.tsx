import { useGSAP } from '@gsap/react'
import {
  BadgePoundSterling,
  BookOpen,
  CalendarClock,
  Clock,
  Cloud,
  FileText,
  Files,
  Landmark,
  Plane,
  Sparkles,
  Wallet,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { DrawSVGPlugin } from '../lib/gsap/DrawSVGPlugin.js'
import { MotionPathPlugin } from '../lib/gsap/MotionPathPlugin.js'
import { ScrollTrigger } from '../lib/gsap/ScrollTrigger.js'
import { gsap } from '../lib/gsap/index.js'

gsap.registerPlugin(useGSAP, ScrollTrigger, MotionPathPlugin, DrawSVGPlugin)

// Lightweight resize refresh for ScrollTrigger without bringing in
// ScrollTrigger's full window-listener overhead.
let resizeRaf: number | null = null
function scheduleRefresh() {
  if (resizeRaf != null) return
  resizeRaf = requestAnimationFrame(() => {
    resizeRaf = null
    ScrollTrigger.refresh()
  })
}

// The flight path in a 1200x600 viewBox. The SVG stretches to fill the stage
// (preserveAspectRatio="none"), so a viewBox point (x, y) maps linearly to
// (x / 1200, y / 600) of the stage. The desktop act cards are positioned with
// those same fractions as left/top percentages, which keeps every card locked
// to its point on the line at any viewport size.
const PATH_D = 'M 60 480 C 260 510, 396 370, 620 370 S 900 240, 1050 180'

// tx/ty are the card's own-size offsets that anchor it clear of the line:
// e.g. the first (leftmost) card left-aligns to its point so it can never
// clip off the left edge, and the last (rightmost) right-aligns for the same
// reason. left/top are the viewBox fractions of the point on the path.
const ACTS = [
  {
    key: 'agencies',
    icon: Files,
    title: 'Leave the agencies behind',
    body: 'No commissions, no middlemen, no lost paperwork. Just the official steps.',
    tone: 'muted' as const,
    left: 5,
    top: 72,
    tx: '0%',
    ty: '-105%',
  },
  {
    key: 'costs',
    icon: Wallet,
    title: 'Know every real cost',
    body: 'Tuition, living, and visa fees in your currency, before you commit.',
    tone: 'accent' as const,
    left: 33,
    top: 62,
    tx: '-50%',
    ty: '15%',
  },
  {
    key: 'deadlines',
    icon: CalendarClock,
    title: 'Never miss a deadline',
    body: 'IELTS, CAS, and visa dates sequenced into one tracked timeline.',
    tone: 'accent' as const,
    left: 60,
    top: 48,
    tx: '-50%',
    ty: '-110%',
  },
  {
    key: 'arrive',
    icon: Landmark,
    title: 'Arrive in the UK',
    body: 'Every milestone ticked, from first shortlist to landing day.',
    tone: 'gold' as const,
    left: 88,
    top: 30,
    tx: '-100%',
    ty: '-110%',
  },
]

function toneClasses(tone: 'muted' | 'accent' | 'gold') {
  if (tone === 'gold') return { ring: 'border-warning/40', icon: 'text-warning' }
  if (tone === 'accent') return { ring: 'border-accent/40', icon: 'text-accent' }
  return { ring: 'border-white/15', icon: 'text-ink-secondary' }
}

// Ambient floating objects that drift through the scene as the plane passes,
// evoking the Kling video's world (scattered paper at the start, books and
// budget near the middle, a clock for deadlines, clouds and a plane at the
// arrival). Icon-only and decorative: the act cards carry the words, these
// just add life. `act` ties each to the scrub reveal for its zone; `delay`
// desyncs the gentle CSS float so they do not bob in unison.
const AMBIENT = [
  { key: 'paper-1', icon: FileText, act: 1, left: 15, top: 84, size: 20, tone: 'muted', delay: 0 },
  { key: 'paper-2', icon: Files, act: 1, left: 24, top: 71, size: 15, tone: 'muted', delay: 1.1 },
  { key: 'book', icon: BookOpen, act: 2, left: 40, top: 52, size: 22, tone: 'accent', delay: 0.4 },
  {
    key: 'coin',
    icon: BadgePoundSterling,
    act: 2,
    left: 49,
    top: 66,
    size: 18,
    tone: 'accent',
    delay: 1.6,
  },
  { key: 'clock', icon: Clock, act: 3, left: 71, top: 58, size: 24, tone: 'gold', delay: 0.8 },
  { key: 'cloud', icon: Cloud, act: 3, left: 78, top: 44, size: 20, tone: 'muted', delay: 2 },
  { key: 'plane', icon: Plane, act: 4, left: 83, top: 18, size: 22, tone: 'gold', delay: 0.2 },
  { key: 'spark', icon: Sparkles, act: 4, left: 93, top: 11, size: 16, tone: 'gold', delay: 1.3 },
] as const

function ambientIconTone(tone: 'muted' | 'accent' | 'gold') {
  if (tone === 'gold') return 'text-warning border-warning/25 bg-warning/5'
  if (tone === 'accent') return 'text-accent border-accent/25 bg-accent/5'
  return 'text-white/40 border-white/10 bg-white/5'
}

// Tailwind's breakpoint boundary for the two layouts. Below this we drop the
// pinned cinematic (per the "don't pin on mobile" guidance) and show a static
// vertical timeline instead.
function useMinWidth(px: number): boolean {
  const [matches, setMatches] = useState(
    () => window.matchMedia?.(`(min-width: ${px}px)`).matches ?? true,
  )
  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${px}px)`)
    const onChange = () => setMatches(mql.matches)
    // Re-read on subscribe. The 'change' event only fires on later crossings, so
    // any crossing between the lazy initializer and this listener attaching would
    // otherwise be lost for good, leaving `matches` stale forever. StrictMode makes
    // that gap real in development: it mounts, tears the listener down, then
    // remounts, and a crossing inside that window is simply never delivered. When
    // it landed on false the desktop cinematic never mounted at all.
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [px])
  return matches
}

function ActCard({ act }: { act: (typeof ACTS)[number] }) {
  const Icon = act.icon
  const tone = toneClasses(act.tone)
  return (
    <div
      className={`rounded-2xl border ${tone.ring} bg-[color:var(--canvas)]/70 p-4 shadow-2xl backdrop-blur-xl`}
    >
      <div className="mb-2 flex items-center gap-2.5">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${tone.ring} bg-white/5 ${tone.icon}`}
        >
          <Icon size={17} strokeWidth={2} />
        </span>
        <p className="text-sm font-bold leading-snug text-white">{act.title}</p>
      </div>
      <p className="text-xs leading-relaxed text-ink-secondary">{act.body}</p>
    </div>
  )
}

export function JourneyScrollStory() {
  const rootRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  // The scattered-diagonal cinematic needs real horizontal room; below this
  // the four cards would crowd and overlap, so narrower widths (tablet and
  // down) get the clean vertical timeline instead.
  const isWide = useMinWidth(1024)

  useEffect(() => {
    window.addEventListener('resize', scheduleRefresh)
    return () => window.removeEventListener('resize', scheduleRefresh)
  }, [])

  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      const cards = gsap.utils.toArray('.journey-act-inner') as HTMLElement[]

      // Mobile: a static, non-pinned vertical timeline. Just a gentle staggered
      // reveal as it scrolls into view, or nothing at all under reduced motion.
      if (!isWide) {
        if (prefersReducedMotion || cards.length === 0) return
        gsap.from(cards, {
          opacity: 0,
          y: 24,
          duration: 0.5,
          stagger: 0.12,
          ease: 'power2.out',
          scrollTrigger: { trigger: rootRef.current, start: 'top 75%' },
        })
        return
      }

      const path = rootRef.current?.querySelector<SVGPathElement>('#journey-path')
      const plane = rootRef.current?.querySelector<SVGGElement>('.journey-plane')
      if (!path || !plane) return

      // Reduced motion: no pin, no scrub. Show the finished picture, static.
      if (prefersReducedMotion) {
        gsap.set(path, { drawSVG: '100%' })
        gsap.set(cards, { opacity: 1, y: 0 })
        const end = path.getPointAtLength(path.getTotalLength())
        gsap.set(plane, { x: end.x, y: end.y })
        return
      }

      gsap.set(cards, { opacity: 0, y: 24 })

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: stageRef.current,
          start: 'top top',
          end: '+=180%',
          scrub: 0.8,
          pin: true,
          // ScrollSmoother puts a transform on #smooth-content, and a transformed
          // ancestor becomes the containing block for position:fixed descendants.
          // React runs this child's effect before LandingPage creates the smoother,
          // so ScrollTrigger would otherwise latch pinType 'fixed' at init and never
          // recompute it, leaving the pinned stage anchored to the moving content
          // instead of the viewport. Firefox enforces that containing-block rule
          // strictly, so the section collapsed there while Chromium tolerated it.
          // Pinning by transform is what ScrollSmoother expects regardless of order.
          pinType: 'transform',
          anticipatePin: 1,
        },
      })

      // Line draws and the plane rides the drawing tip across the whole scrub.
      tl.fromTo(path, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1 }, 0).to(
        plane,
        {
          duration: 1,
          motionPath: {
            path: path,
            autoRotate: true,
          },
        },
        0,
      )

      // Each act resolves in just as the plane reaches its point on the line.
      const passAt = [0.05, 0.28, 0.55, 0.85]
      cards.forEach((card, i) => {
        tl.to(card, { opacity: 1, y: 0, duration: 0.12, ease: 'power2.out' }, passAt[i])
      })

      // Ambient objects fade in per act zone as the plane passes. Opacity
      // only: the drift transform is owned by the CSS `journey-float`
      // animation, so GSAP must not touch transform here or the two fight.
      // Act 1's paperwork fades OUT (it dissolves as the plane takes off).
      tl.fromTo('.micro-act-1', { opacity: 0.7 }, { opacity: 0, duration: 0.2 }, 0.1)
      tl.fromTo('.micro-act-2', { opacity: 0 }, { opacity: 0.85, duration: 0.2 }, 0.32)
      tl.fromTo('.micro-act-3', { opacity: 0 }, { opacity: 0.85, duration: 0.2 }, 0.58)
      tl.fromTo('.micro-act-4', { opacity: 0 }, { opacity: 0.9, duration: 0.22 }, 0.86)

      // Re-measure once the page has actually settled.
      //
      // ScrollTrigger caches the pin's start and end the moment the trigger is
      // created, and it reserves the scroll distance from that one measurement.
      // Anything that changes layout afterwards, a late web font, an image, the
      // global theme class arriving from /meta/theme, leaves the pin sized for
      // a page that no longer exists. The section then collapses and the
      // reserved distance shows up as a large empty gap below it.
      //
      // This is a race, so it is intermittent by nature: the same dev server
      // renders correctly on one boot and wrongly on the next, depending on
      // whether the API answered before or after this trigger was built. The
      // only reliable defence is to re-measure at each point where the layout
      // could still have moved. refresh() is idempotent and cheap, so calling
      // it a handful of times costs nothing and removes the whole class of bug.
      const refresh = () => ScrollTrigger.refresh()

      // Fonts change text metrics, which changes the height of everything above
      // this section, which moves the pin's start.
      document.fonts?.ready.then(refresh).catch(() => {})

      // Images and stylesheets are only guaranteed done at window load.
      if (document.readyState !== 'complete') {
        window.addEventListener('load', refresh, { once: true })
      }

      // Backstop for anything async that lands after load, such as the theme
      // fetch flipping the dark class on the html element. gsap.delayedCall is
      // used rather than setTimeout so useGSAP's context reverts it on unmount
      // and StrictMode's double mount cannot leave a stray timer behind.
      gsap.delayedCall(0.4, refresh)
      gsap.delayedCall(1.5, refresh)

      return () => {
        window.removeEventListener('load', refresh)
      }
    },
    { scope: rootRef, dependencies: [isWide] },
  )

  return (
    <section
      ref={rootRef}
      aria-label="Your journey with StudYou, from leaving agencies behind to arriving in the UK"
      className="journey-story relative z-10"
    >
      {isWide ? (
        // Desktop and up: pinned, scroll-scrubbed cinematic.
        <div
          ref={stageRef}
          className="relative min-h-[100svh] w-full flex flex-col justify-center items-center overflow-hidden py-8 px-4 sm:px-6"
        >
          <div className="pointer-events-none absolute inset-x-0 top-6 z-20 px-6 text-center">
            <p className="text-caption font-semibold uppercase tracking-[0.18em] text-accent">
              One roadmap, start to landing
            </p>
            <h2 className="mx-auto mt-2 max-w-xl font-podium text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl md:text-5xl text-outline-white">
              Watch the whole journey unfold.
            </h2>
          </div>

          {/* Locked 2:1 Aspect Ratio Canvas Stage */}
          <div className="relative w-full max-w-6xl aspect-[2.1/1] min-h-[380px] max-h-[70vh] mx-auto my-auto">
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 1200 600"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <title>Flight path</title>
              <defs>
                <filter id="journeyGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="9" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="planeGlow" x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                {/* Cool start, warm arrival: blue at the desk of paperwork,
                    gold as the plane reaches the UK, following the path's
                    bottom-left to top-right direction. */}
                <linearGradient
                  id="journeyStroke"
                  gradientUnits="userSpaceOnUse"
                  x1="60"
                  y1="480"
                  x2="1050"
                  y2="180"
                >
                  <stop offset="0%" stopColor="var(--accent)" />
                  <stop offset="55%" stopColor="var(--accent)" />
                  <stop offset="100%" stopColor="var(--warning)" />
                </linearGradient>
              </defs>

              {/* Faint full-length guide so the path reads even before it draws. */}
              <path
                d={PATH_D}
                fill="none"
                stroke="url(#journeyStroke)"
                strokeOpacity={0.22}
                strokeWidth={3}
                strokeLinecap="round"
              />
              {/* The animated, glowing draw-in stroke. */}
              <path
                id="journey-path"
                d={PATH_D}
                fill="none"
                stroke="url(#journeyStroke)"
                strokeWidth={5}
                strokeLinecap="round"
                filter="url(#journeyGlow)"
              />

              {/* Paper plane, drawn nose-right at the origin so autoRotate can
                  aim it along the path tangent. A soft disc behind it reads as
                  a glowing craft riding the trail's tip. */}
              <g className="journey-plane" filter="url(#planeGlow)">
                <circle r="16" fill="var(--accent)" fillOpacity="0.35" />
                <path d="M 36 0 L -28 -21 L -8 0 L -28 21 Z" fill="#ffffff" />
                <path d="M -8 0 L -28 -21 M -8 0 L -28 21" stroke="var(--accent)" strokeWidth={2} />
              </g>
            </svg>

            {/* Act waypoints, positioned by the same viewBox fractions as the path
                points, each anchored clear of the line. */}
            {ACTS.map((act) => (
              <div
                key={act.key}
                className="journey-act absolute z-10 w-[clamp(11.5rem,14.5vw,15.5rem)]"
                style={{
                  left: `${act.left}%`,
                  top: `${act.top}%`,
                  transform: `translate(${act.tx}, ${act.ty})`,
                }}
              >
                <div className="journey-act-inner">
                  <ActCard act={act} />
                </div>
              </div>
            ))}

            {/* Ambient floating objects (paper, books, budget, clock, clouds,
                plane) that fade in per act zone and gently drift, echoing the
                Kling video without repeating the act cards' words. */}
            {AMBIENT.map((obj) => {
              const Icon = obj.icon
              return (
                <div
                  key={obj.key}
                  className={`micro-act-${obj.act} journey-float pointer-events-none absolute z-0 flex items-center justify-center rounded-full border backdrop-blur-sm ${ambientIconTone(obj.tone)}`}
                  style={{
                    left: `${obj.left}%`,
                    top: `${obj.top}%`,
                    width: `${obj.size + 16}px`,
                    height: `${obj.size + 16}px`,
                    transform: 'translate(-50%, -50%)',
                    animationDelay: `${obj.delay}s`,
                  }}
                >
                  <Icon size={obj.size} strokeWidth={1.75} />
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        // Mobile: static vertical timeline, no pin.
        <div className="relative w-full px-5 py-16">
          <div className="mb-8 text-center">
            <p className="text-caption font-semibold uppercase tracking-[0.18em] text-accent">
              One roadmap, start to landing
            </p>
            <h2 className="mx-auto mt-2 max-w-xs font-podium text-3xl font-black leading-tight tracking-tight text-white text-outline-white">
              The whole journey, one line.
            </h2>
          </div>

          <ol className="relative mx-auto max-w-sm space-y-5 pl-6">
            {/* Glowing spine the icon nodes sit on. */}
            <span
              aria-hidden="true"
              className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-accent/60 via-accent/30 to-warning/60"
            />
            {ACTS.map((act) => {
              const tone = toneClasses(act.tone)
              const Icon = act.icon
              return (
                <li key={act.key} className="journey-act relative">
                  <span
                    className={`absolute -left-6 top-1 flex h-4 w-4 items-center justify-center rounded-full border ${tone.ring} bg-[color:var(--canvas)] ${tone.icon}`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  </span>
                  <div
                    className={`rounded-2xl border ${tone.ring} bg-[color:var(--canvas)]/70 p-4 shadow-xl backdrop-blur-xl`}
                  >
                    <div className="mb-1.5 flex items-center gap-2.5">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${tone.ring} bg-white/5 ${tone.icon}`}
                      >
                        <Icon size={16} strokeWidth={2} />
                      </span>
                      <p className="text-sm font-bold leading-snug text-white">{act.title}</p>
                    </div>
                    <p className="text-xs leading-relaxed text-ink-secondary">{act.body}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </section>
  )
}
