export type RuntimeConfig = {
  port: number
  databaseUrl: string
  sessionCookie: string
  sessionTtlMs: number
  nodeEnv: string
  appUrl: string
  aiProvider: string
  openaiApiKey: string
  openaiModel: string
  openaiBaseUrl: string
  openaiUserAgent: string
  resendApiKey: string
  mailFrom: string
  resetTokenTtlMs: number
  allowDevReset: boolean
  trustCfConnectingIp: boolean
  maxImportBytes: number
  maxImportRows: number
}

export type SqlStatement = {
  sql: string
  params: unknown[]
}

export interface SqlClient {
  all<T>(sql: string, params?: unknown[]): Promise<T[]>
  first<T>(sql: string, params?: unknown[]): Promise<T | null>
  run(sql: string, params?: unknown[]): Promise<{ changes: number }>
  batch(statements: SqlStatement[]): Promise<void>
}

type Runtime = {
  db: SqlClient
  config: RuntimeConfig
}

let runtime: Runtime | null = null

export function setRuntime(db: SqlClient, config: RuntimeConfig) {
  runtime = { db, config }
}

export function getSqlClient(): SqlClient {
  if (!runtime) throw new Error('Database runtime has not been initialized')
  return runtime.db
}

export function getRuntimeConfig(): RuntimeConfig {
  if (!runtime) throw new Error('Runtime config has not been initialized')
  return runtime.config
}

export function runtimeReady() {
  return runtime !== null
}
