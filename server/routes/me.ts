import { Hono } from 'hono'
import { db } from '../db'
import { toSession } from '../auth'
import type { AppEnv } from '../types'
import type { DbUser } from '../db'

export const meRoutes = new Hono<AppEnv>()

meRoutes.patch('/', async (c) => {
  const user = c.get('user')
  const body = await c.req.json().catch(() => null) as { name?: string; avatarUrl?: string } | null
  if (body?.name?.trim()) db.query('UPDATE users SET name = ? WHERE id = ?').run(body.name.trim(), user.id)
  if (typeof body?.avatarUrl === 'string') db.query('UPDATE users SET avatar_url = ? WHERE id = ?').run(body.avatarUrl, user.id)
  const updated = db.query('SELECT * FROM users WHERE id = ?').get(user.id) as DbUser
  return c.json({ session: toSession(updated) })
})

meRoutes.delete('/data', (c) => {
  const user = c.get('user')
  db.transaction(() => {
    db.query('DELETE FROM data_sources WHERE user_id = ?').run(user.id)
    db.query('DELETE FROM conversations WHERE user_id = ?').run(user.id)
    db.query('DELETE FROM user_agents WHERE user_id = ?').run(user.id)
    db.query('DELETE FROM businesses WHERE user_id = ?').run(user.id)
    db.query('UPDATE users SET onboarding_complete = 0 WHERE id = ?').run(user.id)
  })()
  return c.json({ ok: true })
})
