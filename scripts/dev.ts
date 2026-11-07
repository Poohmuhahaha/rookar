const api = Bun.spawn(['bun', 'run', 'dev:api'], { stdout: 'inherit', stderr: 'inherit' })
const web = Bun.spawn(['bun', 'run', 'dev:web'], { stdout: 'inherit', stderr: 'inherit' })

function shutdown() {
  api.kill()
  web.kill()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

const code = await Promise.race([api.exited, web.exited])
shutdown()
process.exit(code)
