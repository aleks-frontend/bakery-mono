import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import { cyclesClient } from "@/lib/apiClient"

// Dismisses a failed repeating order without creating a replacement order —
// unlike useResolveCloneFailureMutation, this is the primary action itself
// (not a follow-up link-back after OrderFormModal already toasted success),
// so it gets the standard toast.promise pending/success/error feedback.
export function useRejectCloneFailureMutation(cycleId: string) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (failureId: string) =>
      toast.promise(cyclesClient.rejectCloneFailure(cycleId, failureId), {
        loading: t("Rejecting order..."),
        success: t("Repeating order rejected"),
        error: t("Failed to reject order"),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cycles", "clone-failures", cycleId] })
      queryClient.invalidateQueries({ queryKey: ["cycles", "list"] })
    },
  })
}
