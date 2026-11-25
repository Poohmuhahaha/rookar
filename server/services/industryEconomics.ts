import { db } from '../db'
import { getIndustryProfile, normalizeIndustryId, type IndustryId } from '../../src/lib/industries'
import type { IndustryEconomics } from '../../src/types'

const WORLD_BANK_BASE = 'https://api.worldbank.org/v2/country/THA/indicator'
const TTL = 6 * 60 * 60 * 1000
const TIMEOUT = 15_000

type Unit = 'percent' | 'years' | 'score' | 'per_1000' | 'per_million' | 'kg_oe'
type IndicatorConfig = {
  key: string
  label: string
  labelEn: string
  note: string
  noteEn: string
  useCase: string
  useCaseEn: string
  code: string
  unit: Unit
}

const CONFIG: Record<IndustryId, IndicatorConfig[]> = {
  fnb: [
    {
      key: 'consumption',
      label: 'การบริโภคภาคครัวเรือน',
      labelEn: 'Household consumption',
      note: 'การเติบโตของดีมานด์ในประเทศ',
      noteEn: 'domestic demand growth',
      useCase: 'ใช้ประเมินกำลังซื้อและความถี่ในการใช้จ่ายนอกบ้าน',
      useCaseEn: 'Gauge household purchasing power and frequency of out-of-home spending.',
      code: 'NE.CON.PRVT.KD.ZG',
      unit: 'percent',
    },
    {
      key: 'inflation',
      label: 'เงินเฟ้อ CPI',
      labelEn: 'Inflation (CPI)',
      note: 'ต้นทุนวัตถุดิบและราคาขาย',
      noteEn: 'input and menu costs',
      useCase: 'ใช้ปรับสมมติฐานต้นทุนวัตถุดิบและราคาเมนู',
      useCaseEn: 'Stress-test ingredient costs and menu pricing.',
      code: 'FP.CPI.TOTL.ZG',
      unit: 'percent',
    },
    {
      key: 'agriculture',
      label: 'มูลค่าเพิ่มภาคเกษตร',
      labelEn: 'Agriculture value added',
      note: 'สัดส่วนต่อ GDP',
      noteEn: 'share of GDP',
      useCase: 'สะท้อนต้นทุนวัตถุดิบและความเสี่ยงด้านอุปทานอาหาร',
      useCaseEn: 'Signals ingredient cost pressure and food-supply risk.',
      code: 'NV.AGR.TOTL.ZS',
      unit: 'percent',
    },
    {
      key: 'urban',
      label: 'ประชากรในเมือง',
      labelEn: 'Urban population',
      note: 'ฐานลูกค้าหน้าร้าน',
      noteEn: 'store demand base',
      useCase: 'ใช้ประเมินทำเลและฐานลูกค้าหน้าร้าน',
      useCaseEn: 'Estimate store catchment and location potential.',
      code: 'SP.URB.TOTL.IN.ZS',
      unit: 'percent',
    },
  ],
  logistics: [
    {
      key: 'trade',
      label: 'การค้ารวม',
      labelEn: 'Trade openness',
      note: 'สัดส่วนต่อ GDP',
      noteEn: 'share of GDP',
      useCase: 'ใช้ประเมินปริมาณสินค้าและดีมานด์ขนส่งข้ามพรมแดน',
      useCaseEn: 'Estimate cargo volume and cross-border transport demand.',
      code: 'NE.TRD.GNFS.ZS',
      unit: 'percent',
    },
    {
      key: 'transport',
      label: 'ค่าขนส่งระหว่างประเทศ',
      labelEn: 'Transport services',
      note: 'สัดส่วนของ service exports',
      noteEn: 'share of service exports',
      useCase: 'สะท้อนรายได้บริการขนส่งและโอกาสรับงานต่างประเทศ',
      useCaseEn: 'Signals transport-service revenue and cross-border opportunities.',
      code: 'BX.GSR.TRAN.ZS',
      unit: 'percent',
    },
    {
      key: 'urban',
      label: 'ประชากรในเมือง',
      labelEn: 'Urban population',
      note: 'ความหนาแน่นเส้นทาง',
      noteEn: 'route density',
      useCase: 'ใช้ประเมินความหนาแน่นเส้นทางและต้นทุนปลายทาง',
      useCaseEn: 'Assess route density and last-mile cost.',
      code: 'SP.URB.TOTL.IN.ZS',
      unit: 'percent',
    },
    {
      key: 'lpi',
      label: 'ดัชนีประสิทธิภาพโลจิสติกส์',
      labelEn: 'Logistics Performance Index',
      note: 'คะแนนเต็ม 5',
      noteEn: 'score out of 5',
      useCase: 'ใช้เทียบคุณภาพโลจิสติกส์ไทยกับคู่แข่งในภูมิภาค',
      useCaseEn: "Benchmark Thailand's logistics quality against regional peers.",
      code: 'LP.LPI.OVRL.XQ',
      unit: 'score',
    },
  ],
  'energy-fuel': [
    {
      key: 'energyImports',
      label: 'การนำเข้าพลังงาน',
      labelEn: 'Energy imports',
      note: 'สัดส่วนการใช้พลังงาน',
      noteEn: 'share of energy use',
      useCase: 'วัดการพึ่งพาพลังงานนำเข้าและความเสี่ยงราคา',
      useCaseEn: 'Measures import dependence and price risk.',
      code: 'EG.IMP.CONS.ZS',
      unit: 'percent',
    },
    {
      key: 'fuelExports',
      label: 'การส่งออกเชื้อเพลิง',
      labelEn: 'Fuel exports',
      note: 'สัดส่วนของสินค้าส่งออก',
      noteEn: 'share of merchandise exports',
      useCase: 'สะท้อนสัดส่วนรายได้จากการส่งออกเชื้อเพลิง',
      useCaseEn: 'Signals exposure to fuel-export revenue.',
      code: 'TX.VAL.FUEL.ZS.UN',
      unit: 'percent',
    },
    {
      key: 'gdp',
      label: 'GDP ประเทศไทย',
      labelEn: 'Thailand GDP',
      note: 'การเติบโตทางเศรษฐกิจ',
      noteEn: 'economic growth',
      useCase: 'ใช้ประเมินดีมานด์พลังงานจากกิจกรรมเศรษฐกิจ',
      useCaseEn: 'Estimate energy demand driven by economic activity.',
      code: 'NY.GDP.MKTP.KD.ZG',
      unit: 'percent',
    },
    {
      key: 'energyPerCapita',
      label: 'การใช้พลังงานต่อคน',
      labelEn: 'Energy use per capita',
      note: 'กิโลกรัมเทียบเท่าน้ำมันดิบ',
      noteEn: 'kg of oil equivalent',
      useCase: 'ใช้เทียบความเข้มข้นการใช้พลังงานต่อคน',
      useCaseEn: 'Compare energy intensity per person.',
      code: 'EG.USE.PCAP.KG.OE',
      unit: 'kg_oe',
    },
  ],
  ev: [
    {
      key: 'highTech',
      label: 'สินค้าไฮเทค',
      labelEn: 'High-tech exports',
      note: 'สัดส่วนของสินค้าผลิต',
      noteEn: 'share of manufactured exports',
      useCase: 'สะท้อนฐานการผลิตเทคโนโลยีและห่วงโซ่อุปทาน EV',
      useCaseEn: 'Signals the tech manufacturing base and EV supply chain.',
      code: 'TX.VAL.TECH.MF.ZS',
      unit: 'percent',
    },
    {
      key: 'urban',
      label: 'ประชากรในเมือง',
      labelEn: 'Urban population',
      note: 'ฐานผู้ใช้ EV',
      noteEn: 'EV adoption base',
      useCase: 'ใช้ประเมินฐานผู้ใช้และความพร้อมสถานีชาร์จ',
      useCaseEn: 'Estimate adoption base and charging coverage needs.',
      code: 'SP.URB.TOTL.IN.ZS',
      unit: 'percent',
    },
    {
      key: 'gdp',
      label: 'GDP ประเทศไทย',
      labelEn: 'Thailand GDP',
      note: 'การเติบโตทางเศรษฐกิจ',
      noteEn: 'economic growth',
      useCase: 'ใช้ประเมินกำลังซื้อและรอบการเปลี่ยนรถ',
      useCaseEn: 'Gauge purchasing power and vehicle replacement cycles.',
      code: 'NY.GDP.MKTP.KD.ZG',
      unit: 'percent',
    },
    {
      key: 'consumption',
      label: 'การบริโภคภาคครัวเรือน',
      labelEn: 'Household consumption',
      note: 'การเติบโตของดีมานด์ในประเทศ',
      noteEn: 'domestic demand growth',
      useCase: 'สะท้อนดีมานด์ผู้บริโภคสำหรับรถและบริการหลังการขาย',
      useCaseEn: 'Signals consumer demand for vehicles and after-sales.',
      code: 'NE.CON.PRVT.KD.ZG',
      unit: 'percent',
    },
  ],
  healthcare: [
    {
      key: 'healthSpend',
      label: 'รายจ่ายสุขภาพ',
      labelEn: 'Health expenditure',
      note: 'สัดส่วนต่อ GDP',
      noteEn: 'share of GDP',
      useCase: 'ใช้ประเมินขนาดตลาดและงบผู้ป่วย',
      useCaseEn: 'Estimate market size and spend per patient.',
      code: 'SH.XPD.CHEX.GD.ZS',
      unit: 'percent',
    },
    {
      key: 'aging',
      label: 'ประชากรอายุ 65+',
      labelEn: 'Population 65+',
      note: 'สัดส่วนประชากร',
      noteEn: 'share of population',
      useCase: 'ใช้ประเมินดีมานด์ระยะยาวและบริการที่ต้องลงทุน',
      useCaseEn: 'Forecast long-term demand and service investment.',
      code: 'SP.POP.65UP.TO.ZS',
      unit: 'percent',
    },
    {
      key: 'lifeExpectancy',
      label: 'อายุขัยเฉลี่ย',
      labelEn: 'Life expectancy',
      note: 'ปี',
      noteEn: 'years',
      useCase: 'สะท้อนภาระโรคและความต้องการดูแลระยะยาว',
      useCaseEn: 'Signals disease burden and long-term care needs.',
      code: 'SP.DYN.LE00.IN',
      unit: 'years',
    },
    {
      key: 'physicians',
      label: 'แพทย์ต่อประชากร 1,000 คน',
      labelEn: 'Physicians per 1,000',
      note: 'กำลังคนทางการแพทย์',
      noteEn: 'medical workforce',
      useCase: 'วัดกำลังคนและข้อจำกัดการขยายบริการ',
      useCaseEn: 'Measures workforce capacity and expansion constraints.',
      code: 'SH.MED.PHYS.ZS',
      unit: 'per_1000',
    },
  ],
  'quantum-security': [
    {
      key: 'ict',
      label: 'ICT service exports',
      labelEn: 'ICT service exports',
      note: 'สัดส่วนของ service exports',
      noteEn: 'share of service exports',
      useCase: 'สะท้อนขนาดตลาดบริการดิจิทัลที่พร้อมจ่าย',
      useCaseEn: 'Signals the addressable digital-services market.',
      code: 'BX.GSR.CCIS.ZS',
      unit: 'percent',
    },
    {
      key: 'highTech',
      label: 'สินค้าไฮเทค',
      labelEn: 'High-tech exports',
      note: 'สัดส่วนของสินค้าผลิต',
      noteEn: 'share of manufactured exports',
      useCase: 'สะท้อนฐานลูกค้าอุตสาหกรรมที่ต้องป้องกัน IP',
      useCaseEn: 'Signals the high-tech client base that needs IP protection.',
      code: 'TX.VAL.TECH.MF.ZS',
      unit: 'percent',
    },
    {
      key: 'rnd',
      label: 'รายจ่าย R&D',
      labelEn: 'R&D expenditure',
      note: 'สัดส่วนต่อ GDP',
      noteEn: 'share of GDP',
      useCase: 'วัดความพร้อมลงทุนด้านนวัตกรรมและ cybersecurity',
      useCaseEn: 'Gauges innovation and cybersecurity investment capacity.',
      code: 'GB.XPD.RSDV.GD.ZS',
      unit: 'percent',
    },
    {
      key: 'secureServers',
      label: 'เซิร์ฟเวอร์อินเทอร์เน็ตปลอดภัย',
      labelEn: 'Secure Internet servers',
      note: 'ต่อประชากร 1 ล้านคน',
      noteEn: 'per 1 million people',
      useCase: 'วัดโครงสร้างดิจิทัลและพื้นผิวที่ต้องป้องกัน',
      useCaseEn: 'Measures digital infrastructure and the attack surface to protect.',
      code: 'IT.NET.SECR.P6',
      unit: 'per_million',
    },
  ],
}


