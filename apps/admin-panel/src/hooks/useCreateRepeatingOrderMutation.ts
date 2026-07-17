import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import type { CreateRepeatingOrderInput } from "@bakery/api-client"
import { repeatingOrdersClient } from "@/lib/apiClient"

export function useCreateRepeatingOrderMutation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (input: CreateRepeatingOrderInput) =>
      toast.promise(repeatingOrdersClient.create(input), {
        loading: t("Creating repeating order..."),
        success: t("Repeating order created"),
        error: (err) => err.message || t("Failed to create repeating order"),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["repeating-orders"] }),
  })
}
