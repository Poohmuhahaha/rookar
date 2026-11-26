import { Hono } from 'hono'
import type { Context } from 'hono'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { bodyLimit } from 'hono/body-limit'
import { requireAuth } from './auth'
import type { AppEnv } from './types'
import { env } from './env'
import { authRoutes } from './routes/auth'
import { businessRoutes } from './routes/business'
import { sourceRoutes } from './routes/sources'
import { importRoutes } from './routes/imports'
import { dashboardRoutes } from './routes/dashboard'
import { macroRoutes } from './routes/macro'
import { conversationRoutes } from './routes/conversations'
import { agentRoutes } from './routes/agents'
import { meRoutes } from './routes/me'
import { chatRoutes } from './routes/chat'
import { mediaRoutes } from './routes/media'

export const app = new Hono<AppEnv>()

app.use('*', logger())
app.use('*', secureHeaders())

const tooLarge = (c: Context) => c.json({ error: 'ข้อมูลมีขนาดใหญ่เกินไป' }, 413)

app.use('/api/*', bodyLimit({ maxSize: 15 * 1024 * 1024, onError: tooLarge }))
app.use('/api/auth/*', bodyLimit({ maxSize: 64 * 1024, onError: tooLarge }))
app.use('/api/chat/*', bodyLimit({ maxSize: 256 * 1024, onError: tooLarge }))
app.use('/api/conversations', bodyLimit({ maxSize: 1024 * 1024, onError: tooLarge }))
app.use('/api/agents', bodyLimit({ maxSize: 1024 * 1024, onError: tooLarge }))
app.use('/api/business', bodyLimit({ maxSize: 64 * 1024, onError: tooLarge }))
app.use('/api/me', bodyLimit({ maxSize: 64 * 1024, onError: tooLarge }))
app.use('/api/imports/preview', bodyLimit({ maxSize: 12 * 1024 * 1024, onError: tooLarge }))
app.use('/api/media', bodyLimit({ maxSize: 10 * 1024 * 1024, onError: tooLarge }))

app.use('*', async (c, next) => {
  c.set('appUrl', env.appUrl || new URL(c.req.url).origin)
  await next()
})

app.get('/api/health', (c) => c.json({ ok: true, service: 'rookar-api' }))

app.use('/api/*', async (c, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(c.req.method)) {
    const path = new URL(c.req.url).pathname
    const contentType = c.req.header('content-type')?.toLowerCase() ?? ''
    const allowedType =
      contentType.startsWith('application/json') ||
      (path === '/api/imports/preview' && contentType.startsWith('multipart/form-data')) ||
      (path === '/api/media' && contentType.startsWith('multipart/form-data'))
    if (contentType && !allowedType) {
      return c.json({ error: 'unsupported content type' }, 415)
    }

    const origin = c.req.header('origin')
    if (origin) {
      try {
        const originUrl = new URL(origin)
        const originHost = originUrl.host
        const requestHost = c.req.header('host')
        const appOrigin = (() => {
          try { return new URL(env.appUrl).host } catch { return '' }
        })()
        const allowed = new Set([
          'localhost:5173', '127.0.0.1:5173', 'localhost:5174', '127.0.0.1:5174',
          'localhost:8787', '127.0.0.1:8787', 'localhost:8788', '127.0.0.1:8788',
          'localhost:8789', '127.0.0.1:8789', 'localhost:8790', '127.0.0.1:8790',
          'localhost:8090', '127.0.0.1:8090', appOrigin,
        ])
        const localHostname =
          originUrl.hostname === 'localhost' ||
          originUrl.hostname === '127.0.0.1' ||
          originUrl.hostname.endsWith('.local') ||
          /^10\./.test(originUrl.hostname) ||
          /^192\.168\./.test(originUrl.hostname) ||
          /^172\.(1[6-9]|2\d|3[01])\./.test(originUrl.hostname)
        const devLocalOrigin = env.nodeEnv !== 'production' && localHostname
        if (originHost !== requestHost && !allowed.has(originHost) && !devLocalOrigin) {
          return c.json({ error: 'origin not allowed' }, 403)
        }
      } catch {
        return c.json({ error: 'origin not allowed' }, 403)
      }
    }
  }
  await next()
})

app.use('/api/*', async (c, next) => {
  await next()
  if (c.req.method === 'GET' && !new URL(c.req.url).pathname.startsWith('/api/media/')) {
    c.header('Cache-Control', 'no-store')
  }
})

app.route('/api/auth', authRoutes)

app.use('/api/*', requireAuth)

app.route('/api/business', businessRoutes)
app.route('/api/sources', sourceRoutes)
app.route('/api/imports', importRoutes)
app.route('/api/dashboard', dashboardRoutes)
app.route('/api/macro', macroRoutes)
app.route('/api/conversations', conversationRoutes)
app.route('/api/agents', agentRoutes)
app.route('/api/me', meRoutes)
app.route('/api/chat', chatRoutes)
app.route('/api/media', mediaRoutes)

app.notFound((c) => c.json({ error: 'not found' }, 404))
app.onError((error, c) => {
  console.error('[api] unhandled error', error)
  return c.json({ error: 'internal server error' }, 500)
})
