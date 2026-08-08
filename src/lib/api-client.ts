import type { ApiResponse } from '@/types';

export class ApiError extends Error {
  code: string;
  details?: Record<string, string[]>;

  constructor(code: string, message: string, details?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Тонкий клиент демо-API: разворачивает конверт { ok, data } и бросает ApiError.
 * Все клиентские запросы идут через него — единая обработка ошибок.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError('NETWORK_ERROR', 'Сервис временно недоступен. Попробуйте позже');
  }

  if (!payload || !payload.ok) {
    const error = payload && !payload.ok ? payload.error : null;
    throw new ApiError(
      error?.code ?? 'UNKNOWN',
      error?.message ?? 'Что-то пошло не так',
      error?.details,
    );
  }

  return payload.data;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
};

/** Ключи кэша TanStack Query — собраны в одном месте, чтобы не расходились. */
export const queryKeys = {
  venues: (search: string) => ['venues', search] as const,
  venue: (slug: string) => ['venue', slug] as const,
  catalogMeta: () => ['catalog-meta'] as const,
  suggestions: (query: string) => ['suggestions', query] as const,
  availability: (venueId: string, date: string) => ['availability', venueId, date] as const,
  availabilityRange: (venueId: string) => ['availability-range', venueId] as const,
  favorites: () => ['favorites'] as const,
  notifications: () => ['notifications'] as const,
  aiRecommendation: () => ['ai-recommendation'] as const,
};