type IndicatorValue = {
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
  unit: Unit
  year: string
  periodLabel: string
}

function round1(value: number) {
  return Math.round(value * 10) / 10
}

async function fetchIndicator(config: IndicatorConfig, attempt = 0): Promise<IndicatorValue | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT)
  try {
    const year = new Date().getFullYear()
    const response = await fetch(
      `${WORLD_BANK_BASE}/${config.code}?format=json&per_page=60&date=2015:${year}`,
      { headers: { Accept: 'application/json' }, signal: controller.signal },
    )
    if (!response.ok) {
      if ((response.status === 429 || response.status >= 500) && attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
        return fetchIndicator(config, attempt + 1)
      }
      return null
    }
    const payload = await response.json() as [
      { lastupdated?: string },
      { date: string; value: number | null }[],
    ]
    const rows = Array.isArray(payload?.[1])
      ? payload[1]
          .filter((item): item is { date: string; value: number } => typeof item.value === 'number' && Number.isFinite(item.value))
          .sort((a, b) => Number(b.date) - Number(a.date))
      : []
    const row = rows[0]
    if (!row) return null
    const previous = rows[1] ?? null
    const history = rows
      .slice(0, 6)
      .reverse()
      .map((item) => ({ year: item.date, value: round1(item.value) }))
    return {
      key: config.key,
      label: config.label,
      labelEn: config.labelEn,
      note: config.note,
      noteEn: config.noteEn,
      useCase: config.useCase,
      useCaseEn: config.useCaseEn,
      value: round1(row.value),
      previousValue: previous ? round1(previous.value) : null,
      delta: previous ? round1(row.value - previous.value) : null,
      history,
      unit: config.unit,
      year: row.date,
      periodLabel: `ปี ${Number(row.date) + 543}`,
    }
  } catch {
    if (attempt < 1) {
      await new Promise((resolve) => setTimeout(resolve, 800))
      return fetchIndicator(config, attempt + 1)
    }
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function cacheKey(industryId: IndustryId) {
  return `industry-econ-v3-${industryId}`
}

async function readCache(industryId: IndustryId, allowStale: boolean): Promise<IndustryEconomics | null> {
  const row = await db.query<{ payload_json: string; saved_at: number }>('SELECT payload_json, saved_at FROM macro_cache WHERE cache_key = ?').get(cacheKey(industryId))
  if (!row) return null
  if (!allowStale && Date.now() - row.saved_at > TTL) return null
  try {
    return JSON.parse(row.payload_json) as IndustryEconomics
  } catch {
    return null
  }
}

async function writeCache(industryId: IndustryId, data: IndustryEconomics) {
  await db.query(
    'INSERT INTO macro_cache (cache_key, payload_json, saved_at) VALUES (?, ?, ?) ON CONFLICT(cache_key) DO UPDATE SET payload_json = excluded.payload_json, saved_at = excluded.saved_at',
  ).run(cacheKey(industryId), JSON.stringify(data), Date.now())
}

export async function getIndustryEconomics(industry?: string | null): Promise<IndustryEconomics> {
  const industryId = normalizeIndustryId(industry)
  const fresh = await readCache(industryId, false)
  if (fresh) return fresh
  const stale = await readCache(industryId, true)
  const profile = getIndustryProfile(industryId)

  const indicators: IndicatorValue[] = []
  for (const config of CONFIG[industryId]) {
    const indicator = await fetchIndicator(config)
    if (indicator) indicators.push(indicator)
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  if (indicators.length === 0 && stale) return { ...stale, stale: true }

  const data: IndustryEconomics = {
    industryId,
    label: profile.label,
    labelEn: profile.labelEn,
    indicators,
    source: 'World Bank',
    sourceUrl: 'https://data.worldbank.org/country/THA',
    lastUpdated: new Date().toISOString(),
    stale: indicators.length < CONFIG[industryId].length,
  }
  await writeCache(industryId, data)
  return data
}
