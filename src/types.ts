export type Role = 'owner' | 'manager' | 'staff' | 'admin'

export interface User {
  id: string
  name: string
  username?: string | null
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
  isDemo?: boolean
  industryId?: string
  industryConfidence?: number
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

export interface MacroIndicatorValue {
  value: number
  year: string
  source?: string
  periodLabel?: string
  projected?: boolean
}

export type MacroIndicatorKey =
  | 'gdpGrowth'
  | 'householdConsumptionGrowth'
  | 'cpiInflation'
  | 'unemploymentRate'
  | 'governmentDebt'
  | 'currentAccountBalance'

export interface SectorBenchmark {
  countryName: string
  periodLabel: string
  indicators: Record<MacroIndicatorKey, MacroIndicatorValue>
  source: string
  sourceUrl: string
  lastUpdated: string
  fetchedAt: string
  stale?: boolean
}

export interface IndustryEconomicsIndicator {
  key: string
  label: string
  labelEn: string
  note: string
  noteEn: string
  useCase: string
  useCaseEn: string
  value: number
  previousValue: number | null
  delta: number | null
  history: { year: string; value: number }[]
  unit: 'percent' | 'years' | 'score' | 'per_1000' | 'per_million' | 'kg_oe'
  year: string
  periodLabel: string
}

export interface IndustryEconomics {
  industryId: string
  label: string
  labelEn: string
  indicators: IndustryEconomicsIndicator[]
  source: string
  sourceUrl: string
  lastUpdated: string
  stale?: boolean
}

export interface DashboardIndustryMeta {
  id: string
  label: string
  shortLabel: string
  accent: string
  sourceCount: number
  realSourceCount: number
  demoSourceCount: number
  coverageMonths: number
  totalMonths: number
  confidence: number
  unmatchedSources: number
}

export interface DashboardSegment {
  key: string
  label: string
  value: number
  share: number
}


export interface DashboardSummary {
  rangeLabel: string
  hasSales?: boolean
  hasCost?: boolean
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
  industry?: DashboardIndustryMeta
  segments?: DashboardSegment[]
  costSegments?: DashboardSegment[]
  insight: {
    title: string
    body: string
    action: string
    prompt: string
  }
  lastUpdated: string
}

export interface ImportErrorRow {
  row: number
  field: string
  message: string
}

export interface ImportClassification {
  type: DataType
  confidence: number
  reason: string
}

export interface ImportPreview {
  previewId?: string
  classification?: ImportClassification
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
  errorMessage?: string
  specialistRole?: 'finance' | 'market' | 'strategy' | 'planning' | 'general'
  agentNames?: string[]
  answeredBy?: string
  toolEvents?: AiToolEvent[]
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
  agentNames?: string[]
  specialistRole?: SpecialistType
  messages: ChatMessage[]
}

export interface AiToolEvent {
  id?: string
  name?: string
  label?: string
  status?: 'running' | 'done' | 'error'
  summary?: string
}

export interface AiStreamEvent {
  type: 'token' | 'citation' | 'done' | 'error' | 'tool_start' | 'tool_result'
  value?: string
  citation?: Citation
  message?: string
  tool?: AiToolEvent
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
export type ChatScope = 'all' | 'specific'

export interface AgentBenchmarkScore {
  label: string
  score: string
  metric: string
}

export interface AgentExpertiseLogic {
  whySpecialized: string
  reasoningFramework: string
  knowledgeBase: string[]
  coreStrengths: string[]
  benchmarkScore: AgentBenchmarkScore
}

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
  chatScope?: ChatScope
  allowedChatIds?: string[]
  expertiseLogic?: AgentExpertiseLogic
}
