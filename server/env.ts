import { getRuntimeConfig, type RuntimeConfig } from './runtime'

export type { RuntimeConfig }

export const env = new Proxy({} as RuntimeConfig, {
  get(_target, property: string | symbol) {
    return getRuntimeConfig()[property as keyof RuntimeConfig]
  },
})
