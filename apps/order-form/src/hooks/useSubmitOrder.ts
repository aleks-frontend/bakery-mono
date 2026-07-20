import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import { publicArticlesQueryKey, type CreatePublicOrderInput } from "@bakery/api-client"
import { publicClient } from "@/lib/apiClient"

export function useSubmitOrder() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (input: CreatePublicOrderInput) =>
      toast.promise(publicClient.createOrder(input), {
        loading: t("Submitting order..."),
        success: t("✅ Order submitted successfully!"),
        error: (err) => err.message || t("Failed to submit order. Please try again."),
      }),
    // Ordering reduces remaining per-article capacity for the cycle, so the
    // next articles fetch should reflect updated availability.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: publicArticlesQueryKey }),
  })
}
