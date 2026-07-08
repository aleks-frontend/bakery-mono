import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteOrders } from "@/lib/api"

export function useDeleteOrdersMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteOrders,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  })
}
