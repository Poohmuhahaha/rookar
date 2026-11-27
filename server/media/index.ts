import type { MediaStore } from './types'

let current: MediaStore | null = null

export function setMediaStore(store: MediaStore) {
  current = store
}

export function getMediaStore(): MediaStore | null {
  return current
}

export type { MediaStore, MediaStoreObject } from './types'
