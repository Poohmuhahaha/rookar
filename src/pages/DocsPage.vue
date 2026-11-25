<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Link } from '@tanstack/vue-router'
import { ArrowLeft, BookOpen, Search } from '@lucide/vue'
import BrandLogo from '@/components/brand/BrandLogo.vue'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher.vue'
import { locale, t } from '@/lib/i18n'

const sections = [
  { id: 'overview', label: 'ภาพรวม' },
  { id: 'industry', label: 'การเลือกอุตสาหกรรม' },
  { id: 'mapping', label: 'การแมปตัวชี้วัด' },
  { id: 'fetch', label: 'การดึงข้อมูลจริง' },
  { id: 'cache', label: 'แคชและ fallback' },
  { id: 'macro', label: 'Macro Benchmark ระดับประเทศ' },
  { id: 'api', label: 'API ที่ใช้' },
  { id: 'files', label: 'ไฟล์ที่เกี่ยวข้อง' },
  { id: 'limitations', label: 'ข้อจำกัด' },
]

const mapping = [
  { industry: 'F&B', items: 'NE.CON.PRVT.KD.ZG, FP.CPI.TOTL.ZG, NV.AGR.TOTL.ZS, SP.URB.TOTL.IN.ZS' },
  { industry: 'Logistics', items: 'NE.TRD.GNFS.ZS, BX.GSR.TRAN.ZS, SP.URB.TOTL.IN.ZS, LP.LPI.OVRL.XQ' },
  { industry: 'Energy & Fuel', items: 'EG.IMP.CONS.ZS, TX.VAL.FUEL.ZS.UN, NY.GDP.MKTP.KD.ZG, EG.USE.PCAP.KG.OE' },
  { industry: 'EV', items: 'TX.VAL.TECH.MF.ZS, SP.URB.TOTL.IN.ZS, NY.GDP.MKTP.KD.ZG, NE.CON.PRVT.KD.ZG' },
  { industry: 'Healthcare', items: 'SH.XPD.CHEX.GD.ZS, SP.POP.65UP.TO.ZS, SP.DYN.LE00.IN, SH.MED.PHYS.ZS' },
  { industry: 'Quantum Security', items: 'BX.GSR.CCIS.ZS, TX.VAL.TECH.MF.ZS, GB.XPD.RSDV.GD.ZS, IT.NET.SECR.P6' },
]

const query = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
const filteredSections = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  if (!keyword) return sections
  return sections.filter((section) => section.label.toLowerCase().includes(keyword))
})

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function jumpToFirstMatch() {
  const match = filteredSections.value[0]
  if (match) scrollToId(match.id)
}

function handleShortcut(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    searchInput.value?.focus()
  }
}

onMounted(() => window.addEventListener('keydown', handleShortcut))
onBeforeUnmount(() => window.removeEventListener('keydown', handleShortcut))
</script>

