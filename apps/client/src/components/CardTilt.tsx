import { useEffect, useRef } from 'react'
import { gsap } from '../lib/gsap/index.js'

interface CardTiltProps {
  children: React.ReactNode
  className?: string
  intensity?: number
  disabled?: boolean
}

export function CardTilt({ children, className, intensity = 6, disabled = false }: CardTiltProps) {
  const innerRef = useRef<HTMLDivElement>(null)
  const quickToRef = useRef<{
    x: ReturnType<typeof gsap.quickTo>
    y: ReturnType<typeof gsap.quickTo>
    scale: ReturnType<typeof gsap.quickTo>
  } | null>(null)

  useEffect(() => {
    const el = innerRef.current
    if (!el || disabled) return

    quickToRef.current = {
      x: gsap.quickTo(el, 'rotateY', { duration: 0.4, ease: 'power2.out' }),
      y: gsap.quickTo(el, 'rotateX', { duration: 0.4, ease: 'power2.out' }),
      scale: gsap.quickTo(el, 'scale', { duration: 0.4, ease: 'power2.out' }),
    }

    return () => {
      quickToRef.current = null
    }
  }, [disabled])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !quickToRef.current) return
    const el = innerRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rotateY = ((x - centerX) / centerX) * intensity
    const rotateX = ((y - centerY) / centerY) * -intensity

    quickToRef.current.x(rotateY)
    quickToRef.current.y(rotateX)
    quickToRef.current.scale(1.02)
  }

  const handleMouseLeave = () => {
    if (disabled || !quickToRef.current) return
    const el = innerRef.current
    if (!el) return

    gsap.to(el, {
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      duration: 0.5,
      ease: 'power3.out',
      overwrite: 'auto',
    })
  }

  return (
    <div
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: '1200px' }}
    >
      <div
        ref={innerRef}
        className="transform-gpu"
        style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
      >
        {children}
      </div>
    </div>
  )
}
