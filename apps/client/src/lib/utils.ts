import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// The design system defines its own type scale in index.css (--text-title1 and
// friends). tailwind-merge only knows the stock scale, so without this it
// classifies a custom size like text-micro as a text COLOR, and silently drops
// it whenever a real color is merged in after it. That is how a 10px badge
// label ends up rendering at the inherited 16px. Registering the scale here
// keeps size and color in separate conflict groups, as intended.
const CUSTOM_TEXT_SIZES = [
  'title1',
  'title2',
  'title3',
  'body-lg',
  'body',
  'caption',
  'micro',
] as const

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: [...CUSTOM_TEXT_SIZES] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
