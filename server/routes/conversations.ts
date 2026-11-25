import { Hono } from 'hono'
import { getConversations, saveConversations } from '../services/conversations'
import type { AppEnv } from '../types'
import type { Conversation } from '../../src/types'

export const conversationRoutes = new Hono<AppEnv>()

conversationRoutes.get('/', async (c) => c.json({ conversations: await getConversations(c.get('user').id) }))

conversationRoutes.put('/', async (c) => {
  const body = await c.req.json().catch(() => null) as { conversations?: Conversation[] } | null
  if (!Array.isArray(body?.conversations)) return c.json({ error: 'ข้อมูลบทสนทนาไม่ถูกต้อง' }, 400)
  const seen = new Set<string>()
  const conversations = body.conversations
    .filter((conversation): conversation is Conversation => {
      if (!conversation || typeof conversation !== 'object') return false
      if (typeof conversation.id !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(conversation.id)) return false
      if (seen.has(conversation.id)) return false
      seen.add(conversation.id)
      return Array.isArray(conversation.messages)
    })
    .slice(0, 50)
  await saveConversations(c.get('user').id, conversations)
  return c.json({ ok: true })
})
