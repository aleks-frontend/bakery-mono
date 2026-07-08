import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateBreadType, updateBreadTypeAvailability } from "@/lib/api"
import { BreadType } from "@/types/breadType"

export function useUpdateBreadTypeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (breadType: BreadType) => updateBreadType(breadType),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["breadTypes"] }),
  })
}

export function useUpdateBreadTypeAvailabilityMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ids, available }: { ids: string[]; available: boolean }) =>
      updateBreadTypeAvailability(ids, available),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["breadTypes"] }),
  })
}
