import { useQuery } from "@tanstack/react-query";
import type { Cycle, CycleSuggestion, StartCycleInput } from "@bakery/schemas";
import type { HttpClient } from "./http.js";

export interface RepeatingOrderCloneResult {
  repeatingOrderId: string;
  orderId?: string;
  errors?: { articleId: string; reason: string }[];
}

export interface StartCycleResult {
  cycle: Cycle;
  repeatingOrdersCloned: RepeatingOrderCloneResult[];
}

export interface CyclesClient {
  current(): Promise<Cycle | null>;
  list(): Promise<Cycle[]>;
  nextSuggestion(): Promise<CycleSuggestion>;
  start(input: StartCycleInput): Promise<StartCycleResult>;
  close(id: string): Promise<Cycle>;
  reopen(id: string): Promise<Cycle>;
  deliver(id: string): Promise<Cycle>;
  undoDeliver(id: string): Promise<Cycle>;
}

export function createCyclesClient(http: HttpClient): CyclesClient {
  return {
    current: () => http.request<Cycle | null>("/api/cycles/current"),
    list: () => http.request<Cycle[]>("/api/cycles"),
    nextSuggestion: () => http.request<CycleSuggestion>("/api/cycles/next-suggestion"),
    start: (input) => http.request<StartCycleResult>("/api/cycles", { method: "POST", body: input }),
    close: (id) => http.request<Cycle>(`/api/cycles/${id}/close`, { method: "PATCH" }),
    reopen: (id) => http.request<Cycle>(`/api/cycles/${id}/reopen`, { method: "PATCH" }),
    deliver: (id) => http.request<Cycle>(`/api/cycles/${id}/deliver`, { method: "PATCH" }),
    undoDeliver: (id) => http.request<Cycle>(`/api/cycles/${id}/undo-deliver`, { method: "PATCH" }),
  };
}

export function useCurrentCycleQuery(client: CyclesClient) {
  return useQuery({ queryKey: ["cycles", "current"], queryFn: client.current });
}

export function useCyclesQuery(client: CyclesClient) {
  return useQuery({ queryKey: ["cycles", "list"], queryFn: client.list });
}

export function useNextCycleSuggestionQuery(client: CyclesClient, enabled: boolean) {
  return useQuery({ queryKey: ["cycles", "next-suggestion"], queryFn: client.nextSuggestion, enabled });
}
