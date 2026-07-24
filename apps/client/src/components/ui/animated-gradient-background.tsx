import { motion } from 'framer-motion'
import type React from 'react'
import { useEffect, useRef } from 'react'

interface AnimatedGradientBackgroundProps {
  /**
   * Initial size of the radial gradient, defining the starting width.
   * @default 110
   */
  startingGap?: number

  /**
   * Enables or disables the breathing animation effect.
   * @default false
   */
  Breathing?: boolean

  /**
   * Array of colors to use in the radial gradient.
   * Each color corresponds to a stop percentage in `gradientStops`.
   * @default ["#0A0A0A", "#2979FF", "#FF80AB", "#FF6D00", "#FFD600", "#00E676", "#3D5AFE"]
   */
  gradientColors?: string[]

  /**
   * Array of percentage stops corresponding to each color in `gradientColors`.
   * The values should range between 0 and 100.
   * @default [35, 50, 60, 70, 80, 90, 100]
   */
  gradientStops?: number[]

  /**
   * Speed of the breathing animation.
   * Lower values result in slower animation.
   * @default 0.02
   */
  animationSpeed?: number

  /**
   * Maximum range for the breathing animation in percentage points.
   * Determines how much the gradient "breathes" by expanding and contracting.
   * @default 5
   */
  breathingRange?: number

  /**
   * Additional inline styles for the gradient container.
   * @default {}
   */
  containerStyle?: React.CSSProperties

  /**
   * Additional class names for the gradient container.
   * @default ""
   */
  containerClassName?: string

  /**
   * Additional top offset for the gradient container form the top to have a more flexible control over the gradient.
   * @default 0
   */
  topOffset?: number
}

/**
 * AnimatedGradientBackground
 *
 * This component renders a customizable animated radial gradient background with a subtle breathing effect.
 * It uses `framer-motion` for an entrance animation and raw CSS gradients for the dynamic background.
 *
 *
 * @param {AnimatedGradientBackgroundProps} props - Props for configuring the gradient animation.
 * @returns JSX.Element
 */
export const AnimatedGradientBackground: React.FC<AnimatedGradientBackgroundProps> = ({
  startingGap = 125,
  Breathing = false,
  gradientColors = ['#050814', '#312e81', '#4c1d95', '#701a75', '#0e7490', '#1e1b4b', '#030712'],
  gradientStops = [30, 48, 62, 74, 85, 94, 100],
  animationSpeed = 0.04,
  breathingRange = 5,
  containerStyle = {},
  topOffset = 0,
  containerClassName = '',
}) => {
  // Validation: Ensure gradientStops and gradientColors lengths match
  if (gradientColors.length !== gradientStops.length) {
    throw new Error(
      `GradientColors and GradientStops must have the same length.
     Received gradientColors length: ${gradientColors.length},
     gradientStops length: ${gradientStops.length}`,
    )
  }

  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const paintGradient = (width: number) => {
      const gradientStopsString = gradientStops
        .map((stop, index) => `${gradientColors[index]} ${stop}%`)
        .join(', ')
      const gradient = `radial-gradient(${width}% ${width + topOffset}% at 50% 20%, ${gradientStopsString})`
      if (containerRef.current) {
        containerRef.current.style.background = gradient
      }
    }

    // Breathing size never changes when Breathing is off, and reduced
    // motion overrides the prop entirely, so there is nothing to animate:
    // paint one frame and stop, instead of looping requestAnimationFrame
    // forever to recompute an identical gradient string every frame.
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (!Breathing || prefersReducedMotion) {
      paintGradient(startingGap)
      return
    }

    let animationFrame = 0
    let width = startingGap
    let directionWidth = 1

    const animateGradient = () => {
      if (width >= startingGap + breathingRange) directionWidth = -1
      if (width <= startingGap - breathingRange) directionWidth = 1

      width += directionWidth * animationSpeed
      paintGradient(width)

      animationFrame = requestAnimationFrame(animateGradient)
    }

    animationFrame = requestAnimationFrame(animateGradient)

    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrame)
        animationFrame = 0
      } else if (!animationFrame) {
        animateGradient()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelAnimationFrame(animationFrame)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [
    startingGap,
    Breathing,
    gradientColors,
    gradientStops,
    animationSpeed,
    breathingRange,
    topOffset,
  ])

  return (
    <motion.div
      key="animated-gradient-background"
      initial={{
        opacity: 0,
        scale: 1.5,
      }}
      animate={{
        opacity: 1,
        scale: 1,
        transition: {
          duration: 2,
          ease: [0.25, 0.1, 0.25, 1], // Cubic bezier easing
        },
      }}
      className={`absolute inset-0 overflow-hidden ${containerClassName}`}
    >
      <div
        ref={containerRef}
        style={containerStyle}
        className="absolute inset-0 transition-transform"
      />
    </motion.div>
  )
}

export default AnimatedGradientBackground
