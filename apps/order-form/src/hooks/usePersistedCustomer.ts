import { useCallback } from 'react'
import type { PersistedCustomer } from '@/types/orderTypes'

const STORAGE_KEY = 'bakery-order'

export function usePersistedCustomer() {
  const load = useCallback((): Partial<PersistedCustomer> | null => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const parsed: unknown = JSON.parse(raw)
      if (parsed === null || typeof parsed !== 'object') return null
      const obj = parsed as Record<string, unknown>
      return {
        recipient: typeof obj.recipient === 'string' ? obj.recipient : undefined,
        email: typeof obj.email === 'string' ? obj.email : undefined,
        phone: typeof obj.phone === 'string' ? obj.phone : undefined,
        location: typeof obj.location === 'string' ? obj.location : undefined,
      }
    } catch {
      return null
    }
  }, [])

  const save = useCallback((data: PersistedCustomer) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // ignore
    }
  }, [])

  return { load, save }
}
