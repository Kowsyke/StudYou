import { useGSAP } from '@gsap/react'
import { useRef } from 'react'
import React from 'react'
import { gsap } from '../lib/gsap/index.js'

function useIsCoarsePointer(): boolean {
  const [matches, setMatches] = React.useState(
    () => window.matchMedia?.('(pointer: coarse)').matches ?? false,
  )
  React.useEffect(() => {
    const mql = window.matchMedia('(pointer: coarse)')
    const onChange = () => setMatches(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  return matches
}

export function AmbientBlobs() {
  const blobRef = useRef<HTMLDivElement>(null)
  const isCoarsePointer = useIsCoarsePointer()

  useGSAP(() => {
    if (!blobRef.current || isCoarsePointer) return
    gsap.to(blobRef.current, {
      x: '+=30',
      y: '+=20',
      duration: 14,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })
  }, [])

  if (isCoarsePointer) return null

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <div
        ref={blobRef}
        className="absolute -top-32 left-1/4 w-[400px] h-[400px] rounded-full opacity-[0.06]"
        style={{
          background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
    </div>
  )
}
