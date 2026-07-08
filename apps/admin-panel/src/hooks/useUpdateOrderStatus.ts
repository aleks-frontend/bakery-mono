import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateOrderStatus, updateOrdersStatusBatch, StatusUpdate } from "@/lib/api"
import { OrderStatus } from "@/types/order"

export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, newStatus }: { orderId: string; newStatus: OrderStatus }) =>
      updateOrderStatus(orderId, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
    },
  })
}

export function useUpdateOrdersStatusBatchMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updates: StatusUpdate[]) => updateOrdersStatusBatch(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
    },
  })
}
