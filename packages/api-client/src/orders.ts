import { useQuery } from "@tanstack/react-query";
import type { CreateOrderInput, Order, OrderStatus, UpdateOrderInput } from "@bakery/schemas";
import type { HttpClient } from "./http.js";

export interface OrdersListParams {
  status?: OrderStatus;
  cycleId?: string;
  archived?: boolean;
  search?: string;
  sortBy?: "createdAt" | "totalPrice" | "recipient";
  sortDir?: "asc" | "desc";
}

export interface OrdersClient {
  list(params?: OrdersListParams): Promise<Order[]>;
  get(id: string): Promise<Order>;
  create(input: CreateOrderInput): Promise<Order>;
  update(id: string, input: UpdateOrderInput): Promise<Order>;
  remove(id: string): Promise<void>;
  archive(id: string): Promise<Order>;
  unarchive(id: string): Promise<Order>;
}

function buildQuery(params?: OrdersListParams): string {
  if (!params) return "";
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.cycleId) qs.set("cycleId", params.cycleId);
  if (params.archived !== undefined) qs.set("archived", String(params.archived));
  if (params.search) qs.set("search", params.search);
  if (params.sortBy) qs.set("sortBy", params.sortBy);
  if (params.sortDir) qs.set("sortDir", params.sortDir);
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function createOrdersClient(http: HttpClient): OrdersClient {
  return {
    list: (params) => http.request<Order[]>(`/api/orders${buildQuery(params)}`),
    get: (id) => http.request<Order>(`/api/orders/${id}`),
    create: (input) => http.request<Order>("/api/orders", { method: "POST", body: input }),
    update: (id, input) => http.request<Order>(`/api/orders/${id}`, { method: "PATCH", body: input }),
    remove: (id) => http.request<void>(`/api/orders/${id}`, { method: "DELETE" }),
    archive: (id) => http.request<Order>(`/api/orders/${id}/archive`, { method: "PATCH" }),
    unarchive: (id) => http.request<Order>(`/api/orders/${id}/unarchive`, { method: "PATCH" }),
  };
}

export const ordersQueryKey = (params?: OrdersListParams) => ["orders", params ?? {}] as const;

export function useOrdersQuery(client: OrdersClient, params?: OrdersListParams) {
  return useQuery({ queryKey: ordersQueryKey(params), queryFn: () => client.list(params) });
}
