import { Hono } from 'hono'
import { streamAnswer, type ChatContext } from '../services/ai'
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
  const question = body?.question?.trim() ?? ''
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

  const context: ChatContext = {
    question,
    industry,
    language: body?.language === 'en' ? 'en' : 'th',
    specialistRole,
    agentIds,
    history,
    attachment,
    conversationId: conversationId || undefined,
    signal: c.req.raw.signal,
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false
      const send = (event: unknown) => {
        if (closed || c.req.raw.signal.aborted) return
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`))
        } catch {
          closed = true
        }
      }
      try {
        for await (const event of streamAnswer(user.id, context)) send(event)
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return
        console.error('[chat] stream failed', error)
        send({ type: 'error', message: 'AI ตอบไม่สำเร็จ กรุณาลองใหม่' })
      } finally {
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
