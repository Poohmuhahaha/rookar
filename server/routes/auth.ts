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
  needsPasswordRehash,
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
import { DUMMY_PASSWORD_HASH } from '../auth'
import { clientIp, enforceRateLimit } from '../security'

export const authRoutes = new Hono<AppEnv>()

authRoutes.post('/signup', async (c) => {
  const limited = await enforceRateLimit(c, `signup:ip:${clientIp(c)}`, 500, 60 * 60 * 1000)
  if (limited) return limited
  const body = await c.req.json().catch(() => null) as {
    name?: string
    username?: string
    email?: string
    password?: string
  } | null
  const name = body?.name?.trim() ?? ''
  const username = body?.username?.trim().toLowerCase() ?? ''
  const email = body?.email?.trim().toLowerCase() ?? ''
  const password = body?.password ?? ''
  if (!name || !username || !email || !password) return c.json({ error: 'กรุณากรอกข้อมูลให้ครบ' }, 400)
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
    return c.json({ error: 'ชื่อผู้ใช้ใช้ 3-30 ตัวอักษร a-z, 0-9, จุด หรือขีดล่าง' }, 400)
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return c.json({ error: 'รูปแบบอีเมลไม่ถูกต้อง' }, 400)
  if (password.length < 8) return c.json({ error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' }, 400)
  const existingUsername = await db.query('SELECT id FROM users WHERE username = ?').get(username)
  if (existingUsername) return c.json({ error: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' }, 409)
  const existing = await db.query('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) return c.json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' }, 409)

  const id = newId('user')
  const hash = await hashPassword(password)
  await db.query(
    `INSERT INTO users (id, name, username, email, password_hash, role, avatar_url, plan, onboarding_complete, created_at)
     VALUES (?, ?, ?, ?, ?, 'owner', '/avatar.jpg', 'Free', 0, ?)`,
  ).run(id, name, username, email, hash, nowIso())
  const user = await db.query<DbUser>('SELECT * FROM users WHERE id = ?').get(id)
  if (!user) return c.json({ error: 'สมัครใช้งานไม่สำเร็จ' }, 500)
  const { token } = await createSession(id)
  setSessionCookie(c, token)
  return c.json({ session: await toSession(user) })
})

authRoutes.post('/login', async (c) => {
  const limited = await enforceRateLimit(c, `login:ip:${clientIp(c)}`, 20, 60 * 1000)
  if (limited) return limited
  const body = await c.req.json().catch(() => null) as { email?: string; password?: string } | null
  const email = body?.email?.trim().toLowerCase() ?? ''
  const password = body?.password ?? ''
  if (password.length < 8) return c.json({ error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' }, 400)
  const emailLimited = await enforceRateLimit(c, `login:email:${email}`, 5, 60 * 1000)
  if (emailLimited) return emailLimited
  if (email === 'blocked@rookar.co') return c.json({ error: 'บัญชีนี้ถูกระงับชั่วคราว กรุณาติดต่อทีมงาน' }, 403)

  const user = await db.query<DbUser>('SELECT * FROM users WHERE email = ?').get(email)
  const passwordValid = await verifyPassword(password, user?.password_hash ?? DUMMY_PASSWORD_HASH)
  if (!user || !passwordValid) {
    return c.json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, 401)
  }
  if (needsPasswordRehash(user.password_hash)) {
    try {
      const upgraded = await hashPassword(password)
      await db.query('UPDATE users SET password_hash = ? WHERE id = ?').run(upgraded, user.id)
      user.password_hash = upgraded
    } catch (error) {
      console.error('[auth] password rehash failed', error)
    }
  }
  const { token } = await createSession(user.id)
  setSessionCookie(c, token)
  return c.json({ session: await toSession(user) })
})

authRoutes.post('/logout', async (c) => {
  await destroySession(c)
  return c.json({ ok: true })
})

authRoutes.post('/forgot-password', async (c) => {
  const limited = await enforceRateLimit(c, `forgot:ip:${clientIp(c)}`, 10, 60 * 60 * 1000)
  if (limited) return limited
  const body = await c.req.json().catch(() => null) as { email?: string } | null
  const email = body?.email?.trim().toLowerCase() ?? ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: 'รูปแบบอีเมลไม่ถูกต้อง' }, 400)
  }
  const emailLimited = await enforceRateLimit(c, `forgot:email:${email}`, 3, 60 * 60 * 1000)
  if (emailLimited) return emailLimited

  const user = await db.query<DbUser>('SELECT * FROM users WHERE email = ?').get(email)
  if (user) {
    const { token } = await createPasswordReset(user.id)
    const baseUrl = c.get('appUrl') || env.appUrl
    const resetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`
    try {
      await sendPasswordResetEmail(user.email, resetUrl)
    } catch (error) {
      console.error('[mail] failed to send password reset', error)
    }
    if (env.allowDevReset) {
      return c.json({ ok: true, devResetUrl: resetUrl })
    }
  }

  return c.json({ ok: true })
})

authRoutes.post('/reset-password', async (c) => {
  const limited = await enforceRateLimit(c, `reset:ip:${clientIp(c)}`, 10, 60 * 60 * 1000)
  if (limited) return limited
  const body = await c.req.json().catch(() => null) as { token?: string; password?: string } | null
  const token = body?.token?.trim() ?? ''
  const password = body?.password ?? ''
  if (!token) return c.json({ error: 'ลิงก์ตั้งรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว' }, 400)
  if (password.length < 8) return c.json({ error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' }, 400)

  const userId = await consumePasswordReset(token)
  if (!userId) return c.json({ error: 'ลิงก์ตั้งรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว' }, 400)

  const hash = await hashPassword(password)
  await db.query('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, userId)
  await invalidateUserSessions(userId)
  return c.json({ ok: true })
})

authRoutes.get('/session', async (c) => {
  const user = await getSessionUser(c)
  if (!user) return c.json({ session: null })
  return c.json({ session: await toSession(user) })
})
