import { clearSession } from '@/lib/session'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  })

  if (response.status === 401) clearSession()

  const data = await response.json().catch(() => null) as { error?: string } | null
  if (!response.ok) {
    throw new ApiError(data?.error ?? `API error ${response.status}`, response.status)
  }
  return data as T
}

export function apiUrl(path: string) {
  return `${API_BASE}${path}`
}
