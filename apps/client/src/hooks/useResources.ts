import type { ApiResponse, Resource, ResourceInput } from '@studyou/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface ResourceFilters {
  search: string
  category: string
  sort: 'cost' | 'deadline' | 'updated' | 'title'
  order: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface ResourcePagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type ResourceListWithPagination = Resource[] & {
  pagination?: ResourcePagination
}

export function useResources(filters: ResourceFilters) {
  return useQuery({
    queryKey: ['resources', filters],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        sort: filters.sort,
        order: filters.order,
        page: filters.page ?? 1,
        limit: filters.limit ?? 50,
      }
      if (filters.search) params.search = filters.search
      if (filters.category) params.category = filters.category
      const { data } = await api.get<ApiResponse<Resource[]> & { pagination?: ResourcePagination }>(
        '/resources',
        { params },
      )
      const items = (data.data ?? []) as ResourceListWithPagination
      if (data.pagination) {
        items.pagination = data.pagination
      }
      return items
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
