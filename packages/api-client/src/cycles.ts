import { useQuery } from "@tanstack/react-query";
import type { Cycle } from "@bakery/schemas";
import type { HttpClient } from "./http.js";

export interface CyclesClient {
  current(): Promise<Cycle | null>;
}

export function createCyclesClient(http: HttpClient): CyclesClient {
  return {
    current: () => http.request<Cycle | null>("/api/cycles/current"),
  };
}

export function useCurrentCycleQuery(client: CyclesClient) {
  return useQuery({ queryKey: ["cycles", "current"], queryFn: client.current });
}
