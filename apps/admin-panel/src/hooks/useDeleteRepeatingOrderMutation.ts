import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import { repeatingOrdersClient } from "@/lib/apiClient"

export function useDeleteRepeatingOrderMutation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (ids: string[]) =>
      toast.promise(Promise.all(ids.map((id) => repeatingOrdersClient.remove(id))), {
        loading: t("Deleting..."),
        success: t("Deleted"),
        error: (err) => err.message || t("Failed to delete"),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repeating-orders"] })
      // Deleting a RepeatingOrder always SET NULLs Order.repeatingOrderId on any
      // orders that referenced it (DB-level FK), so the Orders table/badges need
      // a refetch too, regardless of which page triggered the delete.
      queryClient.invalidateQueries({ queryKey: ["orders"] })
    },
  })
}
