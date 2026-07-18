import { create } from 'zustand'
import { api } from '../lib/api'
import { useAuthStore } from './authStore'

const THEME_KEY = 'studyou_theme'
const ACCENT_KEY = 'studyou_accent_preset'

export type Theme = 'light' | 'dark'

export interface AccentPreset {
  key: string
  label: string
  accent: string
  accentHover: string
  accentPressed: string
  accentSoft: string
  accentSolid: string
  accentSolidHover: string
  accentSolidPressed: string
  accentGradient: string
  accentGradientHover: string
}

export const ACCENT_PRESETS: Record<string, AccentPreset> = {
  blue: {
    key: 'blue',
    label: 'Apple Blue',
    accent: '#0066cc',
    accentHover: '#0055aa',
    accentPressed: '#004488',
    accentSoft: 'rgba(0, 102, 204, 0.08)',
    accentSolid: '#0066cc',
    accentSolidHover: '#0055aa',
    accentSolidPressed: '#004488',
    accentGradient: 'linear-gradient(135deg, #4364f7 0%, #2b4eff 100%)',
    accentGradientHover: 'linear-gradient(135deg, #3056f0 0%, #2144e8 100%)',
  },
  purple: {
    key: 'purple',
    label: 'Obsidian Purple',
    accent: '#8b5cf6',
    accentHover: '#7c3aed',
    accentPressed: '#6d28d9',
    accentSoft: 'rgba(139, 92, 246, 0.08)',
    accentSolid: '#8b5cf6',
    accentSolidHover: '#7c3aed',
    accentSolidPressed: '#6d28d9',
    accentGradient: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
    accentGradientHover: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
  },
  emerald: {
    key: 'emerald',
    label: 'Neon Cyber',
    accent: '#10b981',
    accentHover: '#059669',
    accentPressed: '#047857',
    accentSoft: 'rgba(16, 185, 129, 0.08)',
    accentSolid: '#10b981',
    accentSolidHover: '#059669',
    accentSolidPressed: '#047857',
    accentGradient: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
    accentGradientHover: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
  },
  rose: {
    key: 'rose',
    label: 'Sunset Rose',
    accent: '#ec4899',
    accentHover: '#db2777',
    accentPressed: '#be185d',
    accentSoft: 'rgba(236, 72, 153, 0.08)',
    accentSolid: '#ec4899',
    accentSolidHover: '#db2777',
    accentSolidPressed: '#be185d',
    accentGradient: 'linear-gradient(135deg, #fb7185 0%, #db2777 100%)',
    accentGradientHover: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
  },
  amber: {
    key: 'amber',
    label: 'Gold Amber',
    accent: '#f59e0b',
    accentHover: '#d97706',
    accentPressed: '#b45309',
    accentSoft: 'rgba(245, 158, 11, 0.08)',
    accentSolid: '#f59e0b',
    accentSolidHover: '#d97706',
    accentSolidPressed: '#b45309',
    accentGradient: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
    accentGradientHover: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
  },
}

function loadTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

function loadAccentPreset(): string {
  try {
    return localStorage.getItem(ACCENT_KEY) ?? 'blue'
  } catch {
    return 'blue'
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

function applyAccentPreset(presetKey: string) {
  const preset = ACCENT_PRESETS[presetKey] || ACCENT_PRESETS.blue
  const root = document.documentElement
  root.style.setProperty('--accent', preset.accent)
  root.style.setProperty('--accent-hover', preset.accentHover)
  root.style.setProperty('--accent-pressed', preset.accentPressed)
  root.style.setProperty('--accent-soft', preset.accentSoft)
  root.style.setProperty('--accent-solid', preset.accentSolid)
  root.style.setProperty('--accent-solid-hover', preset.accentSolidHover)
  root.style.setProperty('--accent-solid-pressed', preset.accentSolidPressed)
  root.style.setProperty('--accent-gradient', preset.accentGradient)
  root.style.setProperty('--accent-gradient-hover', preset.accentGradientHover)
}

interface ThemeState {
  theme: Theme
  accentPreset: string
  setTheme: (theme: Theme) => void
  setAccentPreset: (preset: string) => void
  fetchGlobalTheme: () => Promise<void>
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: loadTheme(),
  accentPreset: loadAccentPreset(),
  setTheme: async (theme) => {
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {}
    applyTheme(theme)
    set({ theme })

    const user = useAuthStore.getState().user
    if (user?.role === 'admin') {
      try {
        const accentPreset = useThemeStore.getState().accentPreset
        await api.post('/meta/theme', { theme, accentPreset })
      } catch (e) {
        console.error('Failed to update global theme', e)
      }
    }
  },
  setAccentPreset: async (preset) => {
    try {
      localStorage.setItem(ACCENT_KEY, preset)
    } catch {}
    applyAccentPreset(preset)
    set({ accentPreset: preset })

    const user = useAuthStore.getState().user
    if (user?.role === 'admin') {
      try {
        const theme = useThemeStore.getState().theme
        await api.post('/meta/theme', { theme, accentPreset: preset })
      } catch (e) {
        console.error('Failed to update global accent preset', e)
      }
    }
  },
  fetchGlobalTheme: async () => {
    try {
      const response = await api.get<{
        success: boolean
        data: { theme: Theme; accentPreset: string }
      }>('/meta/theme')
      if (response.data?.success && response.data.data) {
        const { theme, accentPreset } = response.data.data
        try {
          localStorage.setItem(THEME_KEY, theme)
          localStorage.setItem(ACCENT_KEY, accentPreset)
        } catch {}
        applyTheme(theme)
        applyAccentPreset(accentPreset)
        set({ theme, accentPreset })
      }
    } catch (e) {
      console.error('Failed to fetch global theme', e)
    }
  },
}))

// Apply persisted states before hydration
applyTheme(loadTheme())
applyAccentPreset(loadAccentPreset())
