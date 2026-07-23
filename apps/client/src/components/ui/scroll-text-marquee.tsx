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
import { useEffect, useRef } from 'react'
import { cn } from '../../lib/utils'

const wrap = (min: number, max: number, v: number) => {
  const range = max - min
  return ((((v - min) % range) + range) % range) + min
}

interface ParallaxProps {
  children: React.ReactNode | string
  baseVelocity?: number
  clasname?: string
  scrollDependent?: boolean
  delay?: number
}

export default function ScrollBaseAnimation({
  children,
  baseVelocity = -5,
  clasname,
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

  const x = useTransform(baseX, (v) => `${wrap(-20, -45, v)}%`)

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
      <motion.div className="flex whitespace-nowrap gap-6 sm:gap-10 flex-nowrap" style={{ x }}>
        <span className={cn('block sm:text-[4vw] text-[6vw] font-bold tracking-tight', clasname)}>
          {children}
        </span>
        <span className={cn('block sm:text-[4vw] text-[6vw] font-bold tracking-tight', clasname)}>
          {children}
        </span>
        <span className={cn('block sm:text-[4vw] text-[6vw] font-bold tracking-tight', clasname)}>
          {children}
        </span>
        <span className={cn('block sm:text-[4vw] text-[6vw] font-bold tracking-tight', clasname)}>
          {children}
        </span>
      </motion.div>
    </div>
  )
}
