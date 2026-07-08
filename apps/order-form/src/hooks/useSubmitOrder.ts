import { useMutation } from '@tanstack/react-query'
import { submitOrder } from '@/services/api'
import type { OrderPayload, OrderSubmitResponse } from '@/types/orderTypes'
import { orderSubmitResponseSchema } from '@/schemas/orderSchemas'

export interface UseSubmitOrderOptions {
  onSuccess?: () => void
  onError?: (message: string) => void
}

export function useSubmitOrder(options: UseSubmitOrderOptions = {}) {
  const mutation = useMutation({
    mutationFn: async (payload: OrderPayload): Promise<OrderSubmitResponse> => {
      const res = await submitOrder(payload)
      const parsed = orderSubmitResponseSchema.safeParse(res)
      if (!parsed.success) {
        throw new Error('Invalid submit response')
      }
      return res
    },
    onSuccess: options.onSuccess,
    onError: (error: Error) => {
      const message = error?.message ?? 'An error occurred. Please try again.'
      options.onError?.(message)
    },
  })

  return {
    submitOrder: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}
