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
import { useRef, useState } from 'react'
import { cn } from '../../lib/utils'

const wrap = (min: number, max: number, v: number) => {
  const range = max - min
  return ((((v - min) % range) + range) % range) + min
}

interface InteractiveCardMarqueeProps {
  cards: React.ReactNode[]
  className?: string
}

export function InteractiveCardMarquee({ cards, className }: InteractiveCardMarqueeProps) {
  const baseXTop = useMotionValue(0)
  const [isDragging, setIsDragging] = useState(false)

  const { scrollY } = useScroll()
  const scrollVelocity = useVelocity(scrollY)
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 })
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 1.5], { clamp: false })

  const xTop = useTransform(baseXTop, (v) => `${wrap(-50, 0, v)}%`)

  const dragFactor = useRef(0)

  useAnimationFrame((_t, delta) => {
    // Top track moves left by default (-3% per sec + scroll/drag influence)
    const topMove =
      (-3.5 + dragFactor.current * 8) * (delta / 1000) * (1 + Math.abs(velocityFactor.get()))
    baseXTop.set(baseXTop.get() + topMove)

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
    <div className={cn('relative z-10 py-6 overflow-hidden select-none', className)}>
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
    </div>
  )
}
