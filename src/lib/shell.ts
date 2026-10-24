import { ref } from 'vue'

const WIDTH_KEY = 'rookar.sidebar.width'
const COLLAPSED_KEY = 'rookar.sidebar.collapsed'
export const SIDEBAR_MIN_WIDTH = 220
export const SIDEBAR_MAX_WIDTH = 400
const DEFAULT_WIDTH = 248

function readWidth() {
  if (typeof window === 'undefined') return DEFAULT_WIDTH
  const stored = Number(window.localStorage.getItem(WIDTH_KEY))
  if (!Number.isFinite(stored) || stored <= 0) return DEFAULT_WIDTH
  return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, stored))
}

function readCollapsed() {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(COLLAPSED_KEY) === 'true'
}

export const sidebarWidth = ref(readWidth())
export const sidebarCollapsed = ref(readCollapsed())

export function setSidebarWidth(value: number) {
  sidebarWidth.value = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, Math.round(value)))
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
