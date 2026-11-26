import { Database } from 'bun:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { SCHEMA_SQL } from './db'
import { setMediaStore } from './media'
import { FsMediaStore } from './media/fs'
import { setRuntime, type RuntimeConfig, type SqlClient, type SqlStatement } from './runtime'

function configureDatabase(sqlite: Database) {
  sqlite.exec('PRAGMA foreign_keys = ON;')
  sqlite.exec(SCHEMA_SQL)

  const userColumns = sqlite.query('PRAGMA table_info(users)').all() as { name: string }[]
  if (!userColumns.some((column) => column.name === 'username')) {
    sqlite.exec('ALTER TABLE users ADD COLUMN username TEXT;')
  }
  if (!userColumns.some((column) => column.name === 'avatar_media_id')) {
    sqlite.exec('ALTER TABLE users ADD COLUMN avatar_media_id TEXT;')
  }
  sqlite.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);')

  const sourceColumns = sqlite.query('PRAGMA table_info(data_sources)').all() as { name: string }[]
  if (!sourceColumns.some((column) => column.name === 'industry_confidence')) {
    sqlite.exec('ALTER TABLE data_sources ADD COLUMN industry_confidence REAL;')
  }

  const conversationColumns = sqlite.query('PRAGMA table_info(conversations)').all() as { name: string; pk: number }[]
  const conversationPk = conversationColumns.filter((column) => column.pk > 0).map((column) => column.name).sort().join(',')
  if (conversationPk !== 'id,user_id') {
    sqlite.exec(`
      CREATE TABLE conversations_new (
        id TEXT NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        data_json TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (user_id, id)
      );
      INSERT OR IGNORE INTO conversations_new (id, user_id, data_json, updated_at)
        SELECT id, user_id, data_json, updated_at FROM conversations;
      DROP TABLE conversations;
      ALTER TABLE conversations_new RENAME TO conversations;
      CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id, updated_at DESC);
    `)
  }

  sqlite.exec('DELETE FROM data_sources WHERE is_demo = 1;')
}

function createBunSqlClient(databaseUrl: string): SqlClient {
  if (databaseUrl !== ':memory:') mkdirSync(dirname(databaseUrl), { recursive: true })
  const sqlite = new Database(databaseUrl, { create: true })
  if (databaseUrl !== ':memory:') sqlite.exec('PRAGMA journal_mode = WAL;')
  configureDatabase(sqlite)

  return {
    async all<T>(sql: string, params: unknown[] = []) {
      return sqlite.query(sql).all(...params as never[]) as T[]
    },
    async first<T>(sql: string, params: unknown[] = []) {
      return (sqlite.query(sql).get(...params as never[]) ?? null) as T | null
    },
    async run(sql: string, params: unknown[] = []) {
      const result = sqlite.query(sql).run(...params as never[])
      return { changes: Number(result.changes ?? 0) }
    },
    async batch(statements: SqlStatement[]) {
      if (statements.length === 0) return
      const transaction = sqlite.transaction(() => {
        for (const statement of statements) {
          sqlite.query(statement.sql).run(...statement.params as never[])
        }
      })
      transaction()
    },
  }
}

function processConfig(overrides: Partial<RuntimeConfig> = {}): RuntimeConfig {
  const openaiApiKey = overrides.openaiApiKey ?? process.env.OPENAI_API_KEY ?? ''
  const aiProvider = (
    overrides.aiProvider ??
    process.env.AI_PROVIDER ??
    (openaiApiKey ? 'openai' : 'mock')
  ).toLowerCase()

  return {
    port: overrides.port ?? Number(process.env.PORT ?? 8787),
    databaseUrl: overrides.databaseUrl ?? process.env.DATABASE_URL ?? './data/rookar-dev.sqlite',
    sessionCookie: overrides.sessionCookie ?? 'rookar_session',
    sessionTtlMs: overrides.sessionTtlMs ?? 1000 * 60 * 60 * 24 * 30,
    nodeEnv: overrides.nodeEnv ?? process.env.NODE_ENV ?? 'development',
    appUrl: overrides.appUrl ?? process.env.APP_URL ?? 'http://localhost:8090',
    aiProvider,
    openaiApiKey,
    openaiModel: overrides.openaiModel ?? process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
    openaiBaseUrl: overrides.openaiBaseUrl ?? process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
    openaiUserAgent: overrides.openaiUserAgent ?? process.env.OPENAI_USER_AGENT ?? 'rookar-agent/1.0',
    resendApiKey: overrides.resendApiKey ?? process.env.RESEND_API_KEY ?? '',
    mailFrom: overrides.mailFrom ?? process.env.MAIL_FROM ?? 'ROOKAR <no-reply@rookar.co>',
    resetTokenTtlMs: overrides.resetTokenTtlMs ?? 1000 * 60 * 30,
    allowDevReset: overrides.allowDevReset ?? process.env.ALLOW_DEV_RESET === '1',
    trustCfConnectingIp: overrides.trustCfConnectingIp ?? false,
    maxImportBytes: overrides.maxImportBytes ?? 10 * 1024 * 1024,
    maxImportRows: overrides.maxImportRows ?? 5000,
  }
}

export function initBunRuntime(overrides: Partial<RuntimeConfig> = {}) {
  const config = processConfig(overrides)
  setRuntime(createBunSqlClient(config.databaseUrl), config)
  setMediaStore(new FsMediaStore(process.env.MEDIA_DIR ?? './.data/media'))
  return config
}

export function createBunClient(databaseUrl: string) {
  return createBunSqlClient(databaseUrl)
}
