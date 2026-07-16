import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import type { UpdateArticleInput } from "@bakery/api-client"
import { articlesClient } from "@/lib/apiClient"

export function useUpdateArticleMutation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateArticleInput }) =>
      toast.promise(articlesClient.update(id, input), {
        loading: t("Saving changes..."),
        success: t("Article updated"),
        error: (err) => err.message || t("Failed to update article"),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["articles"] }),
  })
}

export function useUpdateArticleAvailabilityMutation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: ({ ids, available }: { ids: string[]; available: boolean }) =>
      toast.promise(Promise.all(ids.map((id) => articlesClient.update(id, { available }))), {
        loading: t("Updating availability..."),
        success: t("Availability updated"),
        error: (err) => err.message || t("Failed to update availability"),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["articles"] }),
  })
}
