import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import { ordersClient } from "@/lib/apiClient"

export function useMakeRepeatingMutation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (id: string) =>
      toast.promise(ordersClient.makeRepeating(id), {
        loading: t("Making repeating..."),
        success: t("Order marked as repeating"),
        error: (err) => err.message || t("Failed to make repeating"),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({ queryKey: ["repeating-orders"] })
    },
  })
}
