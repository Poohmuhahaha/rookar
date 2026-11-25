import { app } from './app'
import { createD1SqlClient, type D1DatabaseLike } from './db'
import { setRuntime, type RuntimeConfig } from './runtime'

type AssetsBinding = {
  fetch(request: Request): Promise<Response>
}

export type WorkerEnv = {
  DB: D1DatabaseLike
  ASSETS: AssetsBinding
  APP_URL?: string
  AI_PROVIDER?: string
  OPENAI_API_KEY?: string
  OPENAI_MODEL?: string
  OPENAI_BASE_URL?: string
  OPENAI_USER_AGENT?: string
  RESEND_API_KEY?: string
  MAIL_FROM?: string
}

function runtimeConfig(env: WorkerEnv, requestUrl: URL): RuntimeConfig {
  const openaiApiKey = env.OPENAI_API_KEY ?? ''
  return {
    port: 8787,
    databaseUrl: 'd1',
    sessionCookie: 'rookar_session',
    sessionTtlMs: 1000 * 60 * 60 * 24 * 30,
    nodeEnv: 'production',
    appUrl: env.APP_URL ?? requestUrl.origin,
    aiProvider: (env.AI_PROVIDER ?? (openaiApiKey ? 'openai' : 'mock')).toLowerCase(),
    openaiApiKey,
    openaiModel: env.OPENAI_MODEL ?? 'gpt-4.1-mini',
    openaiBaseUrl: env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
    openaiUserAgent: env.OPENAI_USER_AGENT ?? 'rookar-agent/1.0',
    resendApiKey: env.RESEND_API_KEY ?? '',
    mailFrom: env.MAIL_FROM ?? 'ROOKAR <no-reply@rookar.co>',
    resetTokenTtlMs: 1000 * 60 * 30,
    allowDevReset: false,
    trustCfConnectingIp: true,
    maxImportBytes: 4 * 1024 * 1024,
    maxImportRows: 2000,
  }
}

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: { waitUntil(promise: Promise<unknown>): void; passThroughOnException(): void; props: Record<string, unknown> }): Promise<Response> {
    const url = new URL(request.url)
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request)

    if (!env.DB) return Response.json({ error: 'Database binding is not configured' }, { status: 500 })
    setRuntime(createD1SqlClient(env.DB), runtimeConfig(env, url))
    return app.fetch(request, env, ctx)
  },
}
