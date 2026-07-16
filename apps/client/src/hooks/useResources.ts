import type { ApiResponse, Resource, ResourceInput } from '@studyou/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface ResourceFilters {
  search: string
  category: string
  sort: 'cost' | 'deadline' | 'updated' | 'title'
  order: 'asc' | 'desc'
}

export function useResources(filters: ResourceFilters) {
  return useQuery({
    queryKey: ['resources', filters],
    queryFn: async () => {
      const params: Record<string, string> = { sort: filters.sort, order: filters.order }
      if (filters.search) params.search = filters.search
      if (filters.category) params.category = filters.category
      const { data } = await api.get<ApiResponse<Resource[]>>('/resources', { params })
      return data.data ?? []
    },
    placeholderData: (previous) => previous,
  })
}

export function useSaveResource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: ResourceInput & { id?: string }) => {
      const { id, ...body } = input
      const { data } = id
        ? await api.put<ApiResponse<Resource>>(`/resources/${id}`, body)
        : await api.post<ApiResponse<Resource>>('/resources', body)
      if (!data.data) throw new Error(data.error ?? 'Failed to save resource')
      return data.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resources'] }),
  })
}

export function useDeleteResource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/resources/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resources'] }),
  })
}
