import { useQuery } from "@tanstack/react-query"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001"

async function fetchBackendHealth(): Promise<{ status: string }> {
  const response = await fetch(`${BACKEND_URL}/health`)

  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export function useBackendHealth() {
  return useQuery({
    queryKey: ["backendHealth"],
    queryFn: fetchBackendHealth,
    retry: false,
    refetchInterval: 15000,
  })
}
