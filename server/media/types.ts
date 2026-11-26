export type MediaStoreObject = {
  body: ReadableStream
  contentType?: string
  size?: number
  etag?: string
}

export interface MediaStore {
  put(key: string, data: ArrayBuffer | Uint8Array, contentType: string): Promise<void>
  get(key: string): Promise<MediaStoreObject | null>
  delete(key: string): Promise<void>
}

export function assertSafeKey(key: string) {
  if (!/^[A-Za-z0-9._/-]+$/.test(key) || key.includes('..') || key.startsWith('/')) {
    throw new Error('invalid media key')
  }
}
