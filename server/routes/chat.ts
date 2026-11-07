import { Hono } from 'hono'
import { streamAnswer, type ChatContext } from '../services/ai'
import { profileForUser } from '../services/sources'
import type { AppEnv } from '../types'
import type { SpecialistType } from '../../src/types'

export const chatRoutes = new Hono<AppEnv>()

const specialistRoles: SpecialistType[] = ['general', 'finance', 'market', 'strategy', 'planning']

type ChatBody = {
  question?: string
  industry?: string
  specialistRole?: string
  agentIds?: string[]
  history?: { role?: string; content?: string }[]
  attachment?: { name?: string; content?: string } | null
}

chatRoutes.post('/stream', async (c) => {
  const body = await c.req.json().catch(() => null) as ChatBody | null
  const question = body?.question?.trim() ?? ''
  if (!question) return c.json({ error: 'กรุณาพิมพ์คำถาม' }, 400)
  const user = c.get('user')
  let industry = body?.industry
  if (!industry) {
    try {
      industry = profileForUser(user.id).id
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

  const context: ChatContext = {
    question,
    industry,
    specialistRole,
    agentIds,
    history,
    attachment,
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
        send({ type: 'error', message: error instanceof Error ? error.message : 'AI ตอบไม่สำเร็จ' })
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
