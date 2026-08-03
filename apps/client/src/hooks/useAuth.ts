import type { ApiResponse, AuthPayload } from '@studyou/types'
import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'

interface LoginInput {
  email: string
  password: string
}

interface RegisterInput extends LoginInput {
  fullName: string
  originCountryCode?: string
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)
  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const { data } = await api.post<ApiResponse<AuthPayload>>('/auth/login', input)
      if (!data.data) throw new Error(data.error ?? 'Login failed')
      return data.data
    },
    onSuccess: (payload) => setAuth(payload.user, payload.token),
  })
}

// In enumeration-resistant mode (production) the server creates the account but
// does not log the user in, returning { pendingLogin: true } instead of a
// token, so the caller routes the user to the sign-in screen. In development
// the flag is off and registration returns the full AuthPayload for auto-login.
export type RegisterResult = AuthPayload | { pendingLogin: true }

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth)
  return useMutation({
    mutationFn: async (input: RegisterInput): Promise<RegisterResult> => {
      const { data } = await api.post<ApiResponse<RegisterResult>>('/auth/register', input)
      if (!data.data) throw new Error(data.error ?? 'Registration failed')
      return data.data
    },
    onSuccess: (payload) => {
      if ('token' in payload) setAuth(payload.user, payload.token)
    },
  })
}
