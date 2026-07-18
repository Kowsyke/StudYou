import type { AdminNote, AdminUser, ApiResponse, BugReport, ReportStatus } from '@studyou/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useAdminUsers(enabled: boolean) {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AdminUser[]>>('/admin/users')
      return data.data ?? []
    },
    enabled,
  })
}

export function useSetSuspended() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; suspended: boolean }) => {
      const { data } = await api.patch<ApiResponse<{ id: string; suspended: boolean }>>(
        `/admin/users/${input.id}`,
        { suspended: input.suspended },
      )
      if (!data.data) throw new Error(data.error ?? 'Failed to update user')
      return data.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })
}

export function useAdminReports(enabled: boolean) {
  return useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<BugReport[]>>('/admin/reports')
      return data.data ?? []
    },
    enabled,
  })
}

export function useUpdateReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; status?: ReportStatus; adminNote?: string | null }) => {
      const { id, ...body } = input
      await api.patch(`/admin/reports/${id}`, body)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reports'] }),
  })
}

export function useSubmitReport() {
  return useMutation({
    mutationFn: async (input: { category: string; message: string; pagePath?: string }) => {
      const { data } = await api.post<ApiResponse<{ received: true }>>('/reports', input)
      if (!data.data) throw new Error(data.error ?? 'Failed to send report')
      return data.data
    },
  })
}

export function useAdminNotes() {
  return useQuery({
    queryKey: ['admin-notes'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AdminNote[]>>('/admin/notes')
      return data.data ?? []
    },
  })
}

export function useCreateAdminNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      title: string
      content: string
      priority: 'low' | 'medium' | 'high'
      category: 'bug' | 'feature' | 'data' | 'general'
      author: string
    }) => {
      const { data } = await api.post<ApiResponse<AdminNote>>('/admin/notes', input)
      if (!data.data) throw new Error(data.error ?? 'Failed to create note')
      return data.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-notes'] }),
  })
}

export function useDeleteAdminNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/notes/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-notes'] }),
  })
}
