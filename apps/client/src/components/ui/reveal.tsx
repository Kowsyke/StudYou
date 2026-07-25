import { type HTMLMotionProps, motion } from 'framer-motion'
import type { ReactNode } from 'react'

/*
  Entrance primitives for list and grid content.

  Motion here is deliberately small: content rises 8px and fades over 300ms on
  the design system's swift easing, never overshooting or bouncing. The point
  is to give a page a sense of assembly, not to draw attention to itself.

  Reduced motion is handled for free: App.tsx wraps the tree in a MotionConfig
  whose reducedMotion is 'always' when the in app preference is set and 'user'
  otherwise, so framer-motion drops the transform and leaves a plain fade for
  anyone who opted out at either level. Nothing here needs its own check.
*/

// Design system swift easing, matching --ease-swift in index.css.
const SWIFT = [0.16, 1, 0.3, 1] as const

const DURATION = 0.3
const RISE = 8

interface RevealProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  /** Seconds to wait before this element starts. */
  delay?: number
  className?: string
}

/** Fades and lifts a single block into place once, on mount. */
export function Reveal({ children, delay = 0, className, ...rest }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: RISE }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION, ease: SWIFT, delay }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

interface RevealGroupProps {
  children: ReactNode
  /** Seconds between each child. Kept short so long lists never feel slow. */
  stagger?: number
  /** Seconds before the first child starts. */
  delay?: number
  className?: string
}

/*
  Staggers its direct RevealItem children. Use for card grids and lists.
  Children animate as the group scrolls into view rather than on mount, so a
  long page does not burn its whole animation budget above the fold.
*/
export function RevealGroup({ children, stagger = 0.05, delay = 0, className }: RevealGroupProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface RevealItemProps {
  children: ReactNode
  className?: string
}

/** A single staggered child. Must be rendered inside a RevealGroup. */
export function RevealItem({ children, className }: RevealItemProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: RISE },
        visible: { opacity: 1, y: 0, transition: { duration: DURATION, ease: SWIFT } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
