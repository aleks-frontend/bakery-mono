import { useQuery } from "@tanstack/react-query";
import type { CreatePublicOrderInput, Order, PublicArticlesResponse } from "@bakery/schemas";
import type { HttpClient } from "./http.js";

export interface PublicClient {
  getArticles(): Promise<PublicArticlesResponse>;
  createOrder(input: CreatePublicOrderInput): Promise<Order>;
}

export function createPublicClient(http: HttpClient): PublicClient {
  return {
    getArticles: () => http.request<PublicArticlesResponse>("/api/public/articles"),
    createOrder: (input) => http.request<Order>("/api/public/orders", { method: "POST", body: input }),
  };
}

export const publicArticlesQueryKey = ["public-articles"] as const;

export function usePublicArticlesQuery(client: PublicClient) {
  return useQuery({ queryKey: publicArticlesQueryKey, queryFn: client.getArticles });
}
