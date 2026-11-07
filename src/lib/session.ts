import { ref } from 'vue'
import type { Session } from '@/types'

export const sessionState = ref<Session | null>(null)

export function getSession(): Session | null {
  return sessionState.value
}

export function setSession(session: Session | null) {
  sessionState.value = session
}

export async function bootstrapSession() {
  try {
    const response = await fetch('/api/auth/session', {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) {
      sessionState.value = null
      return
    }
    const data = await response.json() as { session: Session | null }
    sessionState.value = data.session ?? null
  } catch {
    sessionState.value = null
  }
}

export function clearSession() {
  sessionState.value = null
}
