import { type MotionValue, motion, useScroll, useTransform } from 'framer-motion'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'

export interface ContainerScrollProps {
  titleComponent: string | React.ReactNode
  children: React.ReactNode
}

export function ContainerScroll({ titleComponent, children }: ContainerScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
  })
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  const scaleDimensions = () => {
    return isMobile ? [0.7, 0.9] : [1.05, 1]
  }

  const rotate = useTransform(scrollYProgress, [0, 1], [35, 0])
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions())
  const translate = useTransform(scrollYProgress, [0, 1], [0, -120])

  return (
    <div
      className="min-h-[32rem] md:min-h-[42rem] flex items-center justify-center relative p-2 md:p-6 select-none"
      ref={containerRef}
    >
      <div
        className="py-4 md:py-8 w-full relative"
        style={{
          perspective: '1000px',
        }}
      >
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  )
}

interface HeaderProps {
  translate: MotionValue<number>
  titleComponent: string | React.ReactNode
}

export function Header({ translate, titleComponent }: HeaderProps) {
  return (
    <motion.div
      style={{
        translateY: translate,
      }}
      className="max-w-5xl mx-auto text-center mb-6"
    >
      {titleComponent}
    </motion.div>
  )
}

interface CardProps {
  rotate: MotionValue<number>
  scale: MotionValue<number>
  children: React.ReactNode
}

export function Card({ rotate, scale, children }: CardProps) {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          '0 0 0 1px rgba(255,255,255,0.05), 0 20px 40px rgba(0,0,0,0.5), 0 40px 80px rgba(100,50,255,0.15), 0 80px 120px rgba(0,100,255,0.1)',
      }}
      className="max-w-5xl mx-auto min-h-[22rem] md:min-h-[28rem] h-auto w-full p-2 md:p-5 bg-white/5 backdrop-blur-3xl rounded-[24px] sm:rounded-[30px] overflow-hidden"
    >
      <div className="h-full w-full overflow-hidden rounded-xl sm:rounded-2xl bg-black/60 border border-white/10 p-2 md:p-5 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]">
        {children}
      </div>
    </motion.div>
  )
}
