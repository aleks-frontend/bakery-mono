import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import { articlesClient } from "@/lib/apiClient"

export function useDeleteArticleMutation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (ids: string[]) =>
      toast.promise(Promise.all(ids.map((id) => articlesClient.remove(id))), {
        loading: t("Deleting..."),
        success: t("Deleted"),
        error: (err) => err.message || t("Failed to delete"),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["articles"] }),
  })
}
