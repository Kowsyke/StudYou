import type { AdminAnalytics, ApiResponse, Category, Country, RegionCost } from '@studyou/types'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useCountries() {
  return useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Country[]>>('/meta/countries')
      return data.data ?? []
    },
    staleTime: Number.POSITIVE_INFINITY,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Category[]>>('/meta/categories')
      return data.data ?? []
    },
    staleTime: Number.POSITIVE_INFINITY,
  })
}

export function useAnalytics(enabled: boolean) {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AdminAnalytics>>('/admin/analytics')
      if (!data.data) throw new Error(data.error ?? 'Failed to load analytics')
      return data.data
    },
    enabled,
  })
}

export function useRegionCosts() {
  return useQuery({
    queryKey: ['region-costs'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<RegionCost[]>>('/meta/region-costs')
      return data.data ?? []
    },
    staleTime: Number.POSITIVE_INFINITY,
  })
}
