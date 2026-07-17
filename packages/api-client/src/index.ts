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
export { createOrdersClient, useOrdersQuery, ordersQueryKey } from "./orders.js";
export type { OrdersClient, OrdersListParams } from "./orders.js";
export {
  createCyclesClient,
  useCurrentCycleQuery,
  useCyclesQuery,
  useNextCycleSuggestionQuery,
} from "./cycles.js";
export type { CyclesClient, RepeatingOrderCloneResult, StartCycleResult } from "./cycles.js";
export {
  createRepeatingOrdersClient,
  useRepeatingOrdersQuery,
  repeatingOrdersQueryKey,
} from "./repeatingOrders.js";
export type { RepeatingOrdersClient } from "./repeatingOrders.js";
export type { Article, ArticleWithAvailability, CreateArticleInput, UpdateArticleInput } from "@bakery/schemas";
export type {
  Order,
  OrderItem,
  OrderStatus,
  CreateOrderInput,
  UpdateOrderInput,
} from "@bakery/schemas";
export type { Cycle, CycleStatus, CycleSuggestion, StartCycleInput } from "@bakery/schemas";
export type {
  RepeatingOrder,
  RepeatingOrderItem,
  CreateRepeatingOrderInput,
  UpdateRepeatingOrderInput,
} from "@bakery/schemas";
