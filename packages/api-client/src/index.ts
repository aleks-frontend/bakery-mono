export const API_BASE_URL_ENV_VAR = "VITE_API_BASE_URL";

export { createBakeryAuthClient } from "./authClient.js";
export { createHttpClient } from "./http.js";
export type { HttpClient, HttpError } from "./http.js";
export {
  createArticlesClient,
  useArticlesQuery,
  useCreateArticleMutation,
  useUpdateArticleMutation,
  useDeleteArticleMutation,
  useUpdateArticleAvailabilityMutation,
} from "./articles.js";
export type { ArticlesClient } from "./articles.js";
export type { Article, ArticleWithAvailability, CreateArticleInput, UpdateArticleInput } from "@bakery/schemas";
