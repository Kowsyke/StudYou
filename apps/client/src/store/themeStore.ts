import { create } from 'zustand'

const THEME_KEY = 'studyou_theme'

export type Theme = 'light' | 'dark'

function loadTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: loadTheme(),
  setTheme: (theme) => {
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // Private browsing without storage still gets the in session theme.
    }
    applyTheme(theme)
    set({ theme })
  },
}))

// index.html applies the persisted class before first paint; this keeps
// the store and the document in agreement after hydration.
applyTheme(loadTheme())
