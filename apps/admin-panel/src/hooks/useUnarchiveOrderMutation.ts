import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import { ordersClient } from "@/lib/apiClient"

export function useUnarchiveOrderMutation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (ids: string[]) =>
      toast.promise(Promise.all(ids.map((id) => ordersClient.unarchive(id))), {
        loading: t("Unarchiving..."),
        success: t("Unarchived"),
        error: (err) => err.message || t("Failed to unarchive"),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  })
}
