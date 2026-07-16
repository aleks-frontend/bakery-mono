import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import { cyclesClient } from "@/lib/apiClient"

export function useCloseCycleMutation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (id: string) =>
      toast.promise(cyclesClient.close(id), {
        loading: t("Closing ordering..."),
        success: t("Ordering closed"),
        error: (err) => err.message || t("Failed to close ordering"),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cycles"] }),
  })
}
