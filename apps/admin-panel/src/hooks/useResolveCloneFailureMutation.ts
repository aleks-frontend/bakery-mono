import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import { cyclesClient } from "@/lib/apiClient"

// Links a manually-recreated order back to the RepeatingOrderCloneFailure it
// resolves, once OrderFormModal's own create mutation has already succeeded
// (that mutation shows its own "Order created" toast — this one only needs
// to speak up if the follow-up linking call itself fails, since the order
// exists either way and re-submitting would create a duplicate).
export function useResolveCloneFailureMutation(cycleId: string) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: ({ failureId, orderId }: { failureId: string; orderId: string }) =>
      cyclesClient.resolveCloneFailure(cycleId, failureId, orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cycles", "clone-failures", cycleId] })
      queryClient.invalidateQueries({ queryKey: ["cycles", "list"] })
    },
    onError: () => {
      toast.error(
        t("The order was created, but couldn't be marked as resolved here — check the Orders list.")
      )
    },
  })
}
