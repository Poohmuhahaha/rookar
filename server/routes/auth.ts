import { Hono } from 'hono'
import { db } from '../db'
import {
  consumePasswordReset,
  createPasswordReset,
  createSession,
  destroySession,
  getSessionUser,
  hashPassword,
  invalidateUserSessions,
  newId,
  nowIso,
  setSessionCookie,
  toSession,
  verifyPassword,
} from '../auth'
import { env } from '../env'
import type { AppEnv } from '../types'
import type { DbUser } from '../db'
import { sendPasswordResetEmail } from '../services/mailer'

export const authRoutes = new Hono<AppEnv>()

authRoutes.post('/signup', async (c) => {
  const body = await c.req.json().catch(() => null) as { name?: string; email?: string; password?: string } | null
  const name = body?.name?.trim() ?? ''
  const email = body?.email?.trim().toLowerCase() ?? ''
  const password = body?.password ?? ''
  if (!name || !email || !password) return c.json({ error: 'กรุณากรอกข้อมูลให้ครบ' }, 400)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return c.json({ error: 'รูปแบบอีเมลไม่ถูกต้อง' }, 400)
  if (password.length < 8) return c.json({ error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' }, 400)
  const existing = db.query('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) return c.json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' }, 409)

  const id = newId('user')
  const hash = await hashPassword(password)
  db.query(
    `INSERT INTO users (id, name, email, password_hash, role, avatar_url, plan, onboarding_complete, created_at)
     VALUES (?, ?, ?, ?, 'owner', '/avatar.jpg', 'Free', 0, ?)`,
  ).run(id, name, email, hash, nowIso())
  const user = db.query('SELECT * FROM users WHERE id = ?').get(id) as DbUser
  const { token } = createSession(id)
  setSessionCookie(c, token)
  return c.json({ session: toSession(user) })
})

authRoutes.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null) as { email?: string; password?: string } | null
  const email = body?.email?.trim().toLowerCase() ?? ''
  const password = body?.password ?? ''
  if (password.length < 8) return c.json({ error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' }, 400)
  if (email === 'blocked@rookar.co') return c.json({ error: 'บัญชีนี้ถูกระงับชั่วคราว กรุณาติดต่อทีมงาน' }, 403)

  const user = db.query('SELECT * FROM users WHERE email = ?').get(email) as DbUser | null
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return c.json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, 401)
  }
  const { token } = createSession(user.id)
  setSessionCookie(c, token)
  return c.json({ session: toSession(user) })
})

authRoutes.post('/logout', (c) => {
  destroySession(c)
  return c.json({ ok: true })
})

authRoutes.post('/forgot-password', async (c) => {
  const body = await c.req.json().catch(() => null) as { email?: string } | null
  const email = body?.email?.trim().toLowerCase() ?? ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: 'รูปแบบอีเมลไม่ถูกต้อง' }, 400)
  }

  const user = db.query('SELECT * FROM users WHERE email = ?').get(email) as DbUser | null
  if (user) {
    const { token } = createPasswordReset(user.id)
    const resetUrl = `${env.appUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`
    try {
      await sendPasswordResetEmail(user.email, resetUrl)
    } catch (error) {
      console.error('[mail] failed to send password reset', error)
    }
    if (env.nodeEnv !== 'production') {
      return c.json({ ok: true, devResetUrl: resetUrl })
    }
  }

  return c.json({ ok: true })
})

authRoutes.post('/reset-password', async (c) => {
  const body = await c.req.json().catch(() => null) as { token?: string; password?: string } | null
  const token = body?.token?.trim() ?? ''
  const password = body?.password ?? ''
  if (!token) return c.json({ error: 'ลิงก์ตั้งรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว' }, 400)
  if (password.length < 8) return c.json({ error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' }, 400)

  const userId = consumePasswordReset(token)
  if (!userId) return c.json({ error: 'ลิงก์ตั้งรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว' }, 400)

  const hash = await hashPassword(password)
  db.query('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, userId)
  invalidateUserSessions(userId)
  return c.json({ ok: true })
})

authRoutes.get('/session', (c) => {
  const user = getSessionUser(c)
  if (!user) return c.json({ session: null })
  return c.json({ session: toSession(user) })
})
