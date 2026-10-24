import { reactive } from 'vue'

export type ToastTone = 'success' | 'error' | 'info'

export interface ToastItem {
  id: number
  title: string
  description?: string
  tone: ToastTone
}

export const toasts = reactive<ToastItem[]>([])

let toastId = 0

export function pushToast(
  title: string,
  options: { description?: string; tone?: ToastTone; duration?: number } = {},
) {
  const id = ++toastId
  toasts.push({
    id,
    title,
    description: options.description,
    tone: options.tone ?? 'success',
  })
  window.setTimeout(() => removeToast(id), options.duration ?? 4200)
  return id
}

export function removeToast(id: number) {
  const index = toasts.findIndex((toast) => toast.id === id)
  if (index >= 0) toasts.splice(index, 1)
}

export function useToast() {
  return {
    push: pushToast,
    success: (title: string, description?: string) =>
      pushToast(title, { description, tone: 'success' }),
    error: (title: string, description?: string) =>
      pushToast(title, { description, tone: 'error' }),
    info: (title: string, description?: string) =>
      pushToast(title, { description, tone: 'info' }),
  }
}
