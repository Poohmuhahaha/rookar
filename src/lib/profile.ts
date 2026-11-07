import { computed, ref, watch } from 'vue'
import { getSession, setSession } from './session'
import { apiFetch } from './api/client'
import type { Session } from '@/types'

const avatarOverride = ref<string | null>(null)
export const profileAvatar = computed(
  () => avatarOverride.value ?? getSession()?.user.avatarUrl ?? '/avatar.jpg',
)

watch(
  () => getSession()?.user.id,
  () => {
    avatarOverride.value = null
  },
)

export function setProfileAvatar(url: string) {
  avatarOverride.value = url
  const current = getSession()
  if (!current) return
  const next: Session = {
    ...current,
    user: { ...current.user, avatarUrl: url },
  }
  setSession(next)
  void apiFetch<{ session: Session }>('/me', {
    method: 'PATCH',
    body: JSON.stringify({ avatarUrl: url }),
  }).then((data) => setSession(data.session)).catch(() => undefined)
}
