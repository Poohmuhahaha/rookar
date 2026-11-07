import { ref } from 'vue'

const WIDTH_KEY = 'rookar.sidebar.width'
const COLLAPSED_KEY = 'rookar.sidebar.collapsed'

function viewportWidth() {
  return typeof window === 'undefined' ? 0 : window.innerWidth
}

export function sidebarMinWidth() {
  const width = viewportWidth()
  if (width >= 1920) return 340
  if (width >= 1440) return 300
  return 220
}

export function sidebarMaxWidth() {
  const width = viewportWidth()
  if (width >= 1920) return 560
  if (width >= 1440) return 480
  return 400
}

function defaultWidth() {
  const width = viewportWidth()
  if (width >= 1920) return 400
  if (width >= 1440) return 320
  return 248
}

function readWidth() {
  if (typeof window === 'undefined') return defaultWidth()
  const stored = Number(window.localStorage.getItem(WIDTH_KEY))
  if (!Number.isFinite(stored) || stored <= 0) return defaultWidth()
  return Math.min(sidebarMaxWidth(), Math.max(sidebarMinWidth(), stored))
}

function readCollapsed() {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(COLLAPSED_KEY) === 'true'
}

export const sidebarWidth = ref(readWidth())
export const sidebarCollapsed = ref(readCollapsed())

export function setSidebarWidth(value: number) {
  sidebarWidth.value = Math.min(sidebarMaxWidth(), Math.max(sidebarMinWidth(), Math.round(value)))
}

export function persistSidebarWidth() {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(WIDTH_KEY, String(sidebarWidth.value))
  }
}

export function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(COLLAPSED_KEY, String(sidebarCollapsed.value))
  }
}
