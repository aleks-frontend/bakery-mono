import { useArticlesQuery as useArticlesQueryBase } from "@bakery/api-client"
import { articlesClient } from "@/lib/apiClient"

export function useArticlesQuery() {
  return useArticlesQueryBase(articlesClient)
}
