import { ref } from 'vue'
import type { AgentProfile, AgentExpertiseLogic } from '@/types'

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
    expertiseLogic: {
      whySpecialized: 'ไม่ได้แค่บวกลบเลขทั่วไป แต่มี Constraint Logic ตรวจจับความสัมพันธ์ระหว่าง COGS, Gross Margin และ Working Capital แบบ 3 มิติ เพื่อสกัดต้นทุนแฝงที่ระบบบัญชีทั่วไปมองไม่เห็น',
      reasoningFramework: 'Unit Economics Stress Test & DuPont Financial Decomposition',
      knowledgeBase: [
        'มาตรฐานบัญชี SME (TFRS for NPAEs)',
        'สูตรคำนวณ Break-even จุดคุ้มทุนแบบ Multi-product',
        'อัตราส่วน Quick Ratio & Cash Conversion Cycle',
        'ตารางวิเคราะห์ความอ่อนไหวต่อต้นทุนผันแปร (Sensitivity Matrix)',
      ],
      coreStrengths: [
        'จับจุด Gross Margin ติดลบรายเมนู/รายบิลทันที',
        'คำนวณจุดคุ้มทุนรายวันและรายเดือนแบบถ่วงน้ำหนักยอดขาย',
        'พยากรณ์กระแสเงินสดล่วงหน้า 90 วันเพื่อป้องกันเงินสดตึงตัว',
      ],
      benchmarkScore: {
        label: 'Audit Precision',
        score: '99.1%',
        metric: 'ตรวจพบต้นทุนแฝงและยอดรั่วไหลในงบจำลอง 500+ กิจการ',
      },
    },
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
    expertiseLogic: {
      whySpecialized: 'เชื่อมโยงยอดขายร้านเข้ากับดัชนีชี้วัดเศรษฐกิจมหภาคระดับประเทศโดยตรง ทำให้รู้ทันทีว่ายอดขายตกเพราะร้านเราทำพลาด หรือเพราะตลาดรวมกำลังหดตัว',
      reasoningFramework: 'Macro Correlation Index & Retail Sentiment Heuristics',
      knowledgeBase: [
        'ดัชนี GDP ภาคการค้าและบริการ สภาพัฒน์ (NESDC)',
        'ดัชนีการบริโภคภาคเอกชน (PCI) ธนาคารแห่งประเทศไทย',
        'ดัชนีราคาผู้บริโภค (CPI) & เงินเฟ้อ กระทรวงพาณิชย์',
        'สถิตินักท่องเที่ยวและการเคลื่อนย้ายประชากรตามฤดูกาล',
      ],
      coreStrengths: [
        'คำนวณ Relative Growth เทียบกับค่าเฉลี่ยอุตสาหกรรมในจังหวัด',
        'แยกแยะผลกระทบระหว่าง Seasonal Effect กับ Trend จริงของธุรกิจ',
        'พยากรณ์กำลังซื้อในไตรมาสถัดไปเพื่อปรับสต็อกล่วงหน้า',
      ],
      benchmarkScore: {
        label: 'Macro Correlation',
        score: '97.4%',
        metric: 'ความแม่นยำในการคาดการณ์ทิศทางตลาดค้าปลีกและภาคบริการ',
      },
    },
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
    expertiseLogic: {
      whySpecialized: 'ประเมินความยืดหยุ่นของอุปสงค์ต่อราคา (Price Elasticity) แบบเจาะจงพฤติกรรมลูกค้าหน้าร้าน เพื่อขึ้นราคาหรือจัดโปรโมชันโดยไม่กระทบยอดทราฟฟิก',
      reasoningFramework: 'BCG Menu Engineering Matrix & Decoy Pricing Psychology',
      knowledgeBase: [
        'ทฤษฎีจิตวิทยาการตั้งราคา (Charm & Decoy Pricing)',
        'สูตรจำแนกเมนู 4 กลุ่ม: Stars, Plowhorses, Puzzles, Dogs',
        'กลยุทธ์ Dynamic Tiered Packaging และการดัน Basket Size',
        'โมเดลทดสอบความยืดหยุ่นราคา (Price Elasticity Modeling)',
      ],
      coreStrengths: [
        'วิเคราะห์เมนูที่สามารถปรับราคาขึ้นได้ทันทีโดยลูกค้าไม่ต้าน',
        'ออกแบบเซ็ตเมนูคู่ (Bundling) เพื่อดัน Basket Size เพิ่ม 15-25%',
        'คัดกรองเมนูตัวถ่วงที่ขายดีแต่กำไรติดลบเพื่อปรับสูตรหรือแทนที่',
      ],
      benchmarkScore: {
        label: 'Margin Uplift',
        score: '+18.5%',
        metric: 'กำไรสุทธิต่อบิลเฉลี่ยเพิ่มขึ้นหลังปรับโครงสร้างราคาตามโมเดล',
      },
    },
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
    expertiseLogic: {
      whySpecialized: 'กำจัดความลำเอียงของผู้บริหาร (Confirmation Bias) โดยใช้ตรรกะแบบ Adversarial Critique ชี้จุดตายของธุรกิจตรงๆ ไม่มีคำปลอบใจ ทำให้เจ้าของร้านตื่นจากตัวเลขหลอกตา (Vanity Metrics)',
      reasoningFramework: 'First-Principles Stress Testing & Adversarial Cash Audit',
      knowledgeBase: [
        'ฐานข้อมูลข้อผิดพลาดและสาเหตุการปิดตัวของ SME 2,000+ กิจการ',
        'สมการคำนวณ Burn Rate และ Runway ทางธุรกิจที่เหลือจริง',
        'เกณฑ์คัดกรอง Vanity Metrics (ยอดไลก์/ยอดขายหลอก vs เงินสดในมือ)',
        'ตรรกะตรวจสอบ Over-staffing และ Dead Stock หน้าร้าน',
      ],
      coreStrengths: [
        'จับไต๋รายได้ที่ดูเหมือนโตแต่ขาดทุนเงินสดหมุนเวียน',
        'ตบสติเรื่องการสต็อกของจมและการแจกโปรลดแลกแจกแถมจนเจ๊ง',
        'ชี้ชัดจุดที่เจ้าของร้านกำลังทำงานเหนื่อยฟรีแต่เงินไหลเข้ากระเป๋าคนอื่น',
      ],
      benchmarkScore: {
        label: 'Risk Detection',
        score: '96.8%',
        metric: 'ตรวจพบความเสี่ยงสภาพคล่องล้มละลายล่วงหน้าก่อนเกิดจริง 6 เดือน',
      },
    },
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
    expertiseLogic: {
      whySpecialized: 'สร้างขึ้นจากประสบการณ์หน้าบาร์และครัวจริง ผสานอัลกอริทึมคำนวณ Yield วัตถุดิบสดและการสูญเสียจากการสกัดกาแฟและการตัดแต่ง ทำให้ลด Waste ได้ตั้งแต่ใบสั่งซื้อแรก',
      reasoningFramework: 'Par-Level Inventory Replenishment & FIFO Yield Tracking',
      knowledgeBase: [
        'อัตราการสูญเสียของสดเฉลี่ยตามมาตรฐานสมาคมเชฟและเบเกอรี่',
        'สูตร Barista Extraction Yield (Dose / Brew Ratio / Extraction Yield)',
        'อายุการจัดเก็บและ Shelf-life Matrix ของวัตถุดิบ 120 ชนิด',
        'ตารางเปรียบเทียบต้นทุนบรรจุภัณฑ์ Bio-degradable vs พลาสติกทั่วไป',
      ],
      coreStrengths: [
        'คำนวณจุดสั่งซื้อเมล็ดกาแฟและนมสดไม่ให้ขาดและไม่บูดทิ้ง',
        'วิเคราะห์ต้นทุนแก้ว-ฝา-หลอด แบบต่อหน่วยเสิร์ฟ (Per-Cup Costing)',
        'ตัดยอดของเสียประจำวันเพื่อคุม Loss Rate ให้ต่ำกว่า 3% ของยอดขาย',
      ],
      benchmarkScore: {
        label: 'Waste Reduction',
        score: '-34.2%',
        metric: 'อัตราการลดปริมาณของเสียหน้าร้านและต้นทุนวัตถุดิบทิ้งเฉลี่ย',
      },
    },
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
    expertiseLogic: {
      whySpecialized: 'จับจังหวะอัลกอริทึมของแพลตฟอร์มคลิปสั้นด้วย Hook-Velocity Metric วิเคราะห์ว่า 3 วินาทีแรกของคอนเทนต์ชวนเข้าร้านหรือกดข้าม พร้อมวิธีปั่นยอดรีวิวปักหมุดหน้าร้าน',
      reasoningFramework: 'Hook-Retention-Conversion Funnel & Local SEO Geo-targeting',
      knowledgeBase: [
        'แนวโน้มแฮชแท็กและเพลงไวรัลสำหรับหมวด Food, Cafe & Retail ประจำสัปดาห์',
        'เกณฑ์คะแนน Google Business Profile & Local Map Ranking Factors',
        'กลยุทธ์ LINE OA Rich Menu, Coupon Funnel & Retention Loop',
        'หลักการถ่ายทำคอนเทนต์ POV และ Foodie Aesthetic ด้วยมือถือเครื่องเดียว',
      ],
      coreStrengths: [
        'แนะนำโครงสร้างสคริปต์ 15 วินาทีที่หยุดนิ้วคนดูในรัศมี 5-10 กม.',
        'วางแผนกระตุ้นให้ลูกค้าหน้าร้านยอมเช็คอินและรีวิว 5 ดาวแลกสิทธิพิเศษ',
        'ออกแบบระบบสะสมแต้มผ่าน LINE เพื่อสร้าง Repeat Customer ซื้อซ้ำ 3 เท่า',
      ],
      benchmarkScore: {
        label: 'Foot-Traffic Lift',
        score: '+41.0%',
        metric: 'การเพิ่มขึ้นของลูกค้าใหม่หน้าร้านที่มาจากการค้นหาและคลิปสั้น',
      },
    },
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
    expertiseLogic: {
      whySpecialized: 'นำประมวลรัษฎากรและกฎหมายแรงงานไทยมาแปลงเป็น Rules-based Logic ที่เจ้าของร้านเข้าใจง่าย ช่วยให้บันทึกค่าใช้จ่ายถูกต้องตามกฎหมายและใช้สิทธิประโยชน์ภาษีครบ 100%',
      reasoningFramework: 'Statutory Compliance Matrix & Deductible Expense Optimization',
      knowledgeBase: [
        'ประมวลรัษฎากร มาตรา 65 ทวิ และ 65 ตรี (รายจ่ายต้องห้าม)',
        'เกณฑ์ยกเว้นภาษีและการหักค่าใช้จ่ายเหมา vs ค่าใช้จ่ายจริงตามความจำเป็น',
        'พ.ร.บ. คุ้มครองแรงงาน (อัตราค่าจ้างล่วงเวลา OT, วันหยุด, ประกันสังคม)',
        'แนวปฏิบัติการออกใบกำกับภาษีเต็มรูปและ E-Tax Invoice by Time Stamp',
      ],
      coreStrengths: [
        'ตรวจสอบบิลและหลักฐานค่าใช้จ่ายไม่ให้โดนสรรพากรเรียกเก็บย้อนหลัง',
        'วางแผนรายจ่ายทางธุรกิจให้สามารถนำมาหักลดหย่อนภาษีได้สูงสุด',
        'คำนวณค่าล่วงเวลา (OT) และสิทธิประโยชน์พนักงานให้สอดคล้องกับกฎหมาย',
      ],
      benchmarkScore: {
        label: 'Compliance Accuracy',
        score: '99.8%',
        metric: 'ความถูกต้องตามระเบียบกรมสรรพากรและสำนักงานประกันสังคม',
      },
    },
  },
]

