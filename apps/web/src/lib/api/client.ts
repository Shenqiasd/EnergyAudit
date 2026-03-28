const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

interface RequestOptions extends Omit<RequestInit, "method" | "body"> {
  params?: Record<string, string>;
}

interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}

class ApiClientError extends Error {
  status: number;
  details?: unknown;

  constructor({ status, message, details }: ApiError) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};

  try {
    const token = localStorage.getItem("energy_audit_token");
    if (token) {
      return {
        Authorization: `Bearer ${token}`,
      };
    }

    // Fallback to dev mode headers if no JWT token
    const stored = localStorage.getItem("energy_audit_user");
    if (stored) {
      const user = JSON.parse(stored);
      return {
        "X-User-Id": user.id || "",
        "X-User-Role": user.role || "",
      };
    }
  } catch {
    // ignore
  }
  return {};
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const { params, headers: extraHeaders, ...rest } = options;

  let url = `${BASE_URL}${path}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
    ...(extraHeaders as Record<string, string>),
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    ...rest,
  });

  if (!res.ok) {
    let details: unknown;
    try {
      details = await res.json();
    } catch {
      // ignore
    }
    throw new ApiClientError({
      status: res.status,
      message: `请求失败: ${res.status} ${res.statusText}`,
      details,
    });
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>("GET", path, undefined, options),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, body, options),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, body, options),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, undefined, options),
};

export { ApiClientError, getAuthHeaders };
export type { ApiError };
