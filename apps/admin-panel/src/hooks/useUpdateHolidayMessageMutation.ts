import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import type { UpdateHolidayMessageInput } from "@bakery/api-client"
import { cyclesClient } from "@/lib/apiClient"

export function useUpdateHolidayMessageMutation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateHolidayMessageInput }) =>
      toast.promise(cyclesClient.updateHolidayMessage(id, input), {
        loading: t("Saving holiday message..."),
        success: t("Holiday message saved"),
        error: (err) => err.message || t("Failed to save holiday message"),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cycles"] }),
  })
}
