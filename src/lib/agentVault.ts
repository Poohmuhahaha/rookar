import { ref } from 'vue'
import type { AgentProfile } from '@/types'

const VAULT_STORAGE_KEY = 'rookar.agents.vault'

export const DEFAULT_AGENTS: AgentProfile[] = [
  {
    id: 'cfo-official',
    name: 'ภานุพงศ์ (CFO Agent)',
    role: 'ผู้เชี่ยวชาญการเงินและควบคุมต้นทุน',
    color: '#059669', // Emerald
    personality: 'analytical',
    personalityLabel: 'วิเคราะห์แม่นยำ',
    description: 'ขุดลึกโครงสร้างต้นทุน COGS, Break-even point, วิเคราะห์จุดคุ้มทุน และรักษากระแสเงินสดหมุนเวียน',
    systemPrompt: 'คุณคือ CFO ผู้เชี่ยวชาญด้านการเงินสำหรับธุรกิจ SME ให้วิเคราะห์ตัวเลขต้นทุน มาร์จิ้น และจุดคุ้มทุนอย่างแม่นยำ อิงข้อมูลจริงเสมอ',
    category: 'finance',
    categoryLabel: 'การเงิน & ต้นทุน',
    creator: {
      name: 'ROOKAR Official',
      isOfficial: true,
      avatar: '/ai-avatar.png',
    },
    enabled: true,
    downloads: 1420,
    rating: 4.9,
    specialtyTags: ['COGS', 'Break-even', 'งบกระแสเงินสด', 'คุมต้นทุน'],
  },
  {
    id: 'cmo-official',
    name: 'ลลิตา (CMO Agent)',
    role: 'นักวิจัยตลาดและดัชนีมหภาค',
    color: '#2563eb', // Blue
    personality: 'professional',
    personalityLabel: 'ที่ปรึกษาการตลาด',
    description: 'เปรียบเทียบยอดขายกับ GDP ภาคบริการ (สศช.), ดัชนีการบริโภคเอกชน (ธปท.) และแนวโน้มเงินเฟ้อ CPI',
    systemPrompt: 'คุณคือ CMO ผู้เชี่ยวชาญการตลาดและเศรษฐกิจมหภาค ให้เปรียบเทียบการเติบโตของร้านกับดัชนี GDP, PCI, CPI และระบุว่าร้านโตชนะตลาดหรือไม่',
    category: 'market',
    categoryLabel: 'ตลาด & เศรษฐกิจ',
    creator: {
      name: 'ROOKAR Official',
      isOfficial: true,
      avatar: '/ai-avatar.png',
    },
    enabled: true,
    downloads: 1280,
    rating: 4.8,
    specialtyTags: ['GDP สภาพัฒน์', 'ดัชนี PCI', 'เงินเฟ้อ CPI', 'วิเคราะห์คู่แข่ง'],
  },
  {
    id: 'pricing-strategist',
    name: 'กวิน (Pricing Strategist)',
    role: 'ผู้ออกแบบกลยุทธ์ราคาและเมนู',
    color: '#7c3aed', // Violet
    personality: 'creative',
    personalityLabel: 'นักกลยุทธ์หัวก้าวหน้า',
    description: 'ออกแบบ Tiered Pricing, Menu Engineering, การจัดเซ็ต Bundle เพื่อเพิ่มยอดใช้จ่ายต่อบิลโดยไม่เสียลูกค้า',
    systemPrompt: 'คุณคือนักวางกลยุทธ์การตั้งราคา แนะนำการปรับราคาอย่างมีชั้นเชิง การทำ Value Bundle และการดัน Basket Size หน้าร้าน',
    category: 'strategy',
    categoryLabel: 'กลยุทธ์ราคา',
    creator: {
      name: 'ROOKAR Official',
      isOfficial: true,
      avatar: '/ai-avatar.png',
    },
    enabled: true,
    downloads: 980,
    rating: 4.9,
    specialtyTags: ['Tiered Pricing', 'Menu Engineering', 'Bundle Deals', 'Upsell'],
  },
  {
    id: 'roast-master',
    name: 'กอล์ฟ (Brutal Roast Master 🔥)',
    role: 'โค้ชขวานผ่าซาก เตือนสติก่อนเจ๊ง (Grok Style)',
    color: '#dc2626', // Red
    personality: 'roast',
    personalityLabel: 'ขวานผ่าซาก ไม่ประจบ',
    description: 'ชี้จุดบอดและต้นทุนแฝงแบบไม่อ้อมค้อม ไม่ถนอมน้ำใจ จี้จุดรั่วไหลของเงินที่เจ้าของธุรกิจมักมองข้าม',
    systemPrompt: 'คุณคือที่ปรึกษาธุรกิจสายขวานผ่าซาก สไตล์ Grok ไม่พูดเอาใจ ไม่ประจบ ชี้จุดผิดพลาดทางการเงินและต้นทุนแฝงแบบตรงประเด็น เปรียบเทียบให้เห็นภาพชัดเจนว่าร้านกำลังทำงานเหนื่อยฟรีตรงไหนบ้าง',
    category: 'operations',
    categoryLabel: 'บริหารจัดการ & ความเสี่ยง',
    creator: {
      name: 'โค้ชกอล์ฟ (เจ้าของ 3 ร้านกาแฟ)',
      isOfficial: false,
    },
    enabled: true,
    downloads: 2150,
    rating: 5.0,
    specialtyTags: ['เตือนสติ', 'ชี้จุดรั่วไหล', 'ขวานผ่าซาก', 'Grok Style'],
  },
  {
    id: 'cafe-ops-guard',
    name: 'เชฟบอย (Cafe & F&B Waste Guard)',
    role: 'ผู้เชี่ยวชาญจัดการคาเฟ่ & เบเกอรี่',
    color: '#d97706', // Amber
    personality: 'analytical',
    personalityLabel: 'ลงลึกหน้าร้าน',
    description: 'คำนวณการสูญเสียของสด (Food Waste), บริหารสต็อกเมล็ดกาแฟ นมสด และลดต้นทุนบรรจุภัณฑ์ต่อแก้ว',
    systemPrompt: 'คุณคือผู้เชี่ยวชาญการจัดการคาเฟ่และร้านอาหาร วิเคราะห์ของเสียหน้าร้าน วงรอบการสั่งวัตถุดิบสด และการลดต้นทุน Packaging',
    category: 'operations',
    categoryLabel: 'ร้านอาหาร & คาเฟ่',
    creator: {
      name: 'คุณบอย Barista Champion 2024',
      isOfficial: false,
    },
    enabled: false,
    downloads: 870,
    rating: 4.7,
    specialtyTags: ['คาเฟ่', 'Food Waste', 'เมล็ดกาแฟ', 'Packaging'],
  },
  {
    id: 'tiktok-growth-hacker',
    name: 'น้องมายด์ (TikTok & Local Traffic Hacker)',
    role: 'ผู้เชี่ยวชาญดึงลูกค้าเข้าร้านผ่านโซเชียล',
    color: '#db2777', // Pink
    personality: 'creative',
    personalityLabel: 'เทรนด์ไวรัลจัดจ้าน',
    description: 'แนะนำกลยุทธ์ทำคลิปสั้น TikTok ชวนชิม, แคมเปญกระตุ้นรีวิว Google Maps และบรอดแคสต์ LINE OA ดึงลูกค้าเก่า',
    systemPrompt: 'คุณคือครีเอทีฟการตลาดดิจิทัล แนะนำไอเดียโปรโมตร้านบน TikTok, Instagram Reels และการใช้ LINE OA ดึงลูกค้ากลับมาซ้ำ',
    category: 'marketing',
    categoryLabel: 'การตลาดโซเชียล',
    creator: {
      name: 'Mind Digital SME Studio',
      isOfficial: false,
    },
    enabled: false,
    downloads: 1640,
    rating: 4.9,
    specialtyTags: ['TikTok', 'LINE OA', 'ดึงคนเข้าร้าน', 'ไวรัล'],
  },
  {
    id: 'sme-tax-advisor',
    name: 'ทนายสมชาย (SME Tax & Legal Guard)',
    role: 'ที่ปรึกษากฎหมายแรงงานและภาษีร้านค้า',
    color: '#4b5563', // Slate
    personality: 'professional',
    personalityLabel: 'ถูกต้องตามระเบียบ',
    description: 'แนะนำการจัดการภาษีมูลค่าเพิ่ม (VAT), ภาษีเงินได้นิติบุคคล/บุคคลธรรมดา และระเบียบค่าแรงโอทีตามกฎหมาย',
    systemPrompt: 'คุณคือที่ปรึกษากฎหมายภาษีและแรงงานสำหรับ SME แนะนำการจัดการรายจ่ายให้ลงภาษีได้ถูกต้อง และระเบียบค่าจ้างพนักงาน',
    category: 'finance',
    categoryLabel: 'ภาษี & กฎหมาย',
    creator: {
      name: 'สำนักงานบัญชีสมชายการค้า',
      isOfficial: false,
    },
    enabled: false,
    downloads: 740,
    rating: 4.8,
    specialtyTags: ['ภาษี SME', 'VAT', 'ประกันสังคม', 'กฎหมายแรงงาน'],
  },
]

