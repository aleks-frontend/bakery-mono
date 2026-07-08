import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteBreadTypes } from "@/lib/api"

export function useDeleteBreadTypesMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => deleteBreadTypes(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["breadTypes"] }),
  })
}
