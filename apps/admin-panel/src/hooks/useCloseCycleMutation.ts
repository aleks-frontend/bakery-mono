import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import type { CloseCycleInput } from "@bakery/api-client"
import { cyclesClient } from "@/lib/apiClient"

export function useCloseCycleMutation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CloseCycleInput }) =>
      toast.promise(cyclesClient.close(id, input), {
        loading: t("Closing ordering..."),
        success: t("Ordering closed"),
        error: (err) => err.message || t("Failed to close ordering"),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cycles"] }),
  })
}
