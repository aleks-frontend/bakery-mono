import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type {
  CreateOrderInput,
  Order,
  OrderListResponse,
  OrderPageSize,
  OrderStatus,
  RepeatingOrder,
  UpdateOrderInput,
} from "@bakery/schemas";
import type { HttpClient } from "./http.js";

export interface OrdersListParams {
  status?: OrderStatus;
  cycleId?: string;
  archived?: boolean;
  hasRemark?: boolean;
  search?: string;
  sortBy?: "createdAt" | "totalPrice" | "recipient";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: OrderPageSize;
  /** Bypasses page/pageSize and returns every order matching the other filters. */
  all?: boolean;
}

export interface OrdersClient {
  list(params?: OrdersListParams): Promise<OrderListResponse>;
  get(id: string): Promise<Order>;
  create(input: CreateOrderInput): Promise<Order>;
  update(id: string, input: UpdateOrderInput): Promise<Order>;
  remove(id: string): Promise<void>;
  archive(id: string): Promise<Order>;
  unarchive(id: string): Promise<Order>;
  makeRepeating(id: string): Promise<RepeatingOrder>;
}

function buildQuery(params?: OrdersListParams): string {
  if (!params) return "";
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.cycleId) qs.set("cycleId", params.cycleId);
  if (params.archived !== undefined) qs.set("archived", String(params.archived));
  if (params.hasRemark) qs.set("hasRemark", String(params.hasRemark));
  if (params.search) qs.set("search", params.search);
  if (params.sortBy) qs.set("sortBy", params.sortBy);
  if (params.sortDir) qs.set("sortDir", params.sortDir);
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params.all) qs.set("all", String(params.all));
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function createOrdersClient(http: HttpClient): OrdersClient {
  return {
    list: (params) => http.request<OrderListResponse>(`/api/orders${buildQuery(params)}`),
    get: (id) => http.request<Order>(`/api/orders/${encodeURIComponent(id)}`),
    create: (input) => http.request<Order>("/api/orders", { method: "POST", body: input }),
    update: (id, input) =>
      http.request<Order>(`/api/orders/${encodeURIComponent(id)}`, { method: "PATCH", body: input }),
    remove: (id) => http.request<void>(`/api/orders/${encodeURIComponent(id)}`, { method: "DELETE" }),
    archive: (id) => http.request<Order>(`/api/orders/${encodeURIComponent(id)}/archive`, { method: "PATCH" }),
    unarchive: (id) => http.request<Order>(`/api/orders/${encodeURIComponent(id)}/unarchive`, { method: "PATCH" }),
    makeRepeating: (id) =>
      http.request<RepeatingOrder>(`/api/orders/${encodeURIComponent(id)}/make-repeating`, { method: "POST" }),
  };
}

export const ordersQueryKey = (params?: OrdersListParams) => ["orders", params ?? {}] as const;

export function useOrdersQuery(client: OrdersClient, params?: OrdersListParams) {
  return useQuery({
    queryKey: ordersQueryKey(params),
    queryFn: () => client.list(params),
    // search/filter/sort/page are all baked into the query key, so every
    // keystroke in the search box produces a brand-new key. Without this,
    // each new key starts from `status: 'pending'` (isLoading: true) until
    // it resolves — and OrdersPage early-returns a loading screen while
    // isLoading is true, unmounting (and thus un-focusing) the search input
    // on every keystroke. Keeping the previous page's data visible during
    // the refetch keeps isLoading false after the first load.
    placeholderData: keepPreviousData,
  });
}

export const orderQueryKey = (id?: string) => ["order", id ?? ""] as const;

/** Fetches a single order by id regardless of any list's filters/pagination —
 * used to resolve a deep-linked order (e.g. from a Telegram notification link)
 * that may not be present on whatever page/filter the orders list currently has. */
export function useOrderQuery(client: OrdersClient, id: string | undefined) {
  return useQuery({
    queryKey: orderQueryKey(id),
    queryFn: () => client.get(id!),
    enabled: !!id,
  });
}
