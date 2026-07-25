import { useGSAP } from '@gsap/react'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ScrollTrigger } from '../lib/gsap/ScrollTrigger.js'
import { gsap } from '../lib/gsap/index.js'

gsap.registerPlugin(useGSAP, ScrollTrigger)

// The closing brand outro. The oversized StudYou wordmark sits centered with a
// smooth, subtle liquid glass shine that flows strictly inside the letter glyphs
// on cursor hover.
export function BrandOutro() {
  const rootRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLAnchorElement>(null)
  const wordRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      const link = rootRef.current?.querySelector('.brand-link')
      const word = rootRef.current?.querySelector('.brand-word')
      if (reduce || !link || !word) return

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top 85%',
          end: 'top 20%',
          scrub: 0.9,
        },
      })
      tl.fromTo(
        link,
        { opacity: 0.15, scale: 0.82, yPercent: 12 },
        { opacity: 1, scale: 1, yPercent: 0, ease: 'none' },
        0,
      ).fromTo(
        word,
        { backgroundPositionX: '0%' },
        { backgroundPositionX: '100%', ease: 'none' },
        0,
      )
    },
    { scope: rootRef },
  )

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!wordRef.current) return
    const rect = wordRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))

    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = (e.clientX - cx) * 0.05
    const dy = (e.clientY - cy) * 0.05

    // Smooth GSAP 60fps liquid glass sheen movement inside letters
    gsap.to(wordRef.current, {
      '--shine-x': `${x}%`,
      '--glass-brightness': 1.25,
      duration: 0.6,
      ease: 'power2.out',
      overwrite: 'auto',
    })

    if (cardRef.current) {
      gsap.to(cardRef.current, {
        rotateX: -dy * 0.15,
        rotateY: dx * 0.15,
        duration: 0.6,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (wordRef.current) {
      gsap.to(wordRef.current, {
        '--shine-x': '50%',
        '--glass-brightness': 1.0,
        duration: 0.8,
        ease: 'power3.out',
        overwrite: 'auto',
      })
    }
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.8,
        ease: 'power3.out',
        overwrite: 'auto',
      })
    }
  }, [])

  return (
    <section
      ref={rootRef}
      aria-label="StudYou"
      className="relative z-10 flex flex-1 items-center justify-center overflow-hidden px-4 py-20 text-center"
    >
      <Link
        ref={cardRef}
        to="/login"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        aria-label="Sign in to StudYou"
        className="brand-link group relative block max-w-full rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-accent [perspective:1000px]"
      >
        <div className="relative z-10 select-none">
          <div className="mb-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-surface/50 backdrop-blur-md text-caption font-semibold uppercase tracking-[0.22em] text-ink-secondary group-hover:border-accent/40 group-hover:text-accent transition-colors duration-300">
            <Sparkles size={13} className="text-accent animate-pulse" />
            Every official step. No commission.
          </div>

          {/* Liquid glass wordmark strictly clipped inside text letters */}
          <div className="relative py-2 px-4">
            <div
              ref={wordRef}
              className="brand-word mx-auto max-w-full select-none bg-clip-text font-podium font-black leading-none tracking-tighter text-transparent transition-all duration-300"
              style={{
                fontSize: 'clamp(3.5rem, 21vw, 18rem)',
                backgroundImage:
                  'linear-gradient(115deg, #ec4899 0%, #a855f7 calc(var(--shine-x, 50%) - 28%), rgba(255,255,255,0.98) calc(var(--shine-x, 50%) - 5%), #8cecff var(--shine-x, 50%), rgba(255,255,255,0.98) calc(var(--shine-x, 50%) + 5%), #ec4899 calc(var(--shine-x, 50%) + 28%), #3b82f6 100%)',
                backgroundSize: '160% 100%',
                filter: 'brightness(var(--glass-brightness, 1.0))',
              }}
            >
              StudYou
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-solid text-white text-body-sm font-bold shadow-lg shadow-accent/20 group-hover:shadow-accent/40 group-hover:scale-105 transition-all duration-300">
              Sign in to your roadmap
              <ArrowRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </span>
          </div>
        </div>
      </Link>
    </section>
  )
}
