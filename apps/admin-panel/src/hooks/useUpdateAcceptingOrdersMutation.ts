import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateAcceptingOrders } from "@/lib/api"

export function useUpdateAcceptingOrdersMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (acceptingOrders: boolean) => updateAcceptingOrders(acceptingOrders),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["breadTypes"] }),
  })
}
