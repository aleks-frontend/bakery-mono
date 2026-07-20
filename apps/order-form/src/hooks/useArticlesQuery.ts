import { usePublicArticlesQuery } from "@bakery/api-client"
import { publicClient } from "@/lib/apiClient"

export function useArticlesQuery() {
  return usePublicArticlesQuery(publicClient)
}
