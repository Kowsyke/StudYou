import { create } from 'zustand'

const REGIONS_KEY = 'studyou_regions'

/*
  Region choices made on the public landing page have to survive the walk from
  that page into onboarding and then into the authenticated Universities screen.
  A visitor picks Scotland and the North West before they even have an account,
  so the selection cannot live on the server yet, and component state is lost the
  moment the route changes.

  Persisting here means the choice sticks until the student changes it, which is
  the behaviour they expect: nothing silently resets their filter for them.
*/
interface RegionState {
  regions: string[]
  setRegions: (regions: string[]) => void
  toggleRegion: (region: string) => void
  clearRegions: () => void
}

function load(): string[] {
  try {
    const raw = localStorage.getItem(REGIONS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    // Defensive: anything could be sitting under this key from an older build.
    if (!Array.isArray(parsed)) return []
    return parsed.filter((r): r is string => typeof r === 'string')
  } catch {
    return []
  }
}

function persist(regions: string[]) {
  try {
    localStorage.setItem(REGIONS_KEY, JSON.stringify(regions))
  } catch {
    // Storage can be unavailable in private mode or when the quota is full.
    // Losing persistence is acceptable, breaking region selection is not.
  }
}

export const useRegionStore = create<RegionState>((set) => ({
  regions: load(),
  setRegions: (regions) => {
    persist(regions)
    set({ regions })
  },
  toggleRegion: (region) =>
    set((state) => {
      const next = state.regions.includes(region)
        ? state.regions.filter((r) => r !== region)
        : [...state.regions, region]
      persist(next)
      return { regions: next }
    }),
  clearRegions: () => {
    persist([])
    set({ regions: [] })
  },
}))
