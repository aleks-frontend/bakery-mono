import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import type { CreateOrderInput, HttpError } from "@bakery/api-client"
import { ordersClient } from "@/lib/apiClient"
import { describeItemValidationError, isItemValidationErrors } from "@/lib/itemValidationErrors"

export function useCreateOrderMutation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (input: CreateOrderInput) =>
      toast.promise(ordersClient.create(input), {
        loading: t("Creating order..."),
        success: t("Order created"),
        error: (err: HttpError) =>
          isItemValidationErrors(err.details)
            ? err.details.map((d) => describeItemValidationError(t, d)).join("; ")
            : err.message || t("Failed to create order"),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  })
}
