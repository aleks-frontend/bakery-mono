import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import type { UpdateRepeatingOrderInput } from "@bakery/api-client"
import { repeatingOrdersClient } from "@/lib/apiClient"

export function useUpdateRepeatingOrderMutation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRepeatingOrderInput }) =>
      toast.promise(repeatingOrdersClient.update(id, input), {
        loading: t("Saving changes..."),
        success: t("Repeating order updated"),
        error: (err) => err.message || t("Failed to update repeating order"),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["repeating-orders"] }),
  })
}
