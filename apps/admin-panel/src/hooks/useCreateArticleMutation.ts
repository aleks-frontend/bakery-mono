import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import type { CreateArticleInput } from "@bakery/api-client"
import { articlesClient } from "@/lib/apiClient"

export function useCreateArticleMutation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (input: CreateArticleInput) =>
      toast.promise(articlesClient.create(input), {
        loading: t("Creating article..."),
        success: t("Article created"),
        error: (err) => err.message || t("Failed to create article"),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["articles"] }),
  })
}
