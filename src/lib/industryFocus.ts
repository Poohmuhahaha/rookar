import { ref } from 'vue'
import { normalizeIndustryId, type IndustryId } from './industries'
import { getSession } from './mockApi'

const STORAGE_KEY = 'rookar.industry.focus'

function initialIndustry(): IndustryId {
  if (typeof localStorage === 'undefined') return 'fnb'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) return normalizeIndustryId(stored)
  return normalizeIndustryId(getSession()?.business?.type)
}

export const industryFocus = ref<IndustryId>(initialIndustry())

export function setIndustryFocus(industryId: IndustryId) {
  industryFocus.value = industryId
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, industryId)
  }
}
