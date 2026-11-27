import { apiFetch } from './api/client'

export type MediaDto = {
  id: string
  kind: 'avatar' | 'chat_image' | 'attachment' | 'plan_image'
  fileName: string
  mimeType: string
  sizeBytes: number
  width: number | null
  height: number | null
  url: string
  thumbUrl: string
}

export type MediaUsage = {
  fileCount: number
  bytesUsed: number
  maxFileBytes: number
  maxBytes: number
  maxFiles: number
}

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

type UploadOptions = {
  kind: 'avatar' | 'chat_image'
  maxEdge?: number
  quality?: number
  fileName?: string
}

async function resizeImage(file: File, maxEdge: number, quality: number): Promise<Blob> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('รองรับเฉพาะรูป JPG, PNG หรือ WebP')
  }

  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('ไม่สามารถประมวลผลรูปภาพได้')
    context.drawImage(bitmap, 0, 0, width, height)
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', quality)
    })
    if (!blob) throw new Error('ไม่สามารถแปลงรูปภาพได้')
    return blob
  } finally {
    bitmap.close()
  }
}

export async function uploadImage(file: File, options: UploadOptions): Promise<MediaDto> {
  const maxEdge = options.maxEdge ?? 2048
  const quality = options.quality ?? 0.85
  const blob = await resizeImage(file, maxEdge, quality)
  const thumb = options.kind === 'chat_image'
    ? await resizeImage(file, Math.min(640, maxEdge), 0.8)
    : null
  const form = new FormData()
  form.append('file', new File([blob], options.fileName ?? 'image.webp', { type: 'image/webp' }))
  if (thumb) {
    form.append('thumb', new File([thumb], 'thumb.webp', { type: 'image/webp' }))
  }
  form.append('kind', options.kind)
  const data = await apiFetch<{ media: MediaDto }>('/media', {
    method: 'POST',
    body: form,
  })
  return data.media
}

export async function getMediaUsage(): Promise<MediaUsage> {
  const data = await apiFetch<{ usage: MediaUsage }>('/media/usage')
  return data.usage
}

export async function deleteMedia(id: string): Promise<void> {
  await apiFetch<{ ok: true }>(`/media/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
