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

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth)
  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      const { data } = await api.post<ApiResponse<AuthPayload>>('/auth/register', input)
      if (!data.data) throw new Error(data.error ?? 'Registration failed')
      return data.data
    },
    onSuccess: (payload) => setAuth(payload.user, payload.token),
  })
}
