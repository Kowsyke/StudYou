import { useEffect, useState } from 'react'
import { useThemeStore } from '../store/themeStore'

export interface ChartTokens {
  ink: string
  grid: string
  accent: string
  positive: string
  danger: string
  surface: string
  border: string
}

function readTokens(): ChartTokens {
  const style = getComputedStyle(document.documentElement)
  const token = (name: string) => style.getPropertyValue(name).trim()
  return {
    ink: token('--ink-secondary'),
    grid: token('--border-strong'),
    accent: token('--accent'),
    positive: token('--positive'),
    danger: token('--danger'),
    surface: token('--surface'),
    border: token('--border'),
  }
}

/**
 * Recharts writes colors into SVG presentation attributes where CSS custom
 * properties are not valid, so chart colors are read from the resolved
 * token values and refreshed whenever the theme changes.
 */
export function useChartTokens(): ChartTokens {
  const [tokens, setTokens] = useState<ChartTokens>(readTokens)

  useEffect(() => {
    setTokens(readTokens())
    // Re-read one frame after any theme change so the .dark class swap
    // has applied before the computed values are sampled.
    return useThemeStore.subscribe(() => {
      requestAnimationFrame(() => setTokens(readTokens()))
    })
  }, [])

  return tokens
}
