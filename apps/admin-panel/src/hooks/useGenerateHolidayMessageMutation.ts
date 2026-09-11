import { useMutation } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import type { GenerateHolidayMessageInput } from "@bakery/api-client"
import { cyclesClient } from "@/lib/apiClient"

export function useGenerateHolidayMessageMutation() {
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (input: GenerateHolidayMessageInput) =>
      toast.promise(cyclesClient.generateHolidayMessage(input), {
        loading: t("Generating holiday messages..."),
        success: t("Holiday messages generated"),
        error: (err) => err.message || t("Failed to generate holiday messages"),
      }),
  })
}
