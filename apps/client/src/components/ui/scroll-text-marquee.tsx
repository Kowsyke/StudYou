import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'framer-motion'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/utils'

const wrap = (min: number, max: number, v: number) => {
  const range = max - min
  return ((((v - min) % range) + range) % range) + min
}

interface ParallaxProps {
  children: React.ReactNode
  baseVelocity?: number
  className?: string
  scrollDependent?: boolean
  delay?: number
}

export function ScrollBaseAnimation({
  children,
  baseVelocity = -5,
  className,
  scrollDependent = false,
  delay = 0,
}: ParallaxProps) {
  const baseX = useMotionValue(0)
  const { scrollY } = useScroll()
  const scrollVelocity = useVelocity(scrollY)
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  })
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 2], {
    clamp: false,
  })

  const x = useTransform(baseX, (v) => `${wrap(-25, -50, v)}%`)

  const directionFactor = useRef<number>(1)
  const hasStarted = useRef(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      hasStarted.current = true
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  useAnimationFrame((_t, delta) => {
    if (!hasStarted.current) return

    let moveBy = directionFactor.current * baseVelocity * (delta / 1000)

    if (scrollDependent) {
      if (velocityFactor.get() < 0) {
        directionFactor.current = -1
      } else if (velocityFactor.get() > 0) {
        directionFactor.current = 1
      }
    }

    moveBy += directionFactor.current * moveBy * velocityFactor.get()

    baseX.set(baseX.get() + moveBy)
  })

  return (
    <div className="overflow-hidden whitespace-nowrap flex flex-nowrap select-none">
      <motion.div
        className={cn('flex whitespace-nowrap gap-5 flex-nowrap', className)}
        style={{ x }}
      >
        {children}
        {children}
        {children}
        {children}
      </motion.div>
    </div>
  )
}

interface InteractiveCardMarqueeProps {
  cards: React.ReactNode[]
  className?: string
}

export function InteractiveCardMarquee({ cards, className }: InteractiveCardMarqueeProps) {
  const baseXTop = useMotionValue(0)
  const baseXBottom = useMotionValue(0)
  const [isDragging, setIsDragging] = useState(false)

  const { scrollY } = useScroll()
  const scrollVelocity = useVelocity(scrollY)
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 })
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 1.5], { clamp: false })

  const xTop = useTransform(baseXTop, (v) => `${wrap(-50, 0, v)}%`)
  const xBottom = useTransform(baseXBottom, (v) => `${wrap(-50, 0, v)}%`)

  const dragFactor = useRef(0)

  useAnimationFrame((_t, delta) => {
    // Top track moves left by default (-3% per sec + scroll/drag influence)
    const topMove =
      (-3.5 + dragFactor.current * 8) * (delta / 1000) * (1 + Math.abs(velocityFactor.get()))
    baseXTop.set(baseXTop.get() + topMove)

    // Bottom track moves right by default (+3.5% per sec - drag influence)
    const bottomMove =
      (3.5 - dragFactor.current * 8) * (delta / 1000) * (1 + Math.abs(velocityFactor.get()))
    baseXBottom.set(baseXBottom.get() + bottomMove)

    // Smooth decay drag factor back to zero when released
    if (!isDragging && Math.abs(dragFactor.current) > 0.001) {
      dragFactor.current *= 0.92
    }
  })

  // Mouse / Touch Drag gesture handlers
  const handlePan = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number }; velocity: { x: number } },
  ) => {
    dragFactor.current = info.velocity.x * 0.005
  }

  return (
    <div className={cn('relative z-10 py-6 overflow-hidden select-none space-y-5', className)}>
      {/* Top Row: Draggable Feature Cards (Moving Left) */}
      <motion.div
        className="overflow-hidden flex cursor-grab active:cursor-grabbing"
        onPanStart={() => setIsDragging(true)}
        onPan={handlePan}
        onPanEnd={() => setIsDragging(false)}
      >
        <motion.div className="flex gap-5 shrink-0" style={{ x: xTop }}>
          {cards}
          {cards}
          {cards}
          {cards}
        </motion.div>
      </motion.div>

      {/* Bottom Row: Reflected Feature Cards (Moving Right, Mirroring Drag Physics) */}
      <div className="opacity-25 blur-[0.4px] transform scale-y-[-1] origin-center pointer-events-none overflow-hidden flex">
        <motion.div className="flex gap-5 shrink-0" style={{ x: xBottom }}>
          {cards}
          {cards}
          {cards}
          {cards}
        </motion.div>
      </div>
    </div>
  )
}

export default ScrollBaseAnimation
