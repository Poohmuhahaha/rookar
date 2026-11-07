import { app } from './app'
import { env } from './env'
console.log(`ROOKAR API running at http://localhost:${env.port}`)

export default {
  port: env.port,
  fetch: app.fetch,
}
