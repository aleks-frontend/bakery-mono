export interface HttpError extends Error {
  status: number;
  details?: unknown;
}

export interface HttpClient {
  request<T>(path: string, options?: { method?: string; body?: unknown }): Promise<T>;
}

/**
 * Thin fetch wrapper for the bakery backend. Always sends credentials since
 * Better Auth sessions are cookie-based and the frontends run on a different
 * origin/port than the backend in dev.
 */
export function createHttpClient(baseURL: string): HttpClient {
  async function request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
    const response = await fetch(`${baseURL}${path}`, {
      method: options.method ?? "GET",
      credentials: "include",
      headers: options.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    const data: unknown = await response.json().catch(() => undefined);

    if (!response.ok) {
      const message =
        data && typeof data === "object" && "error" in data && typeof (data as { error?: unknown }).error === "string"
          ? (data as { error: string }).error
          : `Request failed: ${response.status}`;
      const error = new Error(message) as HttpError;
      error.status = response.status;
      error.details = data;
      throw error;
    }

    return data as T;
  }

  return { request };
}
