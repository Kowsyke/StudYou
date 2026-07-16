import axios from 'axios'

const TOKEN_KEY = 'studyou_token'

export const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
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
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem('studyou_user')
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
