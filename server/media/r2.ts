import type { MediaStore, MediaStoreObject } from './types'

export interface R2BucketLike {
  put(
    key: string,
    value: ArrayBuffer | Uint8Array,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>
  get(key: string): Promise<{
    body: ReadableStream
    httpMetadata?: { contentType?: string }
    size?: number
    etag?: string
  } | null>
  delete(key: string): Promise<void>
}

export class R2MediaStore implements MediaStore {
  constructor(private readonly bucket: R2BucketLike) {}

  async put(key: string, data: ArrayBuffer | Uint8Array, contentType: string): Promise<void> {
    await this.bucket.put(key, data, { httpMetadata: { contentType } })
  }

  async get(key: string): Promise<MediaStoreObject | null> {
    const object = await this.bucket.get(key)
    if (!object) return null
    return {
      body: object.body,
      contentType: object.httpMetadata?.contentType,
      size: object.size,
      etag: object.etag,
    }
  }

  async delete(key: string): Promise<void> {
    await this.bucket.delete(key)
  }
}
