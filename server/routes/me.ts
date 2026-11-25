import { Hono } from 'hono'
import { db } from '../db'
import { toSession } from '../auth'
import type { AppEnv } from '../types'
import type { DbUser } from '../db'

export const meRoutes = new Hono<AppEnv>()

meRoutes.patch('/', async (c) => {
  const user = c.get('user')
  const body = await c.req.json().catch(() => null) as { name?: string; avatarUrl?: string } | null
  if (body?.name !== undefined && (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.trim().length > 120)) {
    return c.json({ error: 'ชื่อไม่ถูกต้อง' }, 400)
  }
  if (body?.avatarUrl !== undefined) {
    if (typeof body.avatarUrl !== 'string' || body.avatarUrl.length > 500 || !(body.avatarUrl.startsWith('/') || body.avatarUrl.startsWith('https://') || body.avatarUrl.startsWith('data:image/'))) {
      return c.json({ error: 'รูปโปรไฟล์ไม่ถูกต้อง' }, 400)
    }
  }
  if (body?.name?.trim()) await db.query('UPDATE users SET name = ? WHERE id = ?').run(body.name.trim(), user.id)
  if (typeof body?.avatarUrl === 'string') await db.query('UPDATE users SET avatar_url = ? WHERE id = ?').run(body.avatarUrl, user.id)
  const updated = await db.query<DbUser>('SELECT * FROM users WHERE id = ?').get(user.id)
  if (!updated) return c.json({ error: 'ไม่พบผู้ใช้' }, 404)
  return c.json({ session: await toSession(updated) })
})

meRoutes.delete('/data', async (c) => {
  const user = c.get('user')
  await db.batch([
    { sql: 'DELETE FROM data_sources WHERE user_id = ?', params: [user.id] },
    { sql: 'DELETE FROM conversations WHERE user_id = ?', params: [user.id] },
    { sql: 'DELETE FROM user_agents WHERE user_id = ?', params: [user.id] },
    { sql: 'DELETE FROM businesses WHERE user_id = ?', params: [user.id] },
    { sql: 'UPDATE users SET onboarding_complete = 0 WHERE id = ?', params: [user.id] },
  ])
  return c.json({ ok: true })
})
