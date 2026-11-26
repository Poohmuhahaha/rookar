import { newId, nowIso } from '../auth'
import { db } from '../db'
import { getMediaStore, type MediaStore } from '../media'

export type MediaKind = 'avatar' | 'chat_image' | 'attachment' | 'plan_image'

export type MediaRow = {
  id: string
  user_id: string
  kind: MediaKind
  object_key: string
  thumb_key: string | null
  file_name: string
  mime_type: string
  size_bytes: number
  sha256: string
  width: number | null
  height: number | null
  status: 'pending' | 'active' | 'deleted'
  created_at: string
  deleted_at: string | null
}

export type MediaDto = {
  id: string
  kind: MediaKind
  fileName: string
  mimeType: string
  sizeBytes: number
  width: number | null
  height: number | null
  url: string
  thumbUrl: string
}

export class MediaError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = 'MediaError'
    this.status = status
  }
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const ALLOWED_KINDS = new Set<MediaKind>(['avatar', 'chat_image'])

function sniffImage(bytes: Uint8Array): { mime: string; ext: string } | null {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { mime: 'image/png', ext: 'png' }
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' }
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { mime: 'image/webp', ext: 'webp' }
  }
  return null
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes.buffer as ArrayBuffer)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function requireStore(): MediaStore {
  const store = getMediaStore()
  if (!store) throw new MediaError('ระบบเก็บไฟล์ยังไม่พร้อมใช้งาน', 503)
  return store
}

function toDto(row: MediaRow): MediaDto {
  return {
    id: row.id,
    kind: row.kind,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    width: row.width,
    height: row.height,
    url: `/api/media/${row.id}`,
    thumbUrl: `/api/media/${row.id}?variant=thumb`,
  }
}

export async function saveImage(userId: string, file: File, kind: MediaKind): Promise<MediaDto> {
  if (!ALLOWED_KINDS.has(kind)) throw new MediaError('ประเภทไฟล์ไม่รองรับ')
  if (!file || typeof file.arrayBuffer !== 'function') throw new MediaError('ไม่พบไฟล์ที่อัปโหลด')
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    throw new MediaError('ไฟล์ต้องมีขนาดไม่เกิน 10 MB', 413)
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const sniffed = sniffImage(bytes)
  if (!sniffed) throw new MediaError('รองรับเฉพาะไฟล์รูปภาพ JPG, PNG หรือ WebP')

  const store = requireStore()
  const id = newId('med')
  const objectKey = `u/${userId}/${kind}/${id}/orig.${sniffed.ext}`
  const hash = await sha256Hex(bytes)

  await store.put(objectKey, bytes, sniffed.mime)

  try {
    const createdAt = nowIso()
    await db.query(
      `INSERT INTO media_files
        (id, user_id, kind, object_key, thumb_key, file_name, mime_type, size_bytes, sha256, width, height, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
    ).run(
      id,
      userId,
      kind,
      objectKey,
      null,
      file.name.slice(0, 200) || `${kind}.${sniffed.ext}`,
      sniffed.mime,
      bytes.byteLength,
      hash,
      null,
      null,
      createdAt,
    )
    const row = await getMediaRow(userId, id)
    if (!row) throw new MediaError('บันทึกข้อมูลไฟล์ไม่สำเร็จ', 500)
    return toDto(row)
  } catch (error) {
    await store.delete(objectKey).catch(() => undefined)
    throw error
  }
}

export async function getMediaRow(userId: string, id: string): Promise<MediaRow | null> {
  return db
    .query<MediaRow>('SELECT * FROM media_files WHERE id = ? AND user_id = ? AND status = ?')
    .get(id, userId, 'active')
}

export async function getMediaObject(userId: string, id: string, variant: 'orig' | 'thumb' = 'orig') {
  const row = await getMediaRow(userId, id)
  if (!row) return null
  const store = requireStore()
  const key = variant === 'thumb' && row.thumb_key ? row.thumb_key : row.object_key
  const object = await store.get(key)
  if (!object) return null
  return { row, object }
}

export async function setAvatarMedia(userId: string, mediaId: string): Promise<MediaRow> {
  const row = await getMediaRow(userId, mediaId)
  if (!row || row.kind !== 'avatar') throw new MediaError('ไม่พบรูปโปรไฟล์นี้', 404)

  const previous = await db
    .query<{ avatar_media_id: string | null }>('SELECT avatar_media_id FROM users WHERE id = ?')
    .get(userId)

  const createdAt = nowIso()
  const avatarUrl = `/api/media/${row.id}`
  await db.batch([
    {
      sql: 'DELETE FROM media_links WHERE user_id = ? AND owner_type = ?',
      params: [userId, 'avatar'],
    },
    {
      sql: 'INSERT INTO media_links (media_id, user_id, owner_type, owner_id, created_at) VALUES (?, ?, ?, ?, ?)',
      params: [row.id, userId, 'avatar', userId, createdAt],
    },
    {
      sql: 'UPDATE users SET avatar_media_id = ?, avatar_url = ? WHERE id = ?',
      params: [row.id, avatarUrl, userId],
    },
  ])

  if (previous?.avatar_media_id && previous.avatar_media_id !== row.id) {
    await removeMedia(userId, previous.avatar_media_id).catch(() => undefined)
  }

  return row
}

export async function removeMedia(userId: string, mediaId: string): Promise<void> {
  const row = await getMediaRow(userId, mediaId)
  if (!row) return

  await db.batch([
    {
      sql: 'DELETE FROM media_links WHERE media_id = ? AND user_id = ?',
      params: [mediaId, userId],
    },
    {
      sql: 'DELETE FROM media_files WHERE id = ? AND user_id = ?',
      params: [mediaId, userId],
    },
    {
      sql: 'UPDATE users SET avatar_media_id = NULL, avatar_url = ? WHERE id = ? AND avatar_media_id = ?',
      params: ['/avatar.jpg', userId, mediaId],
    },
  ])

  const store = getMediaStore()
  await store?.delete(row.object_key).catch(() => undefined)
  if (row.thumb_key) await store?.delete(row.thumb_key).catch(() => undefined)
}

export async function deleteAllUserMedia(userId: string): Promise<void> {
  const rows = await db
    .query<Pick<MediaRow, 'id' | 'object_key' | 'thumb_key'>>(
      'SELECT id, object_key, thumb_key FROM media_files WHERE user_id = ?',
    )
    .all(userId)

  await db.batch([
    { sql: 'DELETE FROM media_links WHERE user_id = ?', params: [userId] },
    { sql: 'DELETE FROM media_files WHERE user_id = ?', params: [userId] },
    { sql: 'UPDATE users SET avatar_media_id = NULL, avatar_url = ? WHERE id = ?', params: ['/avatar.jpg', userId] },
  ])

  const store = getMediaStore()
  for (const row of rows) {
    await store?.delete(row.object_key).catch(() => undefined)
    if (row.thumb_key) await store?.delete(row.thumb_key).catch(() => undefined)
  }
}
