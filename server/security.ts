import type { Context } from 'hono'
import { db } from './db'
import { getRuntimeConfig } from './runtime'

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
const MAX_BUCKETS = 10_000

function cleanup(now: number) {
  if (buckets.size < MAX_BUCKETS) return
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
  if (buckets.size >= MAX_BUCKETS) {
    const oldest = buckets.keys().next().value
    if (oldest) buckets.delete(oldest)
  }
}

export function clientIp(c: Context): string {
  // Workers only: Cloudflare overwrites this header at the edge.
  if (getRuntimeConfig().trustCfConnectingIp) {
    return c.req.header('cf-connecting-ip') ?? 'unknown'
  }
  // Docker/local: Caddy overwrites X-Real-IP before proxying to the API.
  return c.req.header('x-real-ip') ?? 'local'
}

function memoryRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  cleanup(now)
  const current = buckets.get(key)
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfter: 0 }
  }
  current.count += 1
  return {
    allowed: current.count <= limit,
    retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  }
}

export async function enforceRateLimit(
  c: Context,
  key: string,
  limit: number,
  windowMs: number,
): Promise<Response | null> {
  const now = Date.now()
  const resetAt = now + windowMs
  let allowed = false
  let retryAfter = 0

  try {
    await db.query(
      `INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)
       ON CONFLICT(key) DO UPDATE SET
         count = CASE WHEN rate_limits.reset_at <= ? THEN 1 ELSE rate_limits.count + 1 END,
         reset_at = CASE WHEN rate_limits.reset_at <= ? THEN ? ELSE rate_limits.reset_at END`,
    ).run(key, resetAt, now, now, resetAt)
    const row = await db.query<{ count: number; reset_at: number }>(
      'SELECT count, reset_at FROM rate_limits WHERE key = ?',
    ).get(key)
    allowed = (row?.count ?? limit + 1) <= limit
    retryAfter = row ? Math.max(1, Math.ceil((row.reset_at - now) / 1000)) : 1
    if (Math.random() < 0.02) {
      await db.query('DELETE FROM rate_limits WHERE reset_at <= ?').run(now)
    }
  } catch (error) {
    console.error('[security] rate limit store unavailable; using isolate memory', error)
    const fallback = memoryRateLimit(key, limit, windowMs)
    allowed = fallback.allowed
    retryAfter = fallback.retryAfter
  }

  if (allowed) return null
  return c.json(
    { error: 'คำขอมากเกินไป กรุณาลองใหม่ภายหลัง' },
    429,
    { 'Retry-After': String(retryAfter) },
  )
}


export function publicErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback
  const message = error.message.trim()
  if (!message || /sqlite|constraint|unique|syntax|no such|not authorized/i.test(message)) return fallback
  return /[\u0E00-\u0E7F]/.test(message) ? message : fallback
}
