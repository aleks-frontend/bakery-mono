import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import { cyclesClient } from "@/lib/apiClient"

export function useDeliverCycleMutation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (id: string) =>
      toast.promise(cyclesClient.deliver(id), {
        loading: t("Marking as delivered..."),
        success: t("Cycle marked as delivered"),
        error: (err) => err.message || t("Failed to mark as delivered"),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cycles"] }),
  })
}
