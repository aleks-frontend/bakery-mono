import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import type { StartCycleInput } from "@bakery/api-client"
import { cyclesClient } from "@/lib/apiClient"

export function useStartCycleMutation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (input: StartCycleInput) =>
      toast.promise(cyclesClient.start(input), {
        loading: t("Starting cycle..."),
        success: t("Cycle started"),
        error: (err) => err.message || t("Failed to start cycle"),
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["cycles"] })
      queryClient.invalidateQueries({ queryKey: ["orders"] })

      const failed = result.repeatingOrdersCloned.filter((r) => r.errors)
      if (failed.length > 0) {
        toast.error(
          t("{{count}} repeating order(s) couldn't be added — review them on the Cycles page", {
            count: failed.length,
          })
        )
      }
    },
  })
}
