export type Role = 'owner' | 'manager' | 'staff' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  initials: string
  avatarUrl?: string
}

export interface BusinessProfile {
  name: string
  type: string
  typeLabel: string
  employees: string
  revenueRange: string
  goals: string[]
  skipped?: boolean
}

export interface Session {
  user: User
  business: BusinessProfile | null
  onboardingComplete: boolean
  plan: 'Free' | 'Pro' | 'Enterprise'
  createdAt: string
}

export type DataType = 'sales' | 'materials' | 'labor' | 'expenses'
export type DataQuality = 'complete' | 'partial' | 'duplicate'

export interface DataSource {
  id: string
  name: string
  type: DataType
  typeLabel: string
  rowCount: number
  quality: DataQuality
  updatedAt: string
  period: string
  fileName: string
}

export interface KpiPoint {
  label: string
  revenue: number
  profit: number
}

export interface CostSlice {
  key: 'materials' | 'labor' | 'expenses'
  label: string
  value: number
  share: number
  color: string
}

export interface SectorBenchmark {
  sectorName: string
  sectorGdpGrowth: number
  privateConsumptionGrowth: number
  inflationCpi: number
  businessGrowth: number
  outperformance: number
  status: 'outperforming' | 'in_line' | 'underperforming'
  assessment: string
  period: string
  source: string
}

export interface DashboardSummary {
  rangeLabel: string
  revenue: number
  profit: number
  cost: number
  margin: number
  revenueDelta: number
  profitDelta: number
  costDelta: number
  marginDelta: number
  series: KpiPoint[]
  revenueSpark: number[]
  profitSpark: number[]
  costSpark: number[]
  marginSpark: number[]
  costBreakdown: CostSlice[]
  insight: {
    title: string
    body: string
    action: string
    prompt: string
  }
  benchmark?: SectorBenchmark
  lastUpdated: string
}

export interface ImportErrorRow {
  row: number
  field: string
  message: string
}

export interface ImportPreview {
  fileName: string
  fileSize: number
  totalRows: number
  validRows: number
  duplicateRows: number
  errorRows: number
  columns: string[]
  rows: Record<string, string>[]
  errors: ImportErrorRow[]
  type: DataType
}

export interface Citation {
  id: string
  title: string
  period: string
  value: string
  source: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
  citations?: Citation[]
  feedback?: 'up' | 'down' | null
  createdAt: string
  error?: boolean
  specialistRole?: 'finance' | 'market' | 'strategy' | 'planning' | 'general'
  actionPlan?: { id: string; text: string; done: boolean }[]
}

export type SpecialistType = 'general' | 'finance' | 'market' | 'strategy' | 'planning'

export interface Conversation {
  id: string
  title: string
  preview: string
  updatedAt: string
  group: 'วันนี้' | 'เมื่อวาน' | 'ก่อนหน้านี้'
  thumbnail?: string
  avatars?: string[]
  messages: ChatMessage[]
}

export interface AiStreamEvent {
  type: 'token' | 'citation' | 'done' | 'error'
  value?: string
  citation?: Citation
  message?: string
}

export interface DashboardRange {
  value: '3m' | '6m' | '12m'
  label: string
}

export const DATA_TYPES: Record<
  DataType,
  { label: string; description: string; accent: string }
> = {
  sales: {
    label: 'ยอดขาย',
    description: 'ยอดขายรายวันหรือรายการขาย',
    accent: 'brand',
  },
  materials: {
    label: 'ต้นทุนวัตถุดิบ',
    description: 'ค่าวัตถุดิบและบรรจุภัณฑ์',
    accent: 'amber',
  },
  labor: {
    label: 'ค่าแรง',
    description: 'เงินเดือน ค่าจ้าง และโอที',
    accent: 'blue',
  },
  expenses: {
    label: 'ค่าใช้จ่ายอื่น',
    description: 'ค่าเช่า ค่าน้ำ ค่าไฟ และอื่น ๆ',
    accent: 'violet',
  },
}

export type AgentPersonality = 'professional' | 'roast' | 'analytical' | 'creative' | 'direct'
export type AgentCategory = 'finance' | 'market' | 'strategy' | 'operations' | 'marketing' | 'community'

export interface AgentProfile {
  id: string
  name: string
  role: string
  avatar?: string
  icon?: string
  color: string
  personality: AgentPersonality
  personalityLabel: string
  description: string
  systemPrompt: string
  category: AgentCategory
  categoryLabel: string
  creator: {
    name: string
    isOfficial?: boolean
    avatar?: string
  }
  enabled: boolean
  isCustom?: boolean
  downloads?: number
  rating?: number
  specialtyTags?: string[]
}
