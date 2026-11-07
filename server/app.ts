import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { bodyLimit } from 'hono/body-limit'
import { requireAuth } from './auth'
import type { AppEnv } from './types'
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

export const app = new Hono<AppEnv>()

app.use('*', logger())
app.use('*', secureHeaders())
app.use('/api/*', bodyLimit({
  maxSize: 15 * 1024 * 1024,
  onError: (c) => c.json({ error: 'ไฟล์มีขนาดใหญ่เกินไป' }, 413),
}))

app.get('/api/health', (c) => c.json({ ok: true, service: 'rookar-api' }))
app.route('/api/auth', authRoutes)

app.use('/api/*', async (c, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(c.req.method)) {
    const origin = c.req.header('origin')
    if (origin) {
      try {
        const originHost = new URL(origin).host
        const requestHost = c.req.header('host')
        const allowed = ['localhost:5173', '127.0.0.1:5173', 'localhost:8787', '127.0.0.1:8787', 'localhost:8090', '127.0.0.1:8090']
        if (originHost !== requestHost && !allowed.includes(originHost)) {
          return c.json({ error: 'origin not allowed' }, 403)
        }
      } catch {
        return c.json({ error: 'origin not allowed' }, 403)
      }
    }
  }
  await next()
})

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

app.notFound((c) => c.json({ error: 'not found' }, 404))
app.onError((error, c) => {
  console.error(error)
  return c.json({ error: error instanceof Error ? error.message : 'internal server error' }, 500)
})