<template>
  <div class="min-h-dvh bg-canvas">
    <header class="sticky top-0 z-40 border-b border-ink-100/70 bg-white/95 backdrop-blur">
      <div class="px-4 sm:px-5">
        <div class="mx-auto flex max-w-7xl items-center gap-3 py-4 2xl:max-w-[1560px] 3xl:max-w-[1680px] 3xl:py-5">
          <Link to="/" class="flex shrink-0 items-center gap-2.5" aria-label="ROOKAR">
            <BrandLogo :mark-size="34" />
          </Link>
          <span class="hidden rounded-md bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-muted sm:inline">
            {{ t('policyPage.beta') }}
          </span>

          <div class="mx-auto hidden w-full max-w-[360px] md:block">
            <div class="relative">
              <Search class="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" aria-hidden="true" />
              <input
                ref="searchInput"
                v-model="query"
                type="search"
                :placeholder="t('policyPage.searchPlaceholder')"
                :aria-label="t('policyPage.searchLabel')"
                class="h-9 w-full rounded-lg bg-surface pl-9 pr-14 text-[12.5px] text-ink placeholder:text-faint focus:bg-neutral-200/60 focus:outline-none"
                @keydown.enter.prevent="jumpToFirstMatch"
              />
              <kbd class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-ink-100 bg-white px-1.5 py-0.5 text-[10px] font-medium text-faint">
                ⌘K
              </kbd>
            </div>
          </div>

          <div class="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <LanguageSwitcher />
            <Link
              to="/login"
              class="hidden px-2 text-[14px] font-medium text-ink transition-colors hover:text-muted sm:inline-flex"
            >
              {{ t('policyPage.login') }}
            </Link>
            <Link
              to="/signup"
              class="inline-flex h-10 items-center justify-center rounded-full bg-black px-4 text-[14px] font-semibold text-white transition-colors hover:bg-neutral-800 3xl:h-12 3xl:px-5"
            >
              {{ t('policyPage.tryFree') }}
            </Link>
          </div>
        </div>
      </div>

      <div class="border-t border-ink-100/60">
        <div class="px-4 sm:px-5">
          <div class="no-scrollbar mx-auto flex h-10 max-w-7xl items-center gap-1 overflow-x-auto 2xl:max-w-[1560px] 3xl:max-w-[1680px]">
            <Link
              to="/"
              class="inline-flex h-7 shrink-0 items-center rounded-full px-2.5 text-[12.5px] font-medium text-muted transition hover:bg-surface hover:text-ink"
            >
              {{ t('policyPage.navHome') }}
            </Link>
            <Link
              to="/docs"
              class="inline-flex h-7 shrink-0 items-center rounded-full bg-surface px-2.5 text-[12.5px] font-medium text-ink"
            >
              Docs
            </Link>
            <Link
              to="/policy#terms"
              class="inline-flex h-7 shrink-0 items-center rounded-full px-2.5 text-[12.5px] font-medium text-muted transition hover:bg-surface hover:text-ink"
            >
              {{ t('policyPage.termsTitle') }}
            </Link>
            <Link
              to="/policy#privacy"
              class="inline-flex h-7 shrink-0 items-center rounded-full px-2.5 text-[12.5px] font-medium text-muted transition hover:bg-surface hover:text-ink"
            >
              {{ t('policyPage.privacyTitle') }}
            </Link>
            <a
              href="mailto:support@rookar.co"
              class="inline-flex h-7 shrink-0 items-center rounded-full px-2.5 text-[12.5px] font-medium text-muted transition hover:bg-surface hover:text-ink"
            >
              {{ t('policyPage.navHelp') }}
            </a>
            <span class="ml-auto hidden shrink-0 text-[11px] text-faint lg:block">
              {{ locale === 'en' ? 'Last updated November 24, 2026' : 'อัปเดตล่าสุด 24 พฤศจิกายน 2569' }}
            </span>
          </div>
        </div>
      </div>
    </header>

    <main class="px-4 sm:px-5">
      <div class="mx-auto max-w-7xl py-8 2xl:max-w-[1560px] 3xl:max-w-[1680px]">
        <div class="grid gap-10 lg:grid-cols-[210px_minmax(0,1fr)_230px] xl:grid-cols-[230px_minmax(0,1fr)_250px]">
        <aside class="hidden lg:block">
          <nav class="no-scrollbar sticky top-[128px] max-h-[calc(100dvh-8rem)] overflow-y-auto pr-2" aria-label="เมนูเอกสาร">
            <div class="space-y-0.5">
              <a
                v-for="section in filteredSections"
                :key="section.id"
                :href="`#${section.id}`"
                class="block rounded-lg px-2.5 py-1.5 text-[12.5px] text-muted transition hover:bg-surface hover:text-ink"
              >
                {{ section.label }}
              </a>
              <p v-if="!filteredSections.length" class="px-2.5 py-1.5 text-[11.5px] text-muted">
                {{ locale === 'en' ? 'No matching section' : 'ไม่พบหัวข้อที่ค้นหา' }}
              </p>
              <Link to="/policy" class="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] text-muted transition hover:bg-surface hover:text-ink">
                <BookOpen class="h-3.5 w-3.5" aria-hidden="true" />
                ข้อกำหนดและความเป็นส่วนตัว
              </Link>
            </div>
          </nav>
        </aside>

        <div class="min-w-0 max-w-[1000px]">
          <p class="flex flex-wrap items-center gap-1.5 text-[11.5px] text-faint">
            <Link to="/" class="transition hover:text-ink">ภาพรวม</Link>
            <span aria-hidden="true">/</span>
            <span>Docs</span>
            <span aria-hidden="true">/</span>
            <span class="text-muted">อัลกอริทึมเศรษฐกิจและอุตสาหกรรม</span>
          </p>

          <h1 class="mt-4 text-[30px] font-semibold leading-tight tracking-[-0.03em] text-ink sm:text-[34px]">
            อัลกอริทึมเศรษฐกิจและอุตสาหกรรม
          </h1>
          <p class="mt-2 text-[13px] text-muted">อธิบายวิธีที่หน้า /app/industry สร้างตัวเลขเศรษฐกิจแยกตามอุตสาหกรรม</p>

          <section id="overview" class="mt-10 scroll-mt-24">
            <h2 class="text-[20px] font-semibold tracking-[-0.02em] text-ink">ภาพรวม</h2>
            <p class="mt-2 text-[14px] leading-relaxed text-ink-soft">
              หน้านี้แสดง <strong>ข้อมูลเศรษฐกิจมหภาคจริง</strong> ไม่ใช่ข้อมูลธุรกิจของผู้ใช้ โดยมีสองชั้น:
              (1) ตัวชี้วัดเศรษฐกิจที่เลือกให้สัมพันธ์กับอุตสาหกรรมที่กำลังดู และ
              (2) Macro Benchmark ระดับประเทศเพื่อเป็นบริบทเปรียบเทียบ
            </p>
            <pre class="mt-4 overflow-x-auto rounded-2xl bg-surface p-4 text-[12px] leading-relaxed text-ink-soft"><code>industryFocus
  → normalize เป็น IndustryId
  → โหลด indicator config ของอุตสาหกรรมนั้น
  → ดึงค่าล่าสุดจาก World Bank (หรือแคช)
  → แสดงผล + Macro Benchmark ประเทศ</code></pre>
          </section>

          <section id="industry" class="mt-10 scroll-mt-24">
            <h2 class="text-[20px] font-semibold tracking-[-0.02em] text-ink">1. การเลือกอุตสาหกรรม</h2>
            <p class="mt-2 text-[14px] leading-relaxed text-ink-soft">
              ค่า industry มาจาก dropdown หน้าเศรษฐกิจ (เก็บใน localStorage ผ่าน <code>industryFocus</code>)
              แล้วถูก normalize ด้วย <code>normalizeIndustryId()</code> ถ้าไม่รู้จักจะ fallback เป็น <code>fnb</code>
              ค่านี้ถูกใช้เป็น query key และส่งไปยัง API
            </p>
          </section>

          <section id="mapping" class="mt-10 scroll-mt-24">
            <h2 class="text-[20px] font-semibold tracking-[-0.02em] text-ink">2. การแมปตัวชี้วัดกับอุตสาหกรรม</h2>
            <p class="mt-2 text-[14px] leading-relaxed text-ink-soft">
              แต่ละอุตสาหกรรมมีชุด indicator 4 ตัวที่กำหนดไว้ล่วงหน้าใน
              <code>server/services/industryEconomics.ts</code> โดยเลือก proxy ที่สะท้อนอุปสงค์/โครงสร้างของอุตสาหกรรมนั้น
            </p>
            <div class="mt-4 overflow-x-auto rounded-2xl border border-ink-100">
              <table class="w-full min-w-[640px] text-left text-[12.5px]">
                <thead class="bg-surface text-[11.5px] font-semibold text-ink-soft">
                  <tr>
                    <th class="px-4 py-3">อุตสาหกรรม</th>
                    <th class="px-4 py-3">World Bank indicator codes</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-ink-100/70">
                  <tr v-for="row in mapping" :key="row.industry" class="bg-white">
                    <td class="whitespace-nowrap px-4 py-3 font-semibold text-ink">{{ row.industry }}</td>
                    <td class="px-4 py-3 font-mono text-[11.5px] text-ink-soft">{{ row.items }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="fetch" class="mt-10 scroll-mt-24">
            <h2 class="text-[20px] font-semibold tracking-[-0.02em] text-ink">3. การดึงข้อมูลจริง</h2>
            <ol class="mt-3 list-decimal space-y-2 pl-5 text-[14px] leading-relaxed text-ink-soft">
              <li>เรียก World Bank API: <code>country/THA/indicator/{code}?date=2015:ปีปัจจุบัน</code></li>
              <li>เลือกค่าล่าสุดและปีก่อนหน้า เพื่อคำนวณ Δ และเก็บอนุกรม 6 ปีย้อนหลังสำหรับ sparkline</li>
              <li>แนบปี หน่วย และ use case สำหรับตีความตัวชี้วัดให้แต่ละ Sector</li>
              <li>ถ้า indicator ตัวใดดึงไม่ได้ จะข้ามตัวนั้นและคืนเฉพาะตัวที่สำเร็จ</li>
            </ol>
          </section>

          <section id="cache" class="mt-10 scroll-mt-24">
            <h2 class="text-[20px] font-semibold tracking-[-0.02em] text-ink">4. แคชและ fallback</h2>
            <ul class="mt-3 space-y-2 text-[14px] leading-relaxed text-ink-soft">
              <li><strong>Cache key:</strong> <code>industry-econ-v3-{industryId}</code> ในตาราง <code>macro_cache</code></li>
              <li><strong>TTL:</strong> 6 ชั่วโมง</li>
              <li><strong>Stale fallback:</strong> ถ้าดึงใหม่ไม่สำเร็จและมีแคชเก่า จะคืนแคชพร้อมตั้ง <code>stale: true</code></li>
              <li><strong>ไม่มีข้อมูลเลย:</strong> คืนรายการว่าง และ UI แสดงข้อความ “ยังไม่มีข้อมูลเศรษฐกิจของอุตสาหกรรมนี้”</li>
            </ul>
          </section>

          <section id="macro" class="mt-10 scroll-mt-24">
            <h2 class="text-[20px] font-semibold tracking-[-0.02em] text-ink">5. Macro Benchmark ระดับประเทศ</h2>
            <p class="mt-2 text-[14px] leading-relaxed text-ink-soft">
              การ์ดนี้เป็นข้อมูลระดับประเทศ ไม่เปลี่ยนตามอุตสาหกรรม และใช้ fallback หลายชั้น:
            </p>
            <ul class="mt-3 space-y-2 text-[14px] leading-relaxed text-ink-soft">
              <li>GDP / เงินเฟ้อ / หนี้รัฐ / บัญชีเดินสะพัด: IMF WEO → World Bank</li>
              <li>การว่างงาน: NSO → IMF → World Bank</li>
              <li>แคช 6 ชั่วโมง (key <code>macro-tha-v3</code>) และคืนแคชเก่าเมื่อแหล่งข้อมูลล่ม</li>
            </ul>
          </section>

          <section id="api" class="mt-10 scroll-mt-24">
            <h2 class="text-[20px] font-semibold tracking-[-0.02em] text-ink">6. API ที่ใช้</h2>
            <div class="mt-3 space-y-3">
              <div class="rounded-2xl bg-surface p-4">
                <p class="font-mono text-[12px] font-semibold text-ink">GET /api/macro/industry?industry={id}</p>
                <p class="mt-1 text-[12px] text-muted">คืนชุด indicator เศรษฐกิจของอุตสาหกรรมนั้น + ข้อมูลแคช</p>
              </div>
              <div class="rounded-2xl bg-surface p-4">
                <p class="font-mono text-[12px] font-semibold text-ink">GET /api/macro</p>
                <p class="mt-1 text-[12px] text-muted">คืน Macro Benchmark ระดับประเทศ (6 indicators)</p>
              </div>
            </div>
          </section>

          <section id="files" class="mt-10 scroll-mt-24">
            <h2 class="text-[20px] font-semibold tracking-[-0.02em] text-ink">7. ไฟล์ที่เกี่ยวข้อง</h2>
            <ul class="mt-3 space-y-1.5 font-mono text-[12px] text-ink-soft">
              <li>server/services/industryEconomics.ts</li>
              <li>server/services/macro.ts</li>
              <li>server/routes/macro.ts</li>
              <li>src/lib/macroApi.ts</li>
              <li>src/pages/IndustryPage.vue</li>
              <li>src/components/features/MarketBenchmarkCard.vue</li>
            </ul>
          </section>

          <section id="limitations" class="mt-10 scroll-mt-24">
            <h2 class="text-[20px] font-semibold tracking-[-0.02em] text-ink">8. ข้อจำกัด</h2>
            <ul class="mt-3 space-y-2 text-[14px] leading-relaxed text-ink-soft">
              <li>ข้อมูล World Bank เป็นรายปีและมี lag 1–2 ปี</li>
              <li>Indicator เป็น proxy ระดับประเทศ/ภาคเศรษฐกิจ ไม่ใช่ GDP ของอุตสาหกรรมโดยตรง</li>
              <li>หน้าเศรษฐกิจไม่อ่านข้อมูลธุรกิจของผู้ใช้ — ข้อมูลธุรกิจอยู่ใน Dashboard เท่านั้น</li>
            </ul>
          </section>

          <Link to="/app/industry" class="mt-10 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-700 underline-offset-4 transition hover:text-brand-900 hover:underline">
            <ArrowLeft class="h-4 w-4" aria-hidden="true" />
            ไปที่หน้าเศรษฐกิจและอุตสาหกรรม
          </Link>
        </div>

        <aside class="hidden lg:block">
          <div class="no-scrollbar sticky top-[128px] max-h-[calc(100dvh-8rem)] overflow-y-auto pr-2">
            <p class="text-[11px] font-semibold text-ink">{{ locale === 'en' ? 'On this page' : 'ในหน้านี้' }}</p>
            <nav class="mt-3 space-y-1.5 border-l border-ink-100 pl-3">
              <a
                v-for="section in filteredSections"
                :key="section.id"
                :href="`#${section.id}`"
                class="block text-[11.5px] text-muted transition hover:text-ink"
              >
                {{ section.label }}
              </a>
            </nav>
          </div>
        </aside>
        </div>
      </div>
    </main>

    <footer class="border-t border-ink-100/70">
      <div class="px-4 sm:px-5">
        <div class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 py-6 text-[11px] text-faint sm:flex-row 2xl:max-w-[1560px] 3xl:max-w-[1680px]">
          <span>© 2569 ROOKAR · {{ t('policyPage.beta') }}</span>
          <Link to="/login" class="underline-offset-4 transition hover:text-ink hover:underline">
            {{ t('policyPage.backToLogin') }}
          </Link>
        </div>
      </div>
    </footer>
  </div>
</template>
