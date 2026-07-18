import { create } from 'zustand'

const PROGRESS_KEY = 'studyou_shortlist_progress'

export interface UniProgress {
  docsReady: boolean
  applied: boolean
  offer: boolean
  deposit: boolean
  visa: boolean
  enrolled: boolean
}

export const MILESTONE_KEYS: (keyof UniProgress)[] = [
  'docsReady',
  'applied',
  'offer',
  'deposit',
  'visa',
  'enrolled',
]

export const MILESTONE_LABELS: Record<keyof UniProgress, string> = {
  docsReady: 'Documents Ready',
  applied: 'Application Sent',
  offer: 'Offer Letter Received',
  deposit: 'Tuition Deposit / CAS',
  visa: 'UK Student Visa',
  enrolled: 'Enrolled & Ready',
}

export const MILESTONE_DESCRIPTIONS: Record<keyof UniProgress, string> = {
  docsReady: 'SOP, CV, and transcripts are ready.',
  applied: 'Submitted on the official application portal.',
  offer: 'Conditional or Unconditional Offer received.',
  deposit: 'Deposit paid and CAS letter received.',
  visa: 'Visa approved by UKVI.',
  enrolled: 'Flights booked and registered at uni.',
}

interface ShortlistProgressState {
  progress: Record<string, UniProgress>
  toggleStep: (uniId: string, step: keyof UniProgress) => void
  setStep: (uniId: string, step: keyof UniProgress, val: boolean) => void
  getUniProgress: (uniId: string) => UniProgress
}

const defaultProgress: UniProgress = {
  docsReady: false,
  applied: false,
  offer: false,
  deposit: false,
  visa: false,
  enrolled: false,
}

function loadProgress(): Record<string, UniProgress> {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch (_) {}
  return {}
}

function persistProgress(progress: Record<string, UniProgress>) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
  } catch (_) {}
}

export const useShortlistProgressStore = create<ShortlistProgressState>((set, get) => ({
  progress: loadProgress(),

  toggleStep: (uniId, step) => {
    set((state) => {
      const current = state.progress[uniId] ?? { ...defaultProgress }
      const updated = {
        ...state.progress,
        [uniId]: {
          ...current,
          [step]: !current[step],
        },
      }
      persistProgress(updated)
      return { progress: updated }
    })
  },

  setStep: (uniId, step, val) => {
    set((state) => {
      const current = state.progress[uniId] ?? { ...defaultProgress }
      const updated = {
        ...state.progress,
        [uniId]: {
          ...current,
          [step]: val,
        },
      }
      persistProgress(updated)
      return { progress: updated }
    })
  },

  getUniProgress: (uniId) => {
    return get().progress[uniId] ?? { ...defaultProgress }
  },
}))

export function getUniProgressPercent(progress: UniProgress | undefined): number {
  if (!progress) return 0
  const completed = MILESTONE_KEYS.filter((k) => progress[k]).length
  return Math.round((completed / MILESTONE_KEYS.length) * 100)
}
