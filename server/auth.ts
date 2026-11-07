import { createHash, randomBytes } from 'node:crypto'
import { createMiddleware } from 'hono/factory'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { db, type DbUser } from './db'
import { env } from './env'
import type { AppEnv } from './types'
import type { BusinessProfile, Session } from '../src/types'
import { initialsFromName } from '../src/lib/format'

type BusinessRow = {
  name: string
  type: string
  type_label: string
  employees: string
  revenue_range: string
  goals_json: string
  skipped: number
  updated_at: string
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(8).toString('hex')}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return Bun.password.verify(password, hash)
}

export function createSession(userId: string): { token: string; expiresAt: string } {
  const token = randomBytes(32).toString('base64url')
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + env.sessionTtlMs).toISOString()
  db.query('DELETE FROM sessions WHERE expires_at <= ?').run(nowIso())
  db.query(
    'INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)',
  ).run(tokenHash, userId, expiresAt, nowIso())
  return { token, expiresAt }
}

export function createPasswordReset(userId: string): { token: string; expiresAt: string } {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + env.resetTokenTtlMs).toISOString()
  db.query('DELETE FROM password_resets WHERE user_id = ?').run(userId)
  db.query(
    'INSERT INTO password_resets (token_hash, user_id, expires_at, used_at, created_at) VALUES (?, ?, ?, NULL, ?)',
  ).run(hashToken(token), userId, expiresAt, nowIso())
  return { token, expiresAt }
}

export function consumePasswordReset(token: string): string | null {
  const tokenHash = hashToken(token)
  const row = db
    .query(
      `SELECT user_id FROM password_resets
       WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?`,
    )
    .get(tokenHash, nowIso()) as { user_id: string } | null
  if (!row) return null
  db.query('UPDATE password_resets SET used_at = ? WHERE token_hash = ?').run(nowIso(), tokenHash)
  return row.user_id
}

export function invalidateUserSessions(userId: string) {
  db.query('DELETE FROM sessions WHERE user_id = ?').run(userId)
}

export function setSessionCookie(c: Parameters<typeof setCookie>[0], token: string) {
  setCookie(c, env.sessionCookie, token, {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    secure: env.nodeEnv === 'production',
    maxAge: Math.floor(env.sessionTtlMs / 1000),
  })
}

export function clearSessionCookie(c: Parameters<typeof deleteCookie>[0]) {
  deleteCookie(c, env.sessionCookie, { path: '/' })
}

export function getSessionUser(c: Parameters<typeof getCookie>[0]): DbUser | null {
  const token = getCookie(c, env.sessionCookie)
  if (!token) return null
  const tokenHash = hashToken(token)
  const row = db
    .query(
      `SELECT u.* FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .get(tokenHash, nowIso()) as DbUser | null
  return row ?? null
}

export function destroySession(c: Parameters<typeof getCookie>[0]) {
  const token = getCookie(c, env.sessionCookie)
  if (token) db.query('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token))
  clearSessionCookie(c)
}

export function getBusiness(userId: string): BusinessProfile | null {
  const row = db.query('SELECT * FROM businesses WHERE user_id = ?').get(userId) as BusinessRow | null
  if (!row) return null
  let goals: string[] = []
  try {
    goals = JSON.parse(row.goals_json) as string[]
  } catch {
    goals = []
  }
  return {
    name: row.name,
    type: row.type,
    typeLabel: row.type_label,
    employees: row.employees,
    revenueRange: row.revenue_range,
    goals,
    skipped: Boolean(row.skipped),
  }
}

export function toSession(user: DbUser): Session {
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      initials: initialsFromName(user.name),
      avatarUrl: user.avatar_url ?? '/avatar.jpg',
    },
    business: getBusiness(user.id),
    onboardingComplete: Boolean(user.onboarding_complete),
    plan: user.plan,
    createdAt: user.created_at,
  }
}

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const user = getSessionUser(c)
  if (!user) return c.json({ error: 'unauthorized' }, 401)
  c.set('user', user)
  await next()
})
