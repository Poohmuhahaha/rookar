import type { DbUser } from './db'

export type AppEnv = {
  Variables: {
    user: DbUser
    sessionHash: string
    appUrl: string
  }
}
