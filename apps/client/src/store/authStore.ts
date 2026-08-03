import type { User } from '@studyou/types'
import { create } from 'zustand'
import { api, setAuthToken } from '../lib/api'

const USER_KEY = 'studyou_user'

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

interface AuthState {
  user: User | null
  // In-memory only, never persisted. See lib/api.ts for the rationale.
  token: string | null
  setAuth: (user: User, token: string) => void
  updateUser: (user: User) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  // The user is restored from localStorage on load; the token is not, because
  // the httpOnly cookie carries the session across reloads.
  user: loadUser(),
  token: null,
  setAuth: (user, token) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    setAuthToken(token)
    set({ user, token })
  },
  updateUser: (user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    set({ user })
  },
  clearAuth: () => {
    api.post('/auth/logout').catch(() => {})
    setAuthToken(null)
    localStorage.removeItem(USER_KEY)
    set({ user: null, token: null })
  },
}))
