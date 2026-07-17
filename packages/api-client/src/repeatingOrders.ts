import { useQuery } from "@tanstack/react-query";
import type { CreateRepeatingOrderInput, RepeatingOrder, UpdateRepeatingOrderInput } from "@bakery/schemas";
import type { HttpClient } from "./http.js";

export interface RepeatingOrdersClient {
  list(): Promise<RepeatingOrder[]>;
  get(id: string): Promise<RepeatingOrder>;
  create(input: CreateRepeatingOrderInput): Promise<RepeatingOrder>;
  update(id: string, input: UpdateRepeatingOrderInput): Promise<RepeatingOrder>;
  remove(id: string): Promise<void>;
}

export function createRepeatingOrdersClient(http: HttpClient): RepeatingOrdersClient {
  return {
    list: () => http.request<RepeatingOrder[]>("/api/repeating-orders"),
    get: (id) => http.request<RepeatingOrder>(`/api/repeating-orders/${id}`),
    create: (input) => http.request<RepeatingOrder>("/api/repeating-orders", { method: "POST", body: input }),
    update: (id, input) =>
      http.request<RepeatingOrder>(`/api/repeating-orders/${id}`, { method: "PATCH", body: input }),
    remove: (id) => http.request<void>(`/api/repeating-orders/${id}`, { method: "DELETE" }),
  };
}

export const repeatingOrdersQueryKey = ["repeating-orders"] as const;

export function useRepeatingOrdersQuery(client: RepeatingOrdersClient) {
  return useQuery({ queryKey: repeatingOrdersQueryKey, queryFn: client.list });
}
