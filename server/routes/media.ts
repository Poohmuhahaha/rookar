import { Hono } from 'hono'
import type { AppEnv } from '../types'
import { enforceRateLimit } from '../security'
import {
  getMediaObject,
  MediaError,
  removeMedia,
  saveImage,
  type MediaKind,
} from '../services/media'

export const mediaRoutes = new Hono<AppEnv>()

const MEDIA_KINDS = new Set<MediaKind>(['avatar', 'chat_image'])

function mediaErrorResponse(error: unknown) {
  if (error instanceof MediaError) {
    return Response.json({ error: error.message }, { status: error.status })
  }
  console.error('[media] request failed', error)
  return Response.json({ error: 'จัดการไฟล์ไม่สำเร็จ' }, { status: 500 })
}

mediaRoutes.post('/', async (c) => {
  const user = c.get('user')
  const perMinute = await enforceRateLimit(c, `media:min:${user.id}`, 5, 60 * 1000)
  if (perMinute) return perMinute
  const perDay = await enforceRateLimit(c, `media:day:${user.id}`, 20, 24 * 60 * 60 * 1000)
  if (perDay) return perDay

  try {
    const body = await c.req.parseBody()
    const file = body.file
    const rawKind = typeof body.kind === 'string' ? body.kind : 'avatar'
    if (!MEDIA_KINDS.has(rawKind as MediaKind)) {
      throw new MediaError('ประเภทไฟล์ไม่รองรับ')
    }
    if (!(file instanceof File)) throw new MediaError('ไม่พบไฟล์ที่อัปโหลด')
    const media = await saveImage(user.id, file, rawKind as MediaKind)
    return c.json({ media }, 201)
  } catch (error) {
    return mediaErrorResponse(error)
  }
})

mediaRoutes.get('/:id', async (c) => {
  const user = c.get('user')
  const variant = c.req.query('variant') === 'thumb' ? 'thumb' : 'orig'
  try {
    const found = await getMediaObject(user.id, c.req.param('id'), variant)
    if (!found) return c.json({ error: 'ไม่พบไฟล์' }, 404)

    const { row, object } = found
    const etag = object.etag ?? `"${row.sha256}"`
    if (c.req.header('if-none-match') === etag) {
      return new Response(null, { status: 304, headers: { ETag: etag } })
    }

    const headers = new Headers({
      'Content-Type': row.mime_type,
      'Cache-Control': 'private, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
      ETag: etag,
    })
    if (object.size !== undefined) headers.set('Content-Length', String(object.size))
    return new Response(object.body, { headers })
  } catch (error) {
    return mediaErrorResponse(error)
  }
})

mediaRoutes.delete('/:id', async (c) => {
  const user = c.get('user')
  try {
    await removeMedia(user.id, c.req.param('id'))
    return c.json({ ok: true })
  } catch (error) {
    return mediaErrorResponse(error)
  }
})
