import { Hono } from 'hono'
import { streamAnswer, type ChatContext } from '../services/ai'
import { checkAiQuota, recordAiUsage } from '../services/aiUsage'
import { linkMessageMedia, loadChatImages, MediaError, type ChatImage } from '../services/media'
import { profileForUser } from '../services/sources'
import { clientIp, enforceRateLimit } from '../security'
import type { AppEnv } from '../types'
import type { SpecialistType } from '../../src/types'

export const chatRoutes = new Hono<AppEnv>()

const specialistRoles: SpecialistType[] = ['general', 'finance', 'market', 'strategy', 'planning']

type ChatBody = {
  question?: string
  industry?: string
  language?: string
  specialistRole?: string
  agentIds?: string[]
  history?: { role?: string; content?: string }[]
  attachment?: { name?: string; content?: string } | null
  conversationId?: string
  mediaIds?: string[]
  messageId?: string
}

chatRoutes.post('/stream', async (c) => {
  const user = c.get('user')
  const perMinute = await enforceRateLimit(c, `chat:min:${user.id}`, 5, 60 * 1000)
  if (perMinute) return perMinute
  const ip = clientIp(c)
  const perHour = await enforceRateLimit(c, `chat:hour:${user.id}:${ip}`, 30, 60 * 60 * 1000)
  if (perHour) return perHour
  const perIp = await enforceRateLimit(c, `chat:ip:${ip}`, 60, 60 * 60 * 1000)
  if (perIp) return perIp
  const perDay = await enforceRateLimit(c, `chat:day:${user.id}`, 200, 24 * 60 * 60 * 1000)
  if (perDay) return perDay
  const body = await c.req.json().catch(() => null) as ChatBody | null
  const rawMediaIds = Array.isArray(body?.mediaIds)
    ? body.mediaIds.filter((id): id is string => typeof id === 'string' && id.length > 0 && id.length <= 100)
    : []
  const mediaIds = [...new Set(rawMediaIds)].slice(0, 4)
  if (rawMediaIds.length > 4) return c.json({ error: 'แนบรูปได้สูงสุด 4 รูปต่อข้อความ' }, 400)
  const rawMessageId = typeof body?.messageId === 'string' ? body.messageId.trim() : ''
  const messageId = /^[A-Za-z0-9_-]{1,100}$/.test(rawMessageId) ? rawMessageId : ''
  if (mediaIds.length > 0 && !messageId) {
    return c.json({ error: 'ไม่พบรหัสข้อความสำหรับรูปแนบ' }, 400)
  }
  const question = body?.question?.trim() || (mediaIds.length > 0 ? 'ช่วยวิเคราะห์รูปที่แนบให้หน่อย' : '')
  if (!question) return c.json({ error: 'กรุณาพิมพ์คำถาม' }, 400)
  if (question.length > 4000) return c.json({ error: 'คำถามยาวเกินไป (สูงสุด 4,000 ตัวอักษร)' }, 413)
  let industry = body?.industry
  if (!industry) {
    try {
      industry = (await profileForUser(user.id)).id
    } catch {
      industry = undefined
    }
  }

  const specialistRole = specialistRoles.includes(body?.specialistRole as SpecialistType)
    ? body?.specialistRole as SpecialistType
    : 'general'
  const agentIds = Array.isArray(body?.agentIds)
    ? body.agentIds.filter((id): id is string => typeof id === 'string').slice(0, 8)
    : []
  const history = Array.isArray(body?.history)
    ? body.history
      .filter((entry) => (entry?.role === 'user' || entry?.role === 'assistant') && typeof entry.content === 'string')
      .slice(-20)
      .map((entry) => ({ role: entry.role as 'user' | 'assistant', content: entry.content!.slice(0, 4000) }))
    : []
  const attachment = body?.attachment && typeof body.attachment.name === 'string' && typeof body.attachment.content === 'string'
    ? { name: body.attachment.name.slice(0, 200), content: body.attachment.content.slice(0, 20000) }
    : null

  const rawConversationId = typeof body?.conversationId === 'string' ? body.conversationId.trim() : ''
  const conversationId = /^[A-Za-z0-9_-]{1,100}$/.test(rawConversationId) ? rawConversationId : ''

  if (mediaIds.length > 0) {
    try {
      await linkMessageMedia(user.id, messageId, mediaIds)
    } catch (error) {
      if (error instanceof MediaError) {
        return c.json({ error: error.message }, error.status as 400 | 413 | 404)
      }
      throw error
    }
  }

  const quota = await checkAiQuota(
    user.id,
    user.plan,
    body?.language === 'en' ? 'en' : 'th',
  )
  if (!quota.allowed) {
    return c.json(
      { error: quota.message ?? 'โควตา AI เต็มแล้ว', code: 'AI_QUOTA_EXCEEDED', usage: quota.usage },
      429,
    )
  }

  let images: ChatImage[] = []
  if (mediaIds.length > 0) {
    try {
      images = await loadChatImages(user.id, mediaIds)
    } catch (error) {
      if (error instanceof MediaError) {
        return c.json({ error: error.message }, error.status as 400 | 413 | 404)
      }
      throw error
    }
  }

  const context: ChatContext = {
    question,
    industry,
    language: body?.language === 'en' ? 'en' : 'th',
    specialistRole,
    agentIds,
    history,
    attachment,
    images,
    conversationId: conversationId || undefined,
    plan: user.plan,
    signal: c.req.raw.signal,
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false
      let usage: { inputTokens: number; outputTokens: number } | null = null
      const send = (event: unknown) => {
        if (closed || c.req.raw.signal.aborted) return
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`))
        } catch {
          closed = true
        }
      }
      try {
        for await (const event of streamAnswer(user.id, context)) {
          if (event.type === 'usage' && event.usage) {
            usage = event.usage
            continue
          }
          send(event)
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return
        console.error('[chat] stream failed', error)
        send({ type: 'error', message: 'AI ตอบไม่สำเร็จ กรุณาลองใหม่' })
      } finally {
        if (usage) {
          await recordAiUsage(user.id, usage.inputTokens, usage.outputTokens).catch((error) => {
            console.error('[chat] failed to record AI usage', error)
          })
        }
        if (!closed) {
          try {
            controller.close()
          } catch {
            // The client may have disconnected mid-stream.
          }
        }
      }
    },
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
})
