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

  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0])
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions())
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100])

  return (
    <div
      className="min-h-[48rem] md:min-h-[64rem] flex items-center justify-center relative p-2 md:p-10 select-none overflow-hidden"
      ref={containerRef}
    >
      <div
        className="py-6 md:py-16 w-full relative overflow-hidden"
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
      className="max-w-5xl mx-auto text-center"
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
          '0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003',
      }}
      className="max-w-5xl -mt-12 mx-auto min-h-[34rem] md:min-h-[42rem] h-auto w-full border-2 border-hairline/50 p-2 md:p-6 bg-surface/30 backdrop-blur-xl rounded-[30px] shadow-2xl overflow-hidden"
    >
      <div className="h-full w-full overflow-hidden rounded-2xl bg-surface-secondary/20 border border-hairline/40 p-2 md:p-6">
        {children}
      </div>
    </motion.div>
  )
}