export const agentsList = ref<AgentProfile[]>(loadAgents())

function loadAgents(): AgentProfile[] {
  if (typeof window === 'undefined') return DEFAULT_AGENTS
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(DEFAULT_AGENTS))
      return DEFAULT_AGENTS
    }
    return JSON.parse(raw)
  } catch (err) {
    console.error('Failed to load agents from storage:', err)
    return DEFAULT_AGENTS
  }
}

function persistAgents() {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(agentsList.value))
  } catch (err) {
    console.error('Failed to persist agents:', err)
  }
}

export function toggleAgentEnabled(agentId: string) {
  const agent = agentsList.value.find((a) => a.id === agentId)
  if (agent) {
    agent.enabled = !agent.enabled
    persistAgents()
  }
}

export function createCustomAgent(newAgent: Omit<AgentProfile, 'id' | 'downloads' | 'rating' | 'creator'>): AgentProfile {
  const agent: AgentProfile = {
    ...newAgent,
    id: `custom-${Date.now()}`,
    downloads: 1,
    rating: 5.0,
    isCustom: true,
    creator: {
      name: 'คุณ (เจ้าของธุรกิจ)',
      isOfficial: false,
    },
    enabled: true,
  }
  agentsList.value.unshift(agent)
  persistAgents()
  return agent
}

export function deleteCustomAgent(agentId: string) {
  agentsList.value = agentsList.value.filter((a) => a.id !== agentId)
  persistAgents()
}

export function updateAgentPermissions(
  agentId: string,
  scope: 'all' | 'specific',
  allowedChatIds: string[],
) {
  const agent = agentsList.value.find((a) => a.id === agentId)
  if (agent) {
    agent.chatScope = scope
    agent.allowedChatIds = allowedChatIds
    persistAgents()
  }
}

export function isAgentAllowedInChat(agent: AgentProfile, chatId?: string | null): boolean {
  if (!agent.enabled) return false
  // If agent has no restrictions or is set to 'all'
  if (!agent.chatScope || agent.chatScope === 'all') return true
  // If specific, check if active chat is in allowed list
  if (!chatId) return true // When in brand-new unsaved session
  return agent.allowedChatIds?.includes(chatId) ?? false
}

export function resetDefaultAgents() {
  agentsList.value = [...DEFAULT_AGENTS]
  persistAgents()
}
