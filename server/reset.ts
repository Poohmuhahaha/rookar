import { rmSync } from 'node:fs'
for (const suffix of ['', '-wal', '-shm']) {
  rmSync(`./data/rookar-dev.sqlite${suffix}`, { force: true })
}
console.log('Removed ./data/rookar-dev.sqlite')
