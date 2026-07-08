import { useQuery } from "@tanstack/react-query"
import { fetchBreadTypes } from "@/lib/api"

export function useBreadTypesQuery() {
  return useQuery({
    queryKey: ["breadTypes"],
    queryFn: fetchBreadTypes,
    staleTime: 5 * 60 * 1000,
  })
}
