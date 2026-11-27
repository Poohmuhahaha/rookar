import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'
import { assertSafeKey, type MediaStore, type MediaStoreObject } from './types'

export class FsMediaStore implements MediaStore {
  private readonly root: string

  constructor(root = process.env.MEDIA_DIR ?? './.data/media') {
    this.root = resolve(root)
  }

  private pathFor(key: string) {
    assertSafeKey(key)
    const target = resolve(this.root, key)
    if (target !== this.root && !target.startsWith(`${this.root}${sep}`)) {
      throw new Error('invalid media key')
    }
    return target
  }

  async put(key: string, data: ArrayBuffer | Uint8Array): Promise<void> {
    const target = this.pathFor(key)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, new Uint8Array(data))
  }

  async get(key: string): Promise<MediaStoreObject | null> {
    try {
      const data = await readFile(this.pathFor(key))
      return {
        body: new Response(data).body!,
        size: data.byteLength,
      }
    } catch {
      return null
    }
  }

  async delete(key: string): Promise<void> {
    await rm(this.pathFor(key), { force: true })
  }
}
