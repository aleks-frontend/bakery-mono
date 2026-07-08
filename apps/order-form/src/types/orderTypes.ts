export interface BreadType {
  id: string
  name: string
  price: number
  available: boolean
}

export interface BreadTypesResponse {
  acceptingOrders: boolean
  data: BreadType[]
}

export interface Customer {
  firstName: string
  lastName: string
  phone: string
  email: string
}

export interface OrderItemPayload {
  breadId: string
  breadName: string
  quantity: number
  unitPrice: number
  total: number
}

export interface OrderPayload {
  customer: Customer
  items: OrderItemPayload[]
  totalPrice: number
  submittedAt: string
  location: string
  remark: string | null
  language: string
}

export interface OrderSubmitResponse {
  ok?: boolean
  [key: string]: unknown
}

export type LocationOption = 'subotica' | 'hajdukovo'

export interface PersistedCustomer {
  firstName: string
  lastName: string
  email: string
  phone: string
  location: string
}
