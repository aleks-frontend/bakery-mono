import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import { cyclesClient } from "@/lib/apiClient"

export function useReopenCycleMutation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (id: string) =>
      toast.promise(cyclesClient.reopen(id), {
        loading: t("Reopening ordering..."),
        success: t("Ordering reopened"),
        error: (err) => err.message || t("Failed to reopen ordering"),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cycles"] }),
  })
}
