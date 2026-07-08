import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createManualOrder, ManualOrderPayload } from "@/lib/api"

export function useCreateManualOrderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ManualOrderPayload) => createManualOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
    },
  })
}
