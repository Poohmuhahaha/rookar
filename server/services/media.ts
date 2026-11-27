import { newId, nowIso } from '../auth'
import { batchInChunks, db } from '../db'
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
  thumb_size_bytes: number | null
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

export type ChatImage = {
  mediaId: string
  mimeType: string
  dataUrl: string
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
const MAX_USER_MEDIA_BYTES = 250 * 1024 * 1024
const MAX_USER_MEDIA_FILES = 500
const GC_GRACE_MS = 24 * 60 * 60 * 1000
const CHAT_RETENTION_MS = 30 * 24 * 60 * 60 * 1000
const ALLOWED_KINDS = new Set<MediaKind>(['avatar', 'chat_image'])

export const MEDIA_LIMITS = {
  maxFileBytes: MAX_IMAGE_BYTES,
  maxBytes: MAX_USER_MEDIA_BYTES,
  maxFiles: MAX_USER_MEDIA_FILES,
}

type ImageInfo = {
  bytes: Uint8Array
  mime: string
  ext: string
}

type UsageRow = {
  user_id: string
  file_count: number
  bytes_used: number
  updated_at: string
}

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

async function readImage(file: File | undefined): Promise<ImageInfo | null> {
  if (!file) return null
  if (typeof file.arrayBuffer !== 'function') throw new MediaError('ไม่พบไฟล์ที่อัปโหลด')
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    throw new MediaError('ไฟล์ต้องมีขนาดไม่เกิน 10 MB', 413)
  }
  const bytes = new Uint8Array(await file.arrayBuffer())
  const sniffed = sniffImage(bytes)
  if (!sniffed) throw new MediaError('รองรับเฉพาะไฟล์รูปภาพ JPG, PNG หรือ WebP')
  return { bytes, ...sniffed }
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

async function ensureUsage(userId: string): Promise<UsageRow> {
  const existing = await db
    .query<UsageRow>('SELECT * FROM media_usage WHERE user_id = ?')
    .get(userId)
  if (existing) return existing

  const aggregate = await db
    .query<{ file_count: number; bytes_used: number }>(
      `SELECT COUNT(*) AS file_count,
              COALESCE(SUM(size_bytes + COALESCE(thumb_size_bytes, 0)), 0) AS bytes_used
       FROM media_files
       WHERE user_id = ? AND status = 'active'`,
    )
    .get(userId)

  const row: UsageRow = {
    user_id: userId,
    file_count: Number(aggregate?.file_count ?? 0),
    bytes_used: Number(aggregate?.bytes_used ?? 0),
    updated_at: nowIso(),
  }
  await db.query(
    `INSERT INTO media_usage (user_id, file_count, bytes_used, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO NOTHING`,
  ).run(row.user_id, row.file_count, row.bytes_used, row.updated_at)
  return row
}

async function subtractUsage(userId: string, fileBytes: number) {
  const now = nowIso()
  await ensureUsage(userId)
  await db.query(
    `UPDATE media_usage
     SET file_count = MAX(0, file_count - 1),
         bytes_used = MAX(0, bytes_used - ?),
         updated_at = ?
     WHERE user_id = ?`,
  ).run(fileBytes, now, userId)
}

function totalBytes(row: Pick<MediaRow, 'size_bytes' | 'thumb_size_bytes'>) {
  return row.size_bytes + (row.thumb_size_bytes ?? 0)
}

export async function saveImage(
  userId: string,
  file: File,
  kind: MediaKind,
  thumb?: File,
): Promise<MediaDto> {
  if (!ALLOWED_KINDS.has(kind)) throw new MediaError('ประเภทไฟล์ไม่รองรับ')

  const main = await readImage(file)
  if (!main) throw new MediaError('ไม่พบไฟล์ที่อัปโหลด')
  const thumbImage = await readImage(thumb)
  if (thumbImage && thumbImage.mime !== main.mime) {
    throw new MediaError('thumbnail ต้องเป็นรูปแบบเดียวกับรูปหลัก')
  }

  const store = requireStore()
  const usage = await ensureUsage(userId)
  const total = main.bytes.byteLength + (thumbImage?.bytes.byteLength ?? 0)
  if (
    usage.file_count >= MAX_USER_MEDIA_FILES ||
    usage.bytes_used + total > MAX_USER_MEDIA_BYTES
  ) {
    throw new MediaError('พื้นที่เก็บรูปของคุณเต็มแล้ว กรุณาลบรูปเก่าก่อน', 413)
  }

  const id = newId('med')
  const originalKey = `u/${userId}/${kind}/${id}/orig.${main.ext}`
  const thumbKey = thumbImage ? `u/${userId}/${kind}/${id}/thumb.${thumbImage.ext}` : null
  const hash = await sha256Hex(main.bytes)

  await store.put(originalKey, main.bytes, main.mime)
  if (thumbImage && thumbKey) {
    try {
      await store.put(thumbKey, thumbImage.bytes, thumbImage.mime)
    } catch (error) {
      await store.delete(originalKey).catch(() => undefined)
      throw error
    }
  }

  try {
    const createdAt = nowIso()
    await db.batch([
      {
        sql: `INSERT INTO media_files
          (id, user_id, kind, object_key, thumb_key, file_name, mime_type, size_bytes,
           thumb_size_bytes, sha256, width, height, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
        params: [
          id,
          userId,
          kind,
          originalKey,
          thumbKey,
          file.name.slice(0, 200) || `${kind}.${main.ext}`,
          main.mime,
          main.bytes.byteLength,
          thumbImage?.bytes.byteLength ?? null,
          hash,
          null,
          null,
          createdAt,
        ],
      },
      {
        sql: `INSERT INTO media_usage (user_id, file_count, bytes_used, updated_at)
              VALUES (?, 1, ?, ?)
              ON CONFLICT(user_id) DO UPDATE SET
                file_count = media_usage.file_count + 1,
                bytes_used = media_usage.bytes_used + excluded.bytes_used,
                updated_at = excluded.updated_at`,
        params: [userId, total, createdAt],
      },
    ])
    const row = await getMediaRow(userId, id)
    if (!row) throw new MediaError('บันทึกข้อมูลไฟล์ไม่สำเร็จ', 500)
    return toDto(row)
  } catch (error) {
    await store.delete(originalKey).catch(() => undefined)
    if (thumbKey) await store.delete(thumbKey).catch(() => undefined)
    await subtractUsage(userId, total).catch(() => undefined)
    throw error
  }
}

export async function getMediaRow(userId: string, id: string): Promise<MediaRow | null> {
  return db
    .query<MediaRow>('SELECT * FROM media_files WHERE id = ? AND user_id = ? AND status = ?')
    .get(id, userId, 'active')
}

export async function getMediaUsage(userId: string) {
  const usage = await ensureUsage(userId)
  return {
    fileCount: usage.file_count,
    bytesUsed: usage.bytes_used,
    ...MEDIA_LIMITS,
  }
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

export async function linkMessageMedia(userId: string, messageId: string, mediaIds: string[]): Promise<void> {
  const uniqueIds = [...new Set(mediaIds)].slice(0, 4)
  if (uniqueIds.length === 0) return
  const placeholders = uniqueIds.map(() => '?').join(',')
  const rows = await db
    .query<{ id: string; kind: MediaKind; status: string }>(
      `SELECT id, kind, status FROM media_files
       WHERE user_id = ? AND id IN (${placeholders})`,
    )
    .all(userId, ...uniqueIds)
  const byId = new Map(rows.map((row) => [row.id, row]))
  for (const id of uniqueIds) {
    const row = byId.get(id)
    if (!row || row.kind !== 'chat_image' || row.status !== 'active') {
      throw new MediaError('รูปแนบไม่ถูกต้องหรือหมดอายุ', 400)
    }
  }

  const createdAt = nowIso()
  await db.batch([
    {
      sql: 'DELETE FROM media_links WHERE user_id = ? AND owner_type = ? AND owner_id = ?',
      params: [userId, 'message', messageId],
    },
    ...uniqueIds.map((mediaId) => ({
      sql: `INSERT INTO media_links (media_id, user_id, owner_type, owner_id, created_at)
            VALUES (?, ?, 'message', ?, ?)
            ON CONFLICT(media_id, owner_type, user_id, owner_id) DO NOTHING`,
      params: [mediaId, userId, messageId, createdAt],
    })),
  ])
}

function base64FromBytes(bytes: Uint8Array): string {
  let binary = ''
  const chunkSize = 0x8000
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }
  return btoa(binary)
}

export async function loadChatImages(userId: string, mediaIds: string[]): Promise<ChatImage[]> {
  const uniqueIds = [...new Set(mediaIds)].slice(0, 4)
  if (uniqueIds.length === 0) return []
  const placeholders = uniqueIds.map(() => '?').join(',')
  const rows = await db
    .query<MediaRow>(
      `SELECT * FROM media_files
       WHERE user_id = ? AND id IN (${placeholders}) AND status = 'active' AND kind = 'chat_image'`,
    )
    .all(userId, ...uniqueIds)
  const byId = new Map(rows.map((row) => [row.id, row]))
  const store = requireStore()
  const images: ChatImage[] = []
  let totalBytes = 0

  for (const id of uniqueIds) {
    const row = byId.get(id)
    if (!row) throw new MediaError('รูปแนบไม่ถูกต้องหรือหมดอายุ', 400)
    const object = await store.get(row.object_key)
    if (!object) throw new MediaError('ไม่พบไฟล์รูปแนบ', 404)
    const buffer = await new Response(object.body).arrayBuffer()
    totalBytes += buffer.byteLength
    if (totalBytes > 8 * 1024 * 1024) {
      throw new MediaError('รูปแนบรวมกันต้องไม่เกิน 8 MB', 413)
    }
    images.push({
      mediaId: id,
      mimeType: row.mime_type,
      dataUrl: `data:${row.mime_type};base64,${base64FromBytes(new Uint8Array(buffer))}`,
    })
  }
  return images
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
  await ensureUsage(userId)

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
    {
      sql: `UPDATE media_usage
            SET file_count = MAX(0, file_count - 1),
                bytes_used = MAX(0, bytes_used - ?),
                updated_at = ?
            WHERE user_id = ?`,
      params: [totalBytes(row), nowIso(), userId],
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
    { sql: 'DELETE FROM media_usage WHERE user_id = ?', params: [userId] },
    { sql: 'UPDATE users SET avatar_media_id = NULL, avatar_url = ? WHERE id = ?', params: ['/avatar.jpg', userId] },
  ])

  const store = getMediaStore()
  for (const row of rows) {
    await store?.delete(row.object_key).catch(() => undefined)
    if (row.thumb_key) await store?.delete(row.thumb_key).catch(() => undefined)
  }
}

export async function cleanupMedia(options: { olderThanMs?: number; chatRetentionMs?: number; limit?: number } = {}): Promise<number> {
  const store = getMediaStore()
  if (!store) return 0
  const cutoff = new Date(Date.now() - (options.olderThanMs ?? GC_GRACE_MS)).toISOString()
  const chatCutoff = new Date(
    Date.now() - Math.max(0, options.chatRetentionMs ?? CHAT_RETENTION_MS),
  ).toISOString()
  const limit = Math.min(500, Math.max(1, options.limit ?? 100))
  const rows = await db
    .query<MediaRow>(
      `SELECT * FROM media_files
       WHERE status IN ('pending', 'deleted')
          OR (status = 'active' AND kind = 'chat_image' AND created_at < ?)
          OR (status = 'active' AND created_at < ?
              AND NOT EXISTS (SELECT 1 FROM media_links WHERE media_links.media_id = media_files.id))
       ORDER BY created_at ASC
       LIMIT ?`,
    )
    .all(chatCutoff, cutoff, limit)

  const users = new Set(rows.map((row) => row.user_id))
  for (const row of rows) {
    await store.delete(row.object_key).catch(() => undefined)
    if (row.thumb_key) await store.delete(row.thumb_key).catch(() => undefined)
  }

  const statements = rows.flatMap((row) => [
    { sql: 'DELETE FROM media_links WHERE media_id = ?', params: [row.id] },
    { sql: 'DELETE FROM media_files WHERE id = ? AND user_id = ?', params: [row.id, row.user_id] },
  ])
  for (const userId of users) {
    statements.push({
      sql: `UPDATE media_usage
            SET file_count = (SELECT COUNT(*) FROM media_files WHERE user_id = ? AND status = 'active'),
                bytes_used = (SELECT COALESCE(SUM(size_bytes + COALESCE(thumb_size_bytes, 0)), 0)
                              FROM media_files WHERE user_id = ? AND status = 'active'),
                updated_at = ?
            WHERE user_id = ?`,
      params: [userId, userId, nowIso(), userId],
    })
  }
  if (statements.length > 0) await batchInChunks(statements, 80)
  return rows.length
}
