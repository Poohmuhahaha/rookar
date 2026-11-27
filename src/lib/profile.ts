import { computed, ref, watch } from 'vue'
import { getSession, setSession } from './session'
import { apiFetch } from './api/client'
import { uploadImage } from './media'
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

export async function uploadProfileAvatar(file: File) {
  const media = await uploadImage(file, {
    kind: 'avatar',
    maxEdge: 512,
    quality: 0.85,
    fileName: 'avatar.webp',
  })
  try {
    const data = await apiFetch<{ session: Session }>('/me', {
      method: 'PATCH',
      body: JSON.stringify({ avatarMediaId: media.id }),
    })
    setSession(data.session)
    avatarOverride.value = null
  } catch (error) {
    let avatarLinked = true
    try {
      const current = await apiFetch<{ session: Session | null }>('/auth/session')
      avatarLinked = current.session?.user.avatarUrl?.includes(media.id) ?? false
    } catch {
      // If we cannot confirm, keep the media to avoid deleting a valid avatar.
      avatarLinked = true
    }
    if (!avatarLinked) {
      await apiFetch(`/media/${media.id}`, { method: 'DELETE' }).catch(() => undefined)
    }
    throw error
  }
}
