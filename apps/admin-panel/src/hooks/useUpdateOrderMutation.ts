import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import type { OrderStatus, UpdateOrderInput } from "@bakery/api-client"
import { ordersClient } from "@/lib/apiClient"

export function useUpdateOrderMutation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateOrderInput }) =>
      toast.promise(ordersClient.update(id, input), {
        loading: t("Saving changes..."),
        success: t("Order updated"),
        error: (err) => err.message || t("Failed to update order"),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  })
}

/** Bulk variant: one toast for the whole batch, matching useDeleteOrderMutation/useArchiveOrderMutation. */
export function useBulkUpdateOrderStatusMutation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: OrderStatus }) =>
      toast.promise(Promise.all(ids.map((id) => ordersClient.update(id, { status }))), {
        loading: t("Saving changes..."),
        success: t("Order updated"),
        error: (err) => err.message || t("Failed to update order"),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  })
}
