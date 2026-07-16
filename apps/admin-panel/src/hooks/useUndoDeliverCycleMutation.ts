import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import { cyclesClient } from "@/lib/apiClient"

export function useUndoDeliverCycleMutation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (id: string) =>
      toast.promise(cyclesClient.undoDeliver(id), {
        loading: t("Undoing delivery mark..."),
        success: t("Delivery mark undone"),
        error: (err) => err.message || t("Failed to undo delivery mark"),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cycles"] }),
  })
}
