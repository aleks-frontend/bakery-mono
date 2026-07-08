import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createBreadType } from "@/lib/api"

export function useCreateBreadTypeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createBreadType,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["breadTypes"] }),
  })
}
