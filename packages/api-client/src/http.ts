export interface HttpError extends Error {
  status: number;
  details?: unknown;
}

export interface HttpClient {
  request<T>(path: string, options?: { method?: string; body?: unknown }): Promise<T>;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

/**
 * Backend Zod schemas type dates as `Date` (via z.coerce.date()), but a plain
 * `response.json()` leaves them as ISO strings — this reviver converts them
 * back to real Date objects so the frontend Order/Cycle/etc. types aren't a
 * lie about what's actually in memory.
 */
function reviveDates(_key: string, value: unknown): unknown {
  return typeof value === "string" && ISO_DATE_RE.test(value) ? new Date(value) : value;
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

    const text = await response.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text, reviveDates) : undefined;
    } catch {
      data = undefined;
    }

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
