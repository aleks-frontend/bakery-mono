import { useMutation, useQueryClient } from "@tanstack/react-query"
import { archiveOrders } from "@/lib/api"

export function useArchiveOrdersMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: archiveOrders,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  })
}
