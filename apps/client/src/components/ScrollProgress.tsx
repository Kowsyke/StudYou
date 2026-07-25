import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from '../lib/gsap/ScrollTrigger.js'
import { gsap } from '../lib/gsap/index.js'

gsap.registerPlugin(useGSAP, ScrollTrigger)

export function ScrollProgress() {
  useGSAP(() => {
    const bar = document.querySelector('.scroll-progress-bar')
    if (!bar) return

    gsap.to(bar, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.3,
      },
    })
  }, [])

  return (
    <div
      className="scroll-progress-bar fixed top-0 left-0 right-0 z-[100] h-[2px] origin-left scale-x-0"
      style={{
        background: 'linear-gradient(90deg, var(--accent), var(--warning))',
      }}
    />
  )
}
