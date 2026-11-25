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

const PBKDF2_ITERATIONS = 100_000
const PASSWORD_PREFIX = 'pbkdf2-sha256'
export const DUMMY_PASSWORD_HASH = 'pbkdf2-sha256$100000$PVQzAascpJJoXW4uQiAGXw==$yStZHPJsKisnzglcpflWm+IUwt9fb9O/uL7yBM3sGaY='

function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function base64ToBytes(value: string) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function derivePassword(password: string, salt: BufferSource, iterations: number) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    key,
    256,
  )
  return new Uint8Array(bits)
}

function safeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i += 1) result |= a[i] ^ b[i]
  return result === 0
}

export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function randomToken(byteLength: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength))
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function newId(prefix: string): string {
  return `${prefix}_${randomToken(8)}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await derivePassword(password, salt, PBKDF2_ITERATIONS)
  return `${PASSWORD_PREFIX}$${PBKDF2_ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(hash)}`
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (hash.startsWith(`${PASSWORD_PREFIX}$`)) {
    const [, rawIterations, rawSalt, rawHash] = hash.split('$')
    const iterations = Number(rawIterations)
    if (!Number.isFinite(iterations) || iterations <= 0 || !rawSalt || !rawHash) return false
    try {
      const derived = await derivePassword(password, base64ToBytes(rawSalt), iterations)
      return safeEqual(derived, base64ToBytes(rawHash))
    } catch {
      return false
    }
  }
  if (hash.startsWith('$argon2')) {
    if (typeof Bun !== 'undefined' && typeof Bun.password?.verify === 'function') {
      try {
        return await Bun.password.verify(password, hash)
      } catch {
        // Fall through to the WebAssembly verifier.
      }
    }
    try {
      const { argon2Verify } = await import('hash-wasm')
      return await argon2Verify({ password, hash })
    } catch {
      return false
    }
  }
  return false
}

export function needsPasswordRehash(hash: string): boolean {
  if (!hash.startsWith(`${PASSWORD_PREFIX}$`)) return true
  const iterations = Number(hash.split('$')[1])
  return !Number.isFinite(iterations) || iterations < PBKDF2_ITERATIONS
}

function randomSessionToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: string }> {
  const token = randomSessionToken()
  const tokenHash = await hashToken(token)
  const expiresAt = new Date(Date.now() + env.sessionTtlMs).toISOString()
  await db.query('DELETE FROM sessions WHERE expires_at <= ?').run(nowIso())
  await db.query(
    'INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)',
  ).run(tokenHash, userId, expiresAt, nowIso())
  return { token, expiresAt }
}

export async function createPasswordReset(userId: string): Promise<{ token: string; expiresAt: string }> {
  const token = randomSessionToken()
  const expiresAt = new Date(Date.now() + env.resetTokenTtlMs).toISOString()
  const tokenHash = await hashToken(token)
  await db.query('DELETE FROM password_resets WHERE user_id = ?').run(userId)
  await db.query(
    'INSERT INTO password_resets (token_hash, user_id, expires_at, used_at, created_at) VALUES (?, ?, ?, NULL, ?)',
  ).run(tokenHash, userId, expiresAt, nowIso())
  return { token, expiresAt }
}

export async function consumePasswordReset(token: string): Promise<string | null> {
  const tokenHash = await hashToken(token)
  const row = await db
    .query<{ user_id: string }>(
      `SELECT user_id FROM password_resets
       WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?`,
    )
    .get(tokenHash, nowIso())
  if (!row) return null
  await db.query('UPDATE password_resets SET used_at = ? WHERE token_hash = ?').run(nowIso(), tokenHash)
  return row.user_id
}

export async function invalidateUserSessions(userId: string) {
  await db.query('DELETE FROM sessions WHERE user_id = ?').run(userId)
}

export function setSessionCookie(c: Parameters<typeof setCookie>[0], token: string) {
  const forwardedProto = c.req.header('x-forwarded-proto')?.split(',')[0]?.trim()
  const requestIsHttps = new URL(c.req.url).protocol === 'https:'
  const secure = requestIsHttps || forwardedProto === 'https'
  setCookie(c, env.sessionCookie, token, {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    secure,
    maxAge: Math.floor(env.sessionTtlMs / 1000),
  })
}

export function clearSessionCookie(c: Parameters<typeof deleteCookie>[0]) {
  deleteCookie(c, env.sessionCookie, { path: '/' })
}

export async function getSessionUser(c: Parameters<typeof getCookie>[0]): Promise<DbUser | null> {
  const token = getCookie(c, env.sessionCookie)
  if (!token) return null
  const tokenHash = await hashToken(token)
  return db
    .query<DbUser>(
      `SELECT u.* FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .get(tokenHash, nowIso())
}

export async function destroySession(c: Parameters<typeof getCookie>[0]) {
  const token = getCookie(c, env.sessionCookie)
  if (token) await db.query('DELETE FROM sessions WHERE token_hash = ?').run(await hashToken(token))
  clearSessionCookie(c)
}

export async function getBusiness(userId: string): Promise<BusinessProfile | null> {
  const row = await db.query<BusinessRow>('SELECT * FROM businesses WHERE user_id = ?').get(userId)
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

export async function toSession(user: DbUser): Promise<Session> {
  return {
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      initials: initialsFromName(user.name),
      avatarUrl: user.avatar_url ?? '/avatar.jpg',
    },
    business: await getBusiness(user.id),
    onboardingComplete: Boolean(user.onboarding_complete),
    plan: user.plan,
    createdAt: user.created_at,
  }
}

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const user = await getSessionUser(c)
  if (!user) return c.json({ error: 'unauthorized' }, 401)
  c.set('user', user)
  await next()
})
