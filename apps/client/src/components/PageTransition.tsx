import { useGSAP } from '@gsap/react'
import { type ReactNode, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { CustomEase } from '../lib/gsap/CustomEase.js'
import { Flip } from '../lib/gsap/Flip.js'
import { gsap } from '../lib/gsap/index.js'

gsap.registerPlugin(Flip, CustomEase)

// Proprietary overshoot ease for page entrances
CustomEase.create('pageIn', 'M0,0 C0.14,0 0.27,0.56 0.38,0.79 0.52,1.08 0.62,1 1,1')

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const prevPathRef = useRef(location.pathname)

  useGSAP(
    () => {
      if (!containerRef.current) return

      // Skip animation on first render
      if (prevPathRef.current === location.pathname) return
      prevPathRef.current = location.pathname

      // Check reduced motion preference
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      const el = containerRef.current

      // Animate the new page in
      gsap.fromTo(
        el,
        {
          opacity: 0,
          scale: 1.015,
          y: 8,
          filter: 'blur(2px)',
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.35,
          ease: 'pageIn',
          clearProps: 'all',
        },
      )
    },
    { scope: containerRef, dependencies: [location.pathname] },
  )

  return (
    <div ref={containerRef} className="page-transition-container">
      {children}
    </div>
  )
}