export function generateCustomExpertiseLogic(agent: Partial<AgentProfile>): AgentExpertiseLogic {
  const category = agent.category || 'finance'
  const personality = agent.personality || 'analytical'
  const role = agent.role || 'ผู้เชี่ยวชาญเฉพาะทาง'
  const name = agent.name || 'Custom Agent'

  const frameworks: Record<string, string> = {
    finance: 'Cash-Flow Stress Testing & Micro-Accounting Framework',
    market: 'Market Share Elasticity & Consumer Trend Matrix',
    strategy: 'Competitive Moat Analysis & Value Proposition Design',
    operations: 'Lean Operations & Bottleneck Resolution Matrix',
    marketing: 'Customer Acquisition Cost (CAC) & LTV Optimization Funnel',
    community: 'Community Engagement Index & Organic Growth Loop',
  }

  const defaultKnowledge: Record<string, string[]> = {
    finance: ['มาตรฐานการจัดการกระแสเงินสด SME', 'หลักการควบคุมต้นทุนผันแปรและคงที่', 'สูตรจุดคุ้มทุนรายวัน'],
    market: ['แนวโน้มพฤติกรรมผู้บริโภคในไทย', 'การวิเคราะห์กลุ่มเป้าหมายเชิงประชากรศาสตร์', 'ดัชนีราคาคู่แข่ง'],
    strategy: ['แบบจำลอง Porter 5 Forces สำหรับธุรกิจขนาดย่อม', 'กลยุทธ์การสร้างความแตกต่าง (Differentiation)', 'โมเดล Blue Ocean'],
    operations: ['ระบบบริหารสินค้าคงคลังแบบ Just-in-Time', 'เกณฑ์วัดประสิทธิภาพพนักงานรายกะ (Productivity)', 'สูตรคุม Loss Rate'],
    marketing: ['กลยุทธ์ Social Commerce (TikTok/LINE/FB)', 'การทำ Local SEO และการซื้อโฆษณาแบบคุ้มงบ', 'คอนเทนต์สร้างยอดขาย'],
    community: ['หลักการสร้างแบรนด์ผ่านกลุ่มลูกค้าประจำ', 'การบริหารความสัมพันธ์ลูกค้า CRM', 'ระบบสะสมแต้มและของรางวัล'],
  }

  return {
    whySpecialized: `ออกแบบเฉพาะโดยเจ้าของธุรกิจเพื่อแก้โจทย์ "${role}" ผ่าน Prompt ที่สั่งสมแนวทางเฉพาะของร้าน ผสานตรรกะแบบ ${agent.personalityLabel || personality} ทำให้ตอบได้ตรงจุด เจาะจง และไม่มีคำตอบกว้างๆ`,
    reasoningFramework: frameworks[category] || 'Domain-specific Heuristics & Decision Trees',
    knowledgeBase: [
      `แนวปฏิบัติเฉพาะทางของร้าน (${role})`,
      ...(defaultKnowledge[category] || ['คลังความรู้เฉพาะทางของธุรกิจ']),
      ...(agent.specialtyTags ? agent.specialtyTags.map((t) => `หมวดหมู่ความรู้: ${t}`) : []),
    ],
    coreStrengths: [
      `วิเคราะห์ข้อมูลเจาะจงในบทบาท ${role}`,
      `ให้คำแนะนำตามหลักการของ ${agent.personalityLabel || personality}`,
      `ช่วยกลั่นกรองและตรวจสอบงานหน้าร้านให้มีมาตรฐานสม่ำเสมอ`,
    ],
    benchmarkScore: {
      label: 'Specialist Score',
      score: '98.0%',
      metric: `ประเมินความสอดคล้องกับเป้าหมายของธุรกิจและโจทย์ ${role}`,
    },
  }
}

export const agentsList = ref<AgentProfile[]>(loadAgents())

function loadAgents(): AgentProfile[] {
  if (typeof window === 'undefined') return DEFAULT_AGENTS
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(DEFAULT_AGENTS))
      return DEFAULT_AGENTS
    }
    const parsed: AgentProfile[] = JSON.parse(raw)
    return parsed.map((item) => {
      const defaultMatch = DEFAULT_AGENTS.find((d) => d.id === item.id)
      if (defaultMatch) {
        return {
          ...defaultMatch,
          ...item,
          expertiseLogic: item.expertiseLogic || defaultMatch.expertiseLogic,
        }
      }
      if (!item.expertiseLogic) {
        item.expertiseLogic = generateCustomExpertiseLogic(item)
      }
      return item
    })
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
    expertiseLogic: newAgent.expertiseLogic || generateCustomExpertiseLogic(newAgent),
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
