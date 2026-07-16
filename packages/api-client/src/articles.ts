import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Article, ArticleWithAvailability, CreateArticleInput, UpdateArticleInput } from "@bakery/schemas";
import type { HttpClient } from "./http.js";

export interface ArticlesClient {
  list(): Promise<ArticleWithAvailability[]>;
  create(input: CreateArticleInput): Promise<Article>;
  update(id: string, input: UpdateArticleInput): Promise<Article>;
  remove(id: string): Promise<void>;
}

export function createArticlesClient(http: HttpClient): ArticlesClient {
  return {
    list: () => http.request<ArticleWithAvailability[]>("/api/articles"),
    create: (input) => http.request<Article>("/api/articles", { method: "POST", body: input }),
    update: (id, input) => http.request<Article>(`/api/articles/${id}`, { method: "PATCH", body: input }),
    remove: (id) => http.request<void>(`/api/articles/${id}`, { method: "DELETE" }),
  };
}

const articlesQueryKey = ["articles"] as const;

export function useArticlesQuery(client: ArticlesClient) {
  return useQuery({ queryKey: articlesQueryKey, queryFn: client.list });
}

export function useCreateArticleMutation(client: ArticlesClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateArticleInput) => client.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: articlesQueryKey }),
  });
}

export function useUpdateArticleMutation(client: ArticlesClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateArticleInput }) => client.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: articlesQueryKey }),
  });
}

export function useDeleteArticleMutation(client: ArticlesClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: articlesQueryKey }),
  });
}

export function useUpdateArticleAvailabilityMutation(client: ArticlesClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, available }: { ids: string[]; available: boolean }) =>
      Promise.all(ids.map((id) => client.update(id, { available }))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: articlesQueryKey }),
  });
}
