import type { ApiResponse, JourneyOverview, TaskStatus } from '@studyou/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { api } from '../lib/api'

export const journeyKey = ['journey'] as const

export function useJourney() {
  return useQuery({
    queryKey: journeyKey,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<JourneyOverview>>('/journey')
      if (!data.data) throw new Error(data.error ?? 'Failed to load journey')
      return data.data
    },
    retry: (failureCount, error) => {
      if (isAxiosError(error) && error.response?.status === 404) return false
      return failureCount < 2
    },
  })
}

export function hasNoJourney(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404
}

interface CreateJourneyInput {
  intakeDate: string
  courseLevel: string
  budgetPence: number
  major?: string
  regions?: string[]
  educationCompleted?: string
}

export function useCreateJourney() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateJourneyInput) => {
      const { data } = await api.post<ApiResponse<JourneyOverview>>('/journey', input)
      if (!data.data) throw new Error(data.error ?? 'Failed to create journey')
      return data.data
    },
    onSuccess: (overview) => queryClient.setQueryData(journeyKey, overview),
  })
}

export interface UpdateSettingsInput {
  intakeDate?: string
  budgetPence?: number
  originCountryCode?: string | null
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateSettingsInput) => {
      const { data } = await api.patch<ApiResponse<JourneyOverview>>('/journey/settings', input)
      if (!data.data) throw new Error(data.error ?? 'Failed to save settings')
      return data.data
    },
    onSuccess: (overview) => queryClient.setQueryData(journeyKey, overview),
  })
}

export function useToggleTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { taskId: string; status: TaskStatus }) => {
      const { data } = await api.patch<ApiResponse<JourneyOverview>>(
        `/journey/tasks/${input.taskId}`,
        { status: input.status },
      )
      if (!data.data) throw new Error(data.error ?? 'Failed to update task')
      return data.data
    },
    onSuccess: (overview) => queryClient.setQueryData(journeyKey, overview),
  })
}
