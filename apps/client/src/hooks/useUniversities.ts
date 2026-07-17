import type { ApiResponse, University } from '@studyou/types'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface UniversityFilters {
  search: string
  regions: string[]
  russellGroup: boolean
  sort: 'rank' | 'name'
}

export function useUniversities(filters: UniversityFilters) {
  return useQuery({
    queryKey: ['universities', filters],
    queryFn: async () => {
      const params: Record<string, string> = { sort: filters.sort }
      if (filters.search) params.search = filters.search
      if (filters.regions.length > 0) params.regions = filters.regions.join(',')
      if (filters.russellGroup) params.russellGroup = 'true'
      const { data } = await api.get<ApiResponse<University[]>>('/universities', { params })
      return data.data ?? []
    },
    placeholderData: (previous) => previous,
    staleTime: 5 * 60_000,
  })
}
