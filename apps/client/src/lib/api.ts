import axios from 'axios'

const USER_KEY = 'studyou_user'

// On the web the client is served from the same origin as the API, so a
// relative base path works and is proxied in dev. A packaged desktop build
// (Tauri) loads from a tauri:// origin, where a relative path would resolve
// against the app itself, so it needs an absolute API URL baked in at build
// time via VITE_API_URL. Defaulting to the relative path keeps every web
// build behaving exactly as before.
const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1'

// The auth token is held in memory only, never written to localStorage, so an
// XSS bug cannot read a long lived token out of storage. Web auth rides the
// httpOnly cookie the server sets on login; this in-memory bearer covers the
// current session and the future desktop build (which cannot send the
// cross-site cookie). On reload the token is gone but the cookie keeps the
// session alive, and the stored user object (non-sensitive) drives the UI.
let authToken: string | null = null
export function setAuthToken(token: string | null) {
  authToken = token
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`
  }
  return config
})

// An expired or invalid token anywhere in the app clears the session and
// lands on the login page with a friendly explanation instead of failing
// silently or spamming the console.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const onAuthPage = ['/login', '/register'].includes(window.location.pathname)
    if (error.response?.status === 401 && !onAuthPage) {
      authToken = null
      localStorage.removeItem(USER_KEY)
      window.location.href = '/login?expired=1'
    }
    return Promise.reject(error)
  },
)

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined
    if (data?.error) return data.error
  }
  return fallback
}
