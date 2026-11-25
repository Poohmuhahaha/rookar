import type { DataQuality, DataType } from '@/types'

export type IndustryId =
  | 'logistics'
  | 'energy-fuel'
  | 'ev'
  | 'healthcare'
  | 'quantum-security'
  | 'fnb'

export interface IndustrySampleSource {
  name: string
  type: DataType
  typeLabel: string
  rowCount: number
  quality: DataQuality
  fileName: string
}

export interface IndustryProfile {
  id: IndustryId
  label: string
  shortLabel: string
  labelEn: string
  description: string
  parentId?: IndustryId
  priority?: boolean
  salesNote?: string
  accent: string
  focusPoints: string[]
  sample: {
    revenue: number[]
    profit: number[]
    priorYearGrowth: number
    priorYearMarginDelta: number
    costSplit: { materials: number; labor: number; expenses: number }
    costLabels: { materials: string; labor: string; expenses: string }
    costLabelsEn?: { materials: string; labor: string; expenses: string }
    insight: { title: string; body: string; action: string; prompt: string }
    sources: IndustrySampleSource[]
    quickPrompts: string[]
  }
}

export const INDUSTRY_PROFILES: Record<IndustryId, IndustryProfile> = {
  logistics: {
    id: 'logistics',
    label: 'โลจิสติกส์และขนส่ง',
    shortLabel: 'Logistics',
    labelEn: 'Logistics',
    description: 'ขนส่งสินค้า คลังสินค้า และกระจายสินค้า',
    accent: '#2563eb',
    focusPoints: [
      'ต้นทุนน้ำมันและค่าทางด่วนต่อเที่ยว',
      'อัตราการบรรทุกเต็มคันและเที่ยววิ่งเปล่า',
      'กำไรต่อเส้นทางและรอบรถ',
      'ค่าซ่อมบำรุงและค่าคลังสินค้า',
    ],
    sample: {
      revenue: [
        1_820_000, 1_760_000, 1_940_000, 2_010_000, 1_980_000, 2_120_000,
        2_240_000, 2_180_000, 2_310_000, 2_420_000, 2_510_000, 2_680_000,
      ],
      profit: [
        236_000, 221_000, 258_000, 271_000, 262_000, 291_000,
        310_000, 298_000, 322_000, 341_000, 358_000, 389_000,
      ],
      priorYearGrowth: 0.18,
      priorYearMarginDelta: 0.4,
      costSplit: { materials: 42, labor: 33, expenses: 25 },
      costLabels: {
        materials: 'น้ำมันและค่าทางด่วน',
        labor: 'ค่าแรงพนักงานขับรถ',
        expenses: 'ค่าซ่อมบำรุงและคลังสินค้า',
      },
      costLabelsEn: {
        materials: 'Fuel & tolls',
        labor: 'Driver wages',
        expenses: 'Maintenance & warehousing',
      },
      insight: {
        title: 'เที่ยววิ่งเปล่าและต้นทุนน้ำมันกำลังกัดกำไร',
        body: 'ต้นทุนน้ำมันและค่าทางด่วนคิดเป็น 42% ของต้นทุนรวม ขณะที่รายได้ต่อเที่ยวทรงตัว สะท้อนว่ากำไรที่เพิ่มขึ้นมาจากจำนวนเที่ยวมากกว่าประสิทธิภาพต่อเที่ยว',
        action: 'ถาม AI ต่อ',
        prompt: 'วิเคราะห์ต้นทุนต่อเที่ยวและแนวทางลดเที่ยววิ่งเปล่า',
      },
      sources: [
        { name: 'รายได้ค่าขนส่งรายเที่ยว', type: 'sales', typeLabel: 'ยอดขาย', rowCount: 420, quality: 'complete', fileName: 'logistics_revenue_2026.csv' },
        { name: 'ค่าน้ำมันและค่าทางด่วน', type: 'materials', typeLabel: 'ต้นทุนวัตถุดิบ', rowCount: 310, quality: 'partial', fileName: 'logistics_fuel_tolls.csv' },
        { name: 'ค่าแรงพนักงานขับรถ', type: 'labor', typeLabel: 'ค่าแรง', rowCount: 96, quality: 'complete', fileName: 'logistics_driver_payroll.csv' },
        { name: 'ค่าซ่อมบำรุงและคลังสินค้า', type: 'expenses', typeLabel: 'ค่าใช้จ่ายอื่น', rowCount: 74, quality: 'complete', fileName: 'logistics_operating_expenses.csv' },
      ],
      quickPrompts: [
        'ต้นทุนน้ำมันต่อเที่ยวสูงขึ้นแค่ไหน',
        'ควรเพิ่มเที่ยววิ่งหรือลดเที่ยวเปล่า',
        'วิเคราะห์กำไรแต่ละเส้นทาง',
      ],
    },
  },
  'energy-fuel': {
    id: 'energy-fuel',
    label: 'พลังงานและเชื้อเพลิง',
    shortLabel: 'Energy & Fuel',
    labelEn: 'Energy & Fuel',
    description: 'สถานีบริการน้ำมัน ค้าส่งเชื้อเพลิง และธุรกิจพลังงาน',
    accent: '#d97706',
    focusPoints: [
      'มาร์จิ้นต่อลิตรและราคาต้นทุนเชื้อเพลิง',
      'รอบสต็อกเชื้อเพลิงและความเสี่ยงราคา',
      'สัดส่วนรายได้ B2B กับสถานีบริการ',
      'ค่าขนส่งและค่าดำเนินงานสถานี',
    ],
    sample: {
      revenue: [
        8_200_000, 8_050_000, 8_460_000, 8_720_000, 8_510_000, 8_940_000,
        9_180_000, 9_050_000, 9_420_000, 9_680_000, 9_850_000, 10_240_000,
      ],
      profit: [
        410_000, 395_000, 438_000, 452_000, 429_000, 468_000,
        482_000, 461_000, 498_000, 512_000, 526_000, 558_000,
      ],
      priorYearGrowth: 0.12,
      priorYearMarginDelta: -0.2,
      costSplit: { materials: 72, labor: 9, expenses: 19 },
      costLabels: {
        materials: 'ต้นทุนเชื้อเพลิงและสต็อก',
        labor: 'ค่าแรงพนักงานสถานี',
        expenses: 'ค่าขนส่งและค่าดำเนินงาน',
      },
      costLabelsEn: {
        materials: 'Fuel & inventory',
        labor: 'Station staff wages',
        expenses: 'Logistics & operations',
      },
      insight: {
        title: 'ราคาเชื้อเพลิงผันผวนกระทบสต็อกและมาร์จิ้น',
        body: 'ต้นทุนเชื้อเพลิงคิดเป็น 72% ของต้นทุนรวม การถือสต็อกนานเกิน 7 วันเพิ่มความเสี่ยงราคา ขณะที่มาร์จิ้นต่อลิตรยังบาง',
        action: 'ถาม AI ต่อ',
        prompt: 'ราคาน้ำมันเปลี่ยนแปลงกระทบกำไรเท่าไร และควรถือสต็อกเท่าไร',
      },
      sources: [
        { name: 'ยอดขายน้ำมันรายวัน', type: 'sales', typeLabel: 'ยอดขาย', rowCount: 365, quality: 'complete', fileName: 'energy_fuel_sales_2026.csv' },
        { name: 'ต้นทุนเชื้อเพลิงและสต็อก', type: 'materials', typeLabel: 'ต้นทุนวัตถุดิบ', rowCount: 240, quality: 'partial', fileName: 'energy_fuel_inventory.csv' },
        { name: 'ค่าแรงพนักงานสถานี', type: 'labor', typeLabel: 'ค่าแรง', rowCount: 84, quality: 'complete', fileName: 'energy_fuel_payroll.csv' },
        { name: 'ค่าขนส่งและค่าดำเนินงาน', type: 'expenses', typeLabel: 'ค่าใช้จ่ายอื่น', rowCount: 62, quality: 'duplicate', fileName: 'energy_fuel_opex.csv' },
      ],
      quickPrompts: [
        'ราคาน้ำมันผันผวนกระทบกำไรเท่าไร',
        'ควรถือสต็อกเชื้อเพลิงกี่วัน',
        'วิเคราะห์มาร์จิ้นต่อลิตร',
      ],
    },
  },
  ev: {
    id: 'ev',
    label: 'ยานยนต์ไฟฟ้า (EV)',
    shortLabel: 'EV',
    labelEn: 'Electric Vehicle',
    description: 'ตัวแทนจำหน่าย อู่ซ่อม EV และสถานีชาร์จ',
    parentId: 'energy-fuel',
    accent: '#059669',
    focusPoints: [
      'ต้นทุนแบตเตอรี่และอะไหล่ต่อคัน',
      'รอบสต็อกอะไหล่และรถค้างสต็อก',
      'รายได้หลังการขายและค่าบริการชาร์จ',
      'ต้นทุนช่างเทคนิคเฉพาะทาง',
    ],
    sample: {
      revenue: [
        4_100_000, 4_350_000, 4_280_000, 4_620_000, 4_850_000, 5_100_000,
        5_020_000, 5_340_000, 5_620_000, 5_480_000, 5_760_000, 6_050_000,
      ],
      profit: [
        410_000, 441_000, 428_000, 469_000, 498_000, 527_000,
        513_000, 551_000, 587_000, 566_000, 603_000, 641_000,
      ],
      priorYearGrowth: 0.32,
      priorYearMarginDelta: 0.6,
      costSplit: { materials: 64, labor: 14, expenses: 22 },
      costLabels: {
        materials: 'ต้นทุนรถและแบตเตอรี่',
        labor: 'ค่าแรงช่างเทคนิค EV',
        expenses: 'ค่าสถานีชาร์จและประกัน',
      },
      costLabelsEn: {
        materials: 'Vehicles & batteries',
        labor: 'EV technician wages',
        expenses: 'Charging & insurance',
      },
      insight: {
        title: 'ต้นทุนแบตเตอรี่และอะไหล่ EV ยังเป็นตัวถ่วงหลัก',
        body: 'ต้นทุนแบตเตอรี่และอะไหล่คิดเป็น 64% ของต้นทุนรวม และอะไหล่บางรายการมีรอบสต็อกนานกว่า 60 วัน ทำให้เงินจมในสต็อก',
        action: 'ถาม AI ต่อ',
        prompt: 'ต้นทุนแบตเตอรี่และอะไหล่ EV ควรบริหารสต็อกอย่างไร',
      },
      sources: [
        { name: 'ยอดขายรถและอะไหล่ EV', type: 'sales', typeLabel: 'ยอดขาย', rowCount: 186, quality: 'complete', fileName: 'ev_sales_2026.csv' },
        { name: 'ต้นทุนรถและแบตเตอรี่', type: 'materials', typeLabel: 'ต้นทุนวัตถุดิบ', rowCount: 142, quality: 'partial', fileName: 'ev_battery_inventory.csv' },
        { name: 'ค่าแรงช่างเทคนิค EV', type: 'labor', typeLabel: 'ค่าแรง', rowCount: 58, quality: 'complete', fileName: 'ev_technician_payroll.csv' },
        { name: 'ค่าสถานีชาร์จและประกัน', type: 'expenses', typeLabel: 'ค่าใช้จ่ายอื่น', rowCount: 44, quality: 'complete', fileName: 'ev_charging_opex.csv' },
      ],
      quickPrompts: [
        'ต้นทุนแบตเตอรี่ต่อคันสูงแค่ไหน',
        'อะไหล่ตัวไหนเงินจมนานที่สุด',
        'รายได้หลังการขายคิดเป็นกี่เปอร์เซ็นต์',
      ],
    },
  },
  healthcare: {
    id: 'healthcare',
    label: 'สุขภาพและการแพทย์',
    shortLabel: 'Healthcare',
    labelEn: 'Health Cares & Medical',
    description: 'คลินิก โรงพยาบาล และธุรกิจขายให้ภาคสาธารณสุข',
    salesNote: 'ขายสาธารณสุข (B2G)',
    accent: '#dc2626',
    focusPoints: [
      'ระยะเวลาเบิกจ่ายภาครัฐและกระแสเงินสด',
      'ต้นทุนเวชภัณฑ์ต่อหัตถการ',
      'สัดส่วนรายได้ภาครัฐกับเอกชน',
      'ต้นทุนบุคลากรทางการแพทย์',
    ],
    sample: {
      revenue: [
        3_200_000, 3_050_000, 3_380_000, 3_520_000, 3_460_000, 3_720_000,
        3_880_000, 3_810_000, 4_020_000, 4_180_000, 4_260_000, 4_480_000,
      ],
      profit: [
        420_000, 398_000, 446_000, 468_000, 455_000, 498_000,
        521_000, 508_000, 542_000, 566_000, 578_000, 612_000,
      ],
      priorYearGrowth: 0.16,
      priorYearMarginDelta: 0.5,
      costSplit: { materials: 46, labor: 34, expenses: 20 },
      costLabels: {
        materials: 'ต้นทุนเวชภัณฑ์',
        labor: 'ค่าแรงบุคลากรทางการแพทย์',
        expenses: 'ค่าดำเนินงานคลินิก',
      },
      costLabelsEn: {
        materials: 'Medical supplies',
        labor: 'Medical staff wages',
        expenses: 'Clinic operations',
      },
      insight: {
        title: 'รอบเบิกจ่ายภาครัฐกระทบเงินสดแม้มาร์จิ้นดี',
        body: 'ต้นทุนเวชภัณฑ์คิดเป็น 46% ของต้นทุนรวม และรอบเบิกจ่ายภาครัฐ 45–60 วัน ทำให้กระแสเงินสดตึงแม้กำไรทางบัญชีจะดี',
        action: 'ถาม AI ต่อ',
        prompt: 'ระยะเวลาเบิกจ่ายภาครัฐกระทบกระแสเงินสดแค่ไหน',
      },
      sources: [
        { name: 'รายได้บริการและจัดซื้อภาครัฐ', type: 'sales', typeLabel: 'ยอดขาย', rowCount: 264, quality: 'complete', fileName: 'healthcare_revenue_2026.csv' },
        { name: 'ต้นทุนเวชภัณฑ์', type: 'materials', typeLabel: 'ต้นทุนวัตถุดิบ', rowCount: 198, quality: 'partial', fileName: 'healthcare_medical_supplies.csv' },
        { name: 'ค่าแรงบุคลากรทางการแพทย์', type: 'labor', typeLabel: 'ค่าแรง', rowCount: 112, quality: 'complete', fileName: 'healthcare_payroll.csv' },
        { name: 'ค่าดำเนินงานคลินิก', type: 'expenses', typeLabel: 'ค่าใช้จ่ายอื่น', rowCount: 88, quality: 'complete', fileName: 'healthcare_opex.csv' },
      ],
      quickPrompts: [
        'รอบเบิกจ่ายภาครัฐกระทบเงินสดแค่ไหน',
        'ต้นทุนเวชภัณฑ์ต่อหัตถการสูงขึ้นไหม',
        'รายได้ภาครัฐคิดเป็นกี่เปอร์เซ็นต์',
      ],
    },
  },
  'quantum-security': {
    id: 'quantum-security',
    label: 'ความปลอดภัยควอนตัม',
    shortLabel: 'Quantum Sec',
    labelEn: 'Quantum Security',
    description: 'โซลูชันความปลอดภัยไซเบอร์และควอนตัมสำหรับองค์กร',
    priority: true,
    salesNote: 'ขายก่อนเลย',
    accent: '#7c3aed',
    focusPoints: [
      'ต้นทุนบุคลากรผู้เชี่ยวชาญต่อสัญญา',
      'ระยะเวลา Sales cycle 4–6 เดือน',
      'สัดส่วนรายได้ภาครัฐกับเอกชน',
      'CAC เทียบกับมูลค่าสัญญา (LTV)',
    ],
    sample: {
      revenue: [
        1_250_000, 1_180_000, 1_340_000, 1_420_000, 1_390_000, 1_520_000,
        1_610_000, 1_570_000, 1_720_000, 1_840_000, 1_960_000, 2_150_000,
      ],
      profit: [
        310_000, 292_000, 335_000, 356_000, 348_000, 382_000,
        405_000, 394_000, 432_000, 462_000, 492_000, 540_000,
      ],
      priorYearGrowth: 0.45,
      priorYearMarginDelta: 0.8,
      costSplit: { materials: 18, labor: 54, expenses: 28 },
      costLabels: {
        materials: 'ค่าคลาวด์และฮาร์ดแวร์',
        labor: 'ค่าแรงวิศวกรความปลอดภัย',
        expenses: 'ค่าการตลาดและคอมพลายแอนซ์',
      },
      costLabelsEn: {
        materials: 'Cloud & hardware',
        labor: 'Security engineer wages',
        expenses: 'Marketing & compliance',
      },
      insight: {
        title: 'Sales cycle ยาวและต้นทุนวิศวกรสูง',
        body: 'ต้นทุนบุคลากรผู้เชี่ยวชาญคิดเป็น 54% ของต้นทุนรวม ขณะที่สัญญาองค์กรใช้เวลา 4–6 เดือน จึงต้องบริหาร utilisation ให้เต็ม',
        action: 'ถาม AI ต่อ',
        prompt: 'วิเคราะห์ต้นทุนต่อสัญญาและระยะเวลา Sales cycle ของ Quantum Security',
      },
      sources: [
        { name: 'รายได้สัญญาและใบอนุญาต', type: 'sales', typeLabel: 'ยอดขาย', rowCount: 64, quality: 'complete', fileName: 'quantum_security_contracts.csv' },
        { name: 'ค่าคลาวด์และฮาร์ดแวร์', type: 'materials', typeLabel: 'ต้นทุนวัตถุดิบ', rowCount: 52, quality: 'partial', fileName: 'quantum_security_infrastructure.csv' },
        { name: 'ค่าแรงวิศวกรความปลอดภัย', type: 'labor', typeLabel: 'ค่าแรง', rowCount: 38, quality: 'complete', fileName: 'quantum_security_engineering_payroll.csv' },
        { name: 'ค่าการตลาดและคอมพลายแอนซ์', type: 'expenses', typeLabel: 'ค่าใช้จ่ายอื่น', rowCount: 26, quality: 'duplicate', fileName: 'quantum_security_opex.csv' },
      ],
      quickPrompts: [
        'ต้นทุนต่อสัญญาสูงแค่ไหน',
        'ควรเน้นขายภาครัฐหรือเอกชน',
        'วิเคราะห์ CAC กับ LTV',
      ],
    },
  },
  fnb: {
    id: 'fnb',
    label: 'อาหารและเครื่องดื่ม',
    shortLabel: 'F&B',
    labelEn: 'Food & Beverage',
    description: 'ร้านอาหาร คาเฟ่ และเบเกอรี',
    accent: '#0f766e',
    focusPoints: [
      'ต้นทุนวัตถุดิบและบรรจุภัณฑ์',
      'ยอดขายต่อบิลและช่องทางเดลิเวอรี',
      'ค่าแรงหน้าร้านและ OT',
      'อัตราการสูญเสียของสด',
    ],
    sample: {
      revenue: [
        720_000, 684_000, 762_000, 808_000, 786_000, 862_000,
        918_000, 904_000, 982_000, 1_042_000, 1_118_000, 1_284_500,
      ],
      profit: [
        178_000, 164_000, 192_000, 211_000, 204_000, 229_000,
        248_000, 241_000, 266_000, 281_000, 303_000, 342_800,
      ],
      priorYearGrowth: 0.24,
      priorYearMarginDelta: 0.5,
      costSplit: { materials: 52, labor: 28, expenses: 20 },
      costLabels: {
        materials: 'วัตถุดิบและบรรจุภัณฑ์',
        labor: 'ค่าแรงหน้าร้าน',
        expenses: 'ค่าเช่าและค่าดำเนินงาน',
      },
      costLabelsEn: {
        materials: 'Ingredients & packaging',
        labor: 'Front-of-house wages',
        expenses: 'Rent & operations',
      },
      insight: {
        title: 'ต้นทุนบรรจุภัณฑ์กำลังกัดกำไร',
        body: 'ต้นทุนวัตถุดิบเพิ่มขึ้น 6.2% ใน 30 วันล่าสุด โดยหลักมาจากบรรจุภัณฑ์ ขณะที่ยอดขายยังโต 12.4% ทำให้กำไรโดยรวมยังอยู่ในเกณฑ์ดี',
        action: 'ถาม AI ต่อ',
        prompt: 'ต้นทุนบรรจุภัณฑ์เพิ่มขึ้นเพราะอะไร และควรลดอย่างไร',
      },
      sources: [
        { name: 'ยอดขายรายวัน', type: 'sales', typeLabel: 'ยอดขาย', rowCount: 365, quality: 'complete', fileName: 'sales_daily_2026.csv' },
        { name: 'ต้นทุนวัตถุดิบ', type: 'materials', typeLabel: 'ต้นทุนวัตถุดิบ', rowCount: 248, quality: 'partial', fileName: 'ingredient_cost_oct.csv' },
        { name: 'ค่าแรงพนักงาน', type: 'labor', typeLabel: 'ค่าแรง', rowCount: 120, quality: 'complete', fileName: 'payroll_oct_2026.csv' },
        { name: 'ค่าใช้จ่ายดำเนินงาน', type: 'expenses', typeLabel: 'ค่าใช้จ่ายอื่น', rowCount: 86, quality: 'duplicate', fileName: 'operating_expenses.csv' },
      ],
      quickPrompts: [
        'ต้นทุนบรรจุภัณฑ์เพิ่มขึ้นเพราะอะไร',
        'ยอดขายช่องทางไหนโตดีที่สุด',
        'ควรปรับราคาเมนูไหนก่อน',
      ],
    },
  },
}

export const FOCUS_INDUSTRIES: IndustryProfile[] = [
  INDUSTRY_PROFILES.logistics,
  INDUSTRY_PROFILES['energy-fuel'],
  INDUSTRY_PROFILES.ev,
  INDUSTRY_PROFILES.healthcare,
  INDUSTRY_PROFILES['quantum-security'],
  INDUSTRY_PROFILES.fnb,
]

export function normalizeIndustryId(value?: string | null): IndustryId {
  if (value && Object.hasOwn(INDUSTRY_PROFILES, value)) return value as IndustryId
  return 'fnb'
}

export function getIndustryProfile(value?: string | null): IndustryProfile {
  return INDUSTRY_PROFILES[normalizeIndustryId(value)]
}

export function getIndustryChildren(id: IndustryId): IndustryProfile[] {
  return FOCUS_INDUSTRIES.filter((industry) => industry.parentId === id)
}
