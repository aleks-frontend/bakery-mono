export type LocationOption = 'Hajdukovo' | 'Subotica'

export interface PersistedCustomer {
  recipient: string
  email: string
  phone: string
  location: string
}

/**
 * Display-only shape for the pre-submit confirmation modal — carries article
 * names/prices/totals the API payload (CreatePublicOrderInput) doesn't need,
 * since the backend always re-prices items from the live Article record.
 */
export interface OrderSummaryItem {
  articleId: string
  name: string
  quantity: number
  unitPrice: number
  total: number
}

export interface OrderSummary {
  recipient: string
  phone: string
  email: string | null
  location: string
  remark: string | null
  repeat: boolean
  items: OrderSummaryItem[]
  totalPrice: number
}
