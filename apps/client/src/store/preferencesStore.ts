import { create } from 'zustand'

const PREFS_KEY = 'studyou_prefs'

export const DUE_SOON_OPTIONS = [7, 14, 30] as const
export type DueSoonDays = (typeof DUE_SOON_OPTIONS)[number]

interface StoredPrefs {
  reduceMotion: boolean
  showHomeCurrency: boolean
  dueSoonDays: DueSoonDays
  compactCards: boolean
}

interface PreferencesState extends StoredPrefs {
  setReduceMotion: (value: boolean) => void
  setShowHomeCurrency: (value: boolean) => void
  setDueSoonDays: (value: DueSoonDays) => void
  setCompactCards: (value: boolean) => void
}

const defaults: StoredPrefs = {
  reduceMotion: false,
  showHomeCurrency: true,
  dueSoonDays: 14,
  compactCards: false,
}

function load(): StoredPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredPrefs>
      return {
        reduceMotion: parsed.reduceMotion === true,
        showHomeCurrency: parsed.showHomeCurrency !== false,
        dueSoonDays: DUE_SOON_OPTIONS.includes(parsed.dueSoonDays as DueSoonDays)
          ? (parsed.dueSoonDays as DueSoonDays)
          : 14,
        compactCards: parsed.compactCards === true,
      }
    }
  } catch {
    // Defaults below.
  }
  return { ...defaults }
}

function persist(state: StoredPrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(state))
  } catch {
    // In session only when storage is unavailable.
  }
}

function snapshot(s: PreferencesState): StoredPrefs {
  return {
    reduceMotion: s.reduceMotion,
    showHomeCurrency: s.showHomeCurrency,
    dueSoonDays: s.dueSoonDays,
    compactCards: s.compactCards,
  }
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  ...load(),
  setReduceMotion: (value) => {
    set({ reduceMotion: value })
    persist(snapshot(get()))
  },
  setShowHomeCurrency: (value) => {
    set({ showHomeCurrency: value })
    persist(snapshot(get()))
  },
  setDueSoonDays: (value) => {
    set({ dueSoonDays: value })
    persist(snapshot(get()))
  },
  setCompactCards: (value) => {
    set({ compactCards: value })
    persist(snapshot(get()))
  },
}))

/* Clears every locally stored StudYou preference and profile choice,
   leaving the signed in session itself intact. */
export function clearLocalData() {
  try {
    localStorage.removeItem(PREFS_KEY)
    localStorage.removeItem('studyou_profile')
    localStorage.removeItem('studyou_theme')
  } catch {
    // Nothing to clear.
  }
}
