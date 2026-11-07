import { Hono } from 'hono'
import { getConversations, saveConversations } from '../services/conversations'
import type { AppEnv } from '../types'
import type { Conversation } from '../../src/types'

export const conversationRoutes = new Hono<AppEnv>()

conversationRoutes.get('/', (c) => c.json({ conversations: getConversations(c.get('user').id) }))

conversationRoutes.put('/', async (c) => {
  const body = await c.req.json().catch(() => null) as { conversations?: Conversation[] } | null
  if (!Array.isArray(body?.conversations)) return c.json({ error: 'ข้อมูลบทสนทนาไม่ถูกต้อง' }, 400)
  saveConversations(c.get('user').id, body.conversations)
  return c.json({ ok: true })
})
