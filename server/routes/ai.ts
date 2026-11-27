import { Hono } from 'hono'
import { getAiUsage } from '../services/aiUsage'
import type { AppEnv } from '../types'

export const aiRoutes = new Hono<AppEnv>()

aiRoutes.get('/usage', async (c) => {
  const user = c.get('user')
  return c.json({ usage: await getAiUsage(user.id, user.plan) })
})
