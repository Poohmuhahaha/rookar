import { app } from './app'
import { initBunRuntime } from './bunDb'

const config = initBunRuntime()
console.log(`ROOKAR API running at http://localhost:${config.port}`)

export default {
  port: config.port,
  idleTimeout: 120,
  fetch: app.fetch,
}
