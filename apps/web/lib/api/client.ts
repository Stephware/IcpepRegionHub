const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";

const DEFAULT_GET_CACHE_TTL_MS = 15_000;

type ApiErrorBody = {
  message?: string | string[];
  error?: string;
};

type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

const responseCache = new Map<string, CacheEntry>();
const inFlightGets = new Map<string, Promise<unknown>>();
let cacheGeneration = 0;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function requestMethod(init: RequestInit) {
  return (init.method ?? "GET").toUpperCase();
}

function requestUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function canUseClientGetCache(method: string) {
  return method === "GET" && typeof window !== "undefined";
}

async function performFetch<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    let body: ApiErrorBody | null = null;

    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      body = null;
    }

    const message = Array.isArray(body?.message)
      ? body.message.join(", ")
      : body?.message ?? body?.error ?? "Request failed.";

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function clearApiCache() {
  cacheGeneration += 1;
  responseCache.clear();
  inFlightGets.clear();
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const method = requestMethod(init);
  const url = requestUrl(path);
  const cacheableGet = canUseClientGetCache(method);

  if (cacheableGet) {
    const cached = responseCache.get(url);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }

    if (cached) {
      responseCache.delete(url);
    }

    const existingRequest = inFlightGets.get(url);
    if (existingRequest) {
      return existingRequest as Promise<T>;
    }

    const generation = cacheGeneration;
    const request: Promise<T> = performFetch<T>(url, init)
      .then((value) => {
        if (generation === cacheGeneration) {
          responseCache.set(url, {
            expiresAt: Date.now() + DEFAULT_GET_CACHE_TTL_MS,
            value,
          });
        }

        return value;
      })
      .finally(() => {
        if (inFlightGets.get(url) === request) {
          inFlightGets.delete(url);
        }
      });

    inFlightGets.set(url, request);
    return request;
  }

  const result = await performFetch<T>(url, init);

  if (method !== "GET") {
    clearApiCache();
  }

  return result;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}
