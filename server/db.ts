import { getSqlClient, type SqlClient, type SqlStatement } from './runtime'

export type D1ResultLike<T> = {
  results?: T[]
  success?: boolean
  meta?: { changes?: number }
}

export interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementLike
  first<T = unknown>(): Promise<T | null>
  all<T = unknown>(): Promise<D1ResultLike<T>>
  run(): Promise<D1ResultLike<unknown>>
}

export interface D1DatabaseLike {
  prepare(sql: string): D1PreparedStatementLike
  batch<T = unknown>(statements: D1PreparedStatementLike[]): Promise<D1ResultLike<T>[]>
}

export const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'owner',
    avatar_url TEXT,
    avatar_media_id TEXT,
    plan TEXT NOT NULL DEFAULT 'Free',
    onboarding_complete INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

  CREATE TABLE IF NOT EXISTS businesses (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    type_label TEXT NOT NULL,
    employees TEXT NOT NULL,
    revenue_range TEXT NOT NULL,
    goals_json TEXT NOT NULL DEFAULT '[]',
    skipped INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS data_sources (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    type_label TEXT NOT NULL,
    row_count INTEGER NOT NULL DEFAULT 0,
    quality TEXT NOT NULL DEFAULT 'complete',
    period TEXT NOT NULL,
    file_name TEXT NOT NULL,
    is_demo INTEGER NOT NULL DEFAULT 0,
    industry_id TEXT,
    industry_confidence REAL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sources_user ON data_sources(user_id, updated_at DESC);

  CREATE TABLE IF NOT EXISTS data_rows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id TEXT NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
    row_index INTEGER NOT NULL,
    occurred_on TEXT,
    amount REAL,
    label TEXT,
    payload_json TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_rows_source ON data_rows(source_id, row_index);
  CREATE INDEX IF NOT EXISTS idx_rows_date ON data_rows(occurred_on);

  CREATE TABLE IF NOT EXISTS import_previews (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    columns_json TEXT NOT NULL,
    rows_json TEXT NOT NULL,
    errors_json TEXT NOT NULL,
    total_rows INTEGER NOT NULL,
    valid_rows INTEGER NOT NULL,
    duplicate_rows INTEGER NOT NULL,
    error_rows INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data_json TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (user_id, id)
  );
  CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id, updated_at DESC);

  CREATE TABLE IF NOT EXISTS user_agents (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS password_resets (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);

  CREATE TABLE IF NOT EXISTS import_preview_rows (
    preview_id TEXT NOT NULL REFERENCES import_previews(id) ON DELETE CASCADE,
    row_index INTEGER NOT NULL,
    payload_json TEXT NOT NULL,
    PRIMARY KEY (preview_id, row_index)
  );
  CREATE INDEX IF NOT EXISTS idx_import_previews_expires ON import_previews(expires_at);

  CREATE TABLE IF NOT EXISTS macro_cache (
    cache_key TEXT PRIMARY KEY,
    payload_json TEXT NOT NULL,
    saved_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rate_limits (
    key TEXT PRIMARY KEY,
    count INTEGER NOT NULL,
    reset_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON rate_limits(reset_at);

  CREATE TABLE IF NOT EXISTS media_files (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('avatar','chat_image','attachment','plan_image')),
    object_key TEXT NOT NULL UNIQUE,
    thumb_key TEXT,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
    thumb_size_bytes INTEGER,
    sha256 TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','deleted')),
    created_at TEXT NOT NULL,
    deleted_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_media_user_created ON media_files(user_id, status, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_media_status_created ON media_files(status, created_at);
  CREATE INDEX IF NOT EXISTS idx_media_sha ON media_files(user_id, sha256);

  CREATE TABLE IF NOT EXISTS media_links (
    media_id TEXT NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    owner_type TEXT NOT NULL CHECK (owner_type IN ('avatar','message','plan','scenario')),
    owner_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (media_id, owner_type, user_id, owner_id)
  );
  CREATE INDEX IF NOT EXISTS idx_media_links_owner ON media_links(user_id, owner_type, owner_id);

  CREATE TABLE IF NOT EXISTS media_usage (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    file_count INTEGER NOT NULL DEFAULT 0,
    bytes_used INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ai_usage (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period TEXT NOT NULL,
    message_count INTEGER NOT NULL DEFAULT 0,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (user_id, period)
  );
  CREATE INDEX IF NOT EXISTS idx_ai_usage_period ON ai_usage(period);
`
export type DbUser = {
  id: string
  name: string
  username: string | null
  email: string
  password_hash: string
  role: 'owner' | 'manager' | 'staff' | 'admin'
  avatar_url: string | null
  avatar_media_id: string | null
  plan: 'Free' | 'Pro' | 'Enterprise'
  onboarding_complete: number
  created_at: string
}

export function createD1SqlClient(database: D1DatabaseLike): SqlClient {
  return {
    async all<T>(sql: string, params: unknown[] = []) {
      const result = await database.prepare(sql).bind(...params).all<T>()
      return result.results ?? []
    },
    async first<T>(sql: string, params: unknown[] = []) {
      return database.prepare(sql).bind(...params).first<T>()
    },
    async run(sql: string, params: unknown[] = []) {
      const result = await database.prepare(sql).bind(...params).run()
      return { changes: result.meta?.changes ?? 0 }
    },
    async batch(statements: SqlStatement[]) {
      if (statements.length === 0) return
      await database.batch(statements.map((statement) => database.prepare(statement.sql).bind(...statement.params)))
    },
  }
}

export const db = {
  query<T = unknown>(sql: string) {
    return {
      all: (...params: unknown[]) => getSqlClient().all<T>(sql, params),
      get: (...params: unknown[]) => getSqlClient().first<T>(sql, params),
      run: (...params: unknown[]) => getSqlClient().run(sql, params),
    }
  },
  batch(statements: SqlStatement[]) {
    return getSqlClient().batch(statements)
  },
}

export async function batchInChunks(statements: SqlStatement[], size = 80) {
  const client = getSqlClient()
  for (let index = 0; index < statements.length; index += size) {
    await client.batch(statements.slice(index, index + size))
  }
}
