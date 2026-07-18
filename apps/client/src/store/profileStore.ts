import { create } from 'zustand'

const PROFILE_KEY = 'studyou_profile'

export const AVATAR_HUES = ['ocean', 'violet', 'teal', 'sunset', 'forest', 'slate'] as const

export type AvatarHue = (typeof AVATAR_HUES)[number]

// Decorative avatar gradients built from existing token colors so the
// palette stays inside the design system.
export const avatarGradients: Record<AvatarHue, string> = {
  ocean: 'linear-gradient(135deg, var(--accent-solid), var(--category-arrival))',
  violet: 'linear-gradient(135deg, var(--category-housing), var(--accent-solid))',
  teal: 'linear-gradient(135deg, var(--category-arrival), var(--positive))',
  sunset: 'linear-gradient(135deg, var(--warning), var(--danger))',
  forest: 'linear-gradient(135deg, var(--positive), var(--category-arrival))',
  slate: 'linear-gradient(135deg, var(--ink-secondary), var(--ink))',
}

interface ProfileState {
  avatarHue: AvatarHue
  shortlistIds: string[]
  appliedIds: string[]
  setAvatarHue: (hue: AvatarHue) => void
  toggleShortlist: (id: string) => void
  removeFromShortlist: (id: string) => void
  toggleApplied: (id: string) => void
  clearShortlist: () => void
}

interface StoredProfile {
  avatarHue: AvatarHue
  shortlistIds: string[]
  appliedIds: string[]
}

function load(): StoredProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredProfile>
      return {
        avatarHue: AVATAR_HUES.includes(parsed.avatarHue as AvatarHue)
          ? (parsed.avatarHue as AvatarHue)
          : 'ocean',
        shortlistIds: Array.isArray(parsed.shortlistIds) ? parsed.shortlistIds : [],
        appliedIds: Array.isArray(parsed.appliedIds) ? parsed.appliedIds : [],
      }
    }
  } catch {
    // Fall through to defaults.
  }
  return { avatarHue: 'ocean', shortlistIds: [], appliedIds: [] }
}

function persist(state: StoredProfile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(state))
  } catch {
    // Private browsing keeps the in session state only.
  }
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  ...load(),
  setAvatarHue: (hue) => {
    set({ avatarHue: hue })
    const { avatarHue, shortlistIds, appliedIds } = get()
    persist({ avatarHue, shortlistIds, appliedIds })
  },
  toggleShortlist: (id) => {
    set((s) => ({
      shortlistIds: s.shortlistIds.includes(id)
        ? s.shortlistIds.filter((x) => x !== id)
        : [...s.shortlistIds, id],
    }))
    const { avatarHue, shortlistIds, appliedIds } = get()
    persist({ avatarHue, shortlistIds, appliedIds })
  },
  removeFromShortlist: (id) => {
    set((s) => ({
      shortlistIds: s.shortlistIds.filter((x) => x !== id),
      appliedIds: s.appliedIds.filter((x) => x !== id),
    }))
    const { avatarHue, shortlistIds, appliedIds } = get()
    persist({ avatarHue, shortlistIds, appliedIds })
  },
  toggleApplied: (id) => {
    set((s) => ({
      appliedIds: s.appliedIds.includes(id)
        ? s.appliedIds.filter((x) => x !== id)
        : [...s.appliedIds, id],
    }))
    const { avatarHue, shortlistIds, appliedIds } = get()
    persist({ avatarHue, shortlistIds, appliedIds })
  },
  clearShortlist: () => {
    set({ shortlistIds: [], appliedIds: [] })
    const { avatarHue } = get()
    persist({ avatarHue, shortlistIds: [], appliedIds: [] })
  },
}))

export function initialsOf(fullName: string | undefined): string {
  if (!fullName) return 'SY'
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
