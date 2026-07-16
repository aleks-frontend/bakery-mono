import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import { ordersClient } from "@/lib/apiClient"

export function useArchiveOrderMutation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (ids: string[]) =>
      toast.promise(Promise.all(ids.map((id) => ordersClient.archive(id))), {
        loading: t("Archiving..."),
        success: t("Archived"),
        error: (err) => err.message || t("Failed to archive"),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  })
}
