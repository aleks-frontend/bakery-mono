import { useQuery } from '@tanstack/react-query'
import { fetchBreadTypes } from '@/services/api'
import type { BreadType } from '@/types/orderTypes'

const FALLBACK_BREAD_TYPES: BreadType[] = [
  { id: 'white_500', name: 'White bread 500g', price: 120, available: true },
  { id: 'rye_700', name: 'Rye bread 700g', price: 180, available: true },
]

export function useBreadTypes() {
  const query = useQuery({
    queryKey: ['breadTypes'],
    queryFn: fetchBreadTypes,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  const acceptingOrders = query.isError ? true : (query.data?.acceptingOrders ?? true)
  const rawBreadTypes: BreadType[] =
    query.data?.data ?? (query.isError ? FALLBACK_BREAD_TYPES : [])
  const breadTypes = rawBreadTypes.filter((b) => b.available)

  return {
    breadTypes,
    acceptingOrders,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
