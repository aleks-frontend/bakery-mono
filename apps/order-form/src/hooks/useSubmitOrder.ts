import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import {
  publicArticlesQueryKey,
  type CreatePublicOrderInput,
  type HttpError,
  type PublicArticlesResponse,
} from "@bakery/api-client"
import { publicClient } from "@/lib/apiClient"
import { isItemValidationErrors, resolveItemValidationError } from "@/lib/itemValidationErrors"

export function useSubmitOrder() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (input: CreatePublicOrderInput) =>
      toast.promise(publicClient.createOrder(input), {
        loading: t("Submitting order..."),
        success: t("✅ Order submitted successfully!"),
        error: (err: HttpError) => {
          if (isItemValidationErrors(err.details)) {
            // The backend's raw `error` string is untranslated English — build
            // the message entirely client-side from the structured codes instead.
            const articles =
              queryClient.getQueryData<PublicArticlesResponse>(publicArticlesQueryKey)?.articles ?? []
            return err.details
              .map((detail) => resolveItemValidationError(t, detail, articles).toastMessage)
              .join("; ")
          }
          return err.message || t("Failed to submit order. Please try again.")
        },
      }),
    // Ordering reduces remaining per-article capacity for the cycle, so the
    // next articles fetch should reflect updated availability.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: publicArticlesQueryKey }),
  })
}
