<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Link } from '@tanstack/vue-router'
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  ChevronDown,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  Sparkles,
  X,
} from '@lucide/vue'
import BrandLogo from '@/components/brand/BrandLogo.vue'
import KpiCard from '@/components/charts/KpiCard.vue'
import RevenueChart from '@/components/charts/RevenueChart.vue'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher.vue'
import { getSession } from '@/lib/mockApi'
import type { KpiPoint } from '@/types'

const session = getSession()

const faqs = [
  {
    q: 'จำเป็นต้องมีความรู้เรื่องบัญชีหรือการเงินมาก่อนไหม?',
    a: 'ไม่จำเป็นเลยครับ ROOKAR ออกแบบมาเพื่อให้ผู้ประกอบการเข้าใจตัวเลขได้ทันที มีภาษาไทยที่เข้าใจง่าย และมีผู้ช่วย AI ช่วยแปลความหมายพร้อมให้คำแนะนำในเชิงธุรกิจ',
  },
  {
    q: 'ไฟล์ประเภทไหนบ้างที่สามารถนำเข้ามาในระบบได้?',
    a: 'รองรับไฟล์ CSV และ Excel ยอดนิยม เช่น ยอดขายรายวันจากระบบ POS, รายการซื้อวัตถุดิบ, ตารางค่าแรงพนักงาน และค่าใช้จ่ายทั่วไป โดยระบบมี AI ช่วยจับคู่หัวตารางอัตโนมัติ',
  },
  {
    q: 'ข้อมูลธุรกิจของฉันจะปลอดภัยหรือไม่?',
    a: 'ปลอดภัย 100% ครับ เราปฏิบัติตามมาตรฐาน PDPA และในเวอร์ชันทดลอง ข้อมูลทั้งหมดจะถูกจัดเก็บไว้ในเบราว์เซอร์ของคุณเท่านั้น คุณสามารถลบข้อมูลทั้งหมดได้ทุกเมื่อที่ต้องการ',
  },
  {
    q: 'ช่วง Closed Trial มีค่าใช้จ่ายหรือไม่?',
    a: 'ไม่มีค่าใช้จ่ายใดๆ ทั้งสิ้นครับ ผู้ประกอบการที่ได้รับคัดเลือกเข้าร่วม Closed Trial จะได้ใช้งานฟีเจอร์ครบทุกมิติฟรีโดยไม่มีข้อผูกมัด',
  },
]

const activeFaq = ref<number | null>(0)
function toggleFaq(index: number) {
  activeFaq.value = activeFaq.value === index ? null : index
}

const pillars = [
  {
    icon: Boxes,
    title: 'Project Context',
    kicker: 'Memory that stays with you',
    visual: 'memory',
    body: 'สร้างพื้นที่แยกเฉพาะแต่ละธุรกิจ เก็บเป้าหมาย ข้อมูล และประวัติการสนทนาให้ต่อเนื่อง โดยผู้ใช้ควบคุม Memory และข้อมูลส่วนบุคคลได้',
    tags: ['Private workspace', 'User-controlled', 'Persistent'],
  },
  {
    icon: Sparkles,
    title: 'Specialist AI',
    kicker: 'Four minds, one workspace',
    visual: 'agents',
    body: 'ผู้เชี่ยวชาญ 4 ด้าน: Finance, Market, Strategy และ Business Planning ทำงานจากบริบทร่วมกัน ลดการเริ่มต้นอธิบายใหม่ทุกครั้ง',
    tags: ['4 specialists', 'Shared context', 'No re-briefing'],
  },
  {
    icon: ShieldCheck,
    title: 'Sources & Trust',
    kicker: 'Answers you can trace',
    visual: 'sources',
    body: 'ให้ความสำคัญกับข้อมูลร้านและแหล่งทางการไทย (สศช., ธปท.) พร้อมบอกข้อจำกัด ไม่สร้าง AI Certainty เกินจริง',
    tags: ['Traceable', 'PDPA', 'Honest limits'],
  },
  {
    icon: LayoutDashboard,
    title: 'Multi-Output',
    kicker: 'From insight to action',
    visual: 'output',
    body: 'ผลลัพธ์ไม่ได้มีแค่ข้อความ แต่ต่อยอดเป็นตาราง กราฟ จำลอง What-If และแปลงเป็น Action Plan สำหรับลงมือทำจริง',
    tags: ['Tables', 'What-If', 'Action plan'],
  },
]

function setSpotlight(event: PointerEvent) {
  const card = event.currentTarget as HTMLElement
  const rect = card.getBoundingClientRect()
  card.style.setProperty('--spot-x', `${event.clientX - rect.left}px`)
  card.style.setProperty('--spot-y', `${event.clientY - rect.top}px`)
}

function clearSpotlight(event: PointerEvent) {
  const card = event.currentTarget as HTMLElement
  card.style.removeProperty('--spot-x')
  card.style.removeProperty('--spot-y')
}

const carouselTrack = ref<HTMLElement | null>(null)
const stickyCard = ref<HTMLElement | null>(null)
const scrollProgress = ref(0)
const mobileMenuOpen = ref(false)
const headerNav = ref<HTMLElement | null>(null)

function closeMobileMenu() {
  mobileMenuOpen.value = false
}

function onDocumentPointerDown(event: PointerEvent) {
  if (!mobileMenuOpen.value) return
  if (headerNav.value?.contains(event.target as Node)) return
  closeMobileMenu()
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeMobileMenu()
}
const slideProgress = computed(() => scrollProgress.value * (pillars.length - 1))
const activeIndex = computed(() => Math.round(slideProgress.value))

function slideStyle(index: number) {
  const exit = Math.min(1, Math.max(0, slideProgress.value - index))
  return {
    transform: `translateY(${-120 * exit}%)`,
    zIndex: pillars.length - index,
  }
}

let scrollRaf = 0

function updateScrollProgress() {
  const track = carouselTrack.value
  const sticky = stickyCard.value
  if (!track || !sticky) return

  const trackRect = track.getBoundingClientRect()
  const trackTop = window.scrollY + trackRect.top
  const stickyTop = Number.parseFloat(getComputedStyle(sticky).top) || 0
  const start = trackTop - stickyTop
  const distance = track.offsetHeight - sticky.offsetHeight
  const raw = distance > 0 ? (window.scrollY - start) / distance : 0
  scrollProgress.value = Math.min(1, Math.max(0, raw))
}

function handleScroll() {
  if (scrollRaf) return
  scrollRaf = window.requestAnimationFrame(() => {
    scrollRaf = 0
    updateScrollProgress()
  })
}

onMounted(() => {
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleScroll)
  document.addEventListener('pointerdown', onDocumentPointerDown)
  document.addEventListener('keydown', onDocumentKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleScroll)
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  document.removeEventListener('keydown', onDocumentKeydown)
  if (scrollRaf) window.cancelAnimationFrame(scrollRaf)
})

const steps = [
  {
    title: 'สมัครสมาชิกและบอกเป้าหมาย',
    body: 'กรอกข้อมูลธุรกิจคร่าวๆ เพื่อให้ AI ปรับคำแนะนำให้เหมาะกับขนาดและประเภทธุรกิจของคุณ',
  },
  {
    title: 'อัปโหลดไฟล์แรกของคุณ',
    body: 'ลากวางไฟล์ CSV ยอดขายหรือต้นทุน แล้วเริ่มวิเคราะห์ได้ทันที',
  },
  {
    title: 'สั่งการและคุยกับ AI',
    body: 'เห็นภาพรวมธุรกิจบนแดชบอร์ด และปรึกษา AI เพื่อหาจุดรั่วไหลของต้นทุนและเพิ่มกำไรได้เลย',
  },
]

const previewKpis = [
  { label: 'รายได้รวม (6 เดือน)', value: '฿6,248,500', change: '+12.4%' },
  { label: 'กำไรสุทธิ', value: '฿1,681,800', change: '+8.1%' },
  { label: 'ต้นทุนรวม', value: '฿4,566,700', change: '+3.2%' },
  { label: 'อัตรากำไร (Margin)', value: '26.9%', change: '+1.8%' },
]

type LandingKpi = {
  label: string
  value: string
  change: string
  tone: 'positive' | 'negative' | 'neutral'
  spark: number[]
  sparkColor: string
  info: string
}

const landingKpis: LandingKpi[] = [
  {
    label: 'รายได้รวม',
    value: '฿6,248,500',
    change: '+12.4%',
    tone: 'positive',
    spark: [684000, 762000, 786000, 862000, 918000, 1284500],
    sparkColor: '#18181b',
    info: 'รายได้รวมจากทุกช่องทางในช่วง 6 เดือนล่าสุด',
  },
  {
    label: 'กำไรสุทธิ',
    value: '฿1,681,800',
    change: '+8.1%',
    tone: 'positive',
    spark: [164000, 192000, 204000, 229000, 248000, 342800],
    sparkColor: '#ea580c',
    info: 'รายได้หักต้นทุนและค่าใช้จ่ายทั้งหมดแล้ว',
  },
  {
    label: 'ต้นทุนรวม',
    value: '฿4,566,700',
    change: '+3.2%',
    tone: 'negative',
    spark: [690000, 720000, 700000, 740000, 760000, 820000],
    sparkColor: '#18181b',
    info: 'ต้นทุนวัตถุดิบ ค่าแรง และค่าใช้จ่ายดำเนินงาน',
  },
  {
    label: 'อัตรากำไร',
    value: '26.9%',
    change: '+1.8 จุด',
    tone: 'positive',
    spark: [24.1, 23.9, 24.5, 25.2, 26.1, 26.9],
    sparkColor: '#18181b',
    info: 'กำไรสุทธิหารด้วยรายได้รวม คิดเป็นเปอร์เซ็นต์',
  },
]

const previewSeries: KpiPoint[] = [
  { label: 'มิ.ย.', revenue: 862000, profit: 229000 },
  { label: 'ก.ค.', revenue: 918000, profit: 248000 },
  { label: 'ส.ค.', revenue: 904000, profit: 241000 },
  { label: 'ก.ย.', revenue: 982000, profit: 266000 },
  { label: 'ต.ค.', revenue: 1042000, profit: 281000 },
  { label: 'พ.ย.', revenue: 1284500, profit: 342800 },
]
</script>

<template>
  <div class="min-h-dvh bg-canvas text-ink selection:bg-brand-100 selection:text-brand-900">
    <!-- Navigation Bar -->
    <header class="relative z-50">
      <div ref="headerNav" class="px-4 pt-3 sm:px-5">
        <div class="relative mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/50 bg-white/60 px-4 py-3 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white/45 2xl:max-w-[1560px] 3xl:max-w-[1680px] 3xl:px-5 3xl:py-4">
          <Link to="/" aria-label="ROOKAR" class="shrink-0">
            <BrandLogo :mark-size="34" class="!h-[30px] sm:!h-[34px]" />
          </Link>

          <nav class="hidden items-center gap-7 text-[14px] font-medium text-ink/70 md:flex 3xl:gap-8">
            <a href="#features" class="transition hover:text-ink">ฟีเจอร์เด่น</a>
            <a href="#how-it-works" class="transition hover:text-ink">ขั้นตอนการทำงาน</a>
            <a href="#faq" class="transition hover:text-ink">คำถามพบบ่อย</a>
            <Link to="/docs" class="transition hover:text-ink">Docs</Link>
          </nav>

          <div class="flex items-center gap-1.5 sm:gap-3">
            <div class="hidden sm:block">
              <LanguageSwitcher />
            </div>
            <div class="sm:hidden">
              <LanguageSwitcher icon-only />
            </div>
            <template v-if="session">
              <Link
                to="/app"
                class="hidden h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-black px-3 text-[13px] font-semibold text-white transition-colors hover:bg-neutral-800 min-[360px]:inline-flex sm:h-10 sm:px-4 sm:text-[14px] 3xl:h-12 3xl:px-5"
              >
                ไปที่แดชบอร์ด
                <ArrowRight class="h-4 w-4" aria-hidden="true" />
              </Link>
            </template>
            <template v-else>
              <Link
                to="/login"
                class="hidden px-2 text-[14px] font-medium text-ink transition-colors hover:text-muted sm:inline-flex"
              >
                เข้าสู่ระบบ
              </Link>
            </template>

            <button
              type="button"
              class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-black/5 sm:h-10 sm:w-10 md:hidden"
              :aria-expanded="mobileMenuOpen"
              aria-controls="mobile-menu"
              :aria-label="mobileMenuOpen ? 'ปิดเมนู' : 'เปิดเมนู'"
              @click="mobileMenuOpen = !mobileMenuOpen"
            >
              <X v-if="mobileMenuOpen" class="h-5 w-5" aria-hidden="true" />
              <Menu v-else class="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <nav
            v-if="mobileMenuOpen"
            id="mobile-menu"
            class="absolute inset-x-0 top-full z-50 mt-2 rounded-[1.75rem] border border-black/5 bg-white p-2 text-[14px] font-medium text-ink md:hidden"
            aria-label="เมนูหลัก"
          >
            <a
              href="#features"
              class="block rounded-2xl px-4 py-3 transition-colors hover:bg-black/5"
              @click="closeMobileMenu"
            >
              ฟีเจอร์เด่น
            </a>
            <a
              href="#how-it-works"
              class="block rounded-2xl px-4 py-3 transition-colors hover:bg-black/5"
              @click="closeMobileMenu"
            >
              ขั้นตอนการทำงาน
            </a>
            <a
              href="#faq"
              class="block rounded-2xl px-4 py-3 transition-colors hover:bg-black/5"
              @click="closeMobileMenu"
            >
              คำถามพบบ่อย
            </a>
            <Link
              to="/docs"
              class="block rounded-2xl px-4 py-3 transition-colors hover:bg-black/5"
              @click="closeMobileMenu"
            >
              Docs
            </Link>
            <template v-if="!session">
              <div class="mx-2 my-1 h-px bg-black/10" aria-hidden="true" />
              <Link
                to="/login"
                class="block rounded-2xl px-4 py-3 transition-colors hover:bg-black/5"
                @click="closeMobileMenu"
              >
                เข้าสู่ระบบ
              </Link>
              <Link
                to="/signup"
                class="mt-1 flex h-11 items-center justify-center rounded-full bg-black px-4 text-[14px] font-semibold text-white transition-colors hover:bg-neutral-800"
                @click="closeMobileMenu"
              >
                เริ่มทดลองฟรี
              </Link>
            </template>
            <template v-else>
              <div class="mx-2 my-1 h-px bg-black/10" aria-hidden="true" />
              <Link
                to="/app"
                class="mt-1 flex h-11 items-center justify-center gap-1.5 rounded-full bg-black px-4 text-[14px] font-semibold text-white transition-colors hover:bg-neutral-800"
                @click="closeMobileMenu"
              >
                ไปที่แดชบอร์ด
                <ArrowRight class="h-4 w-4" aria-hidden="true" />
              </Link>
            </template>
          </nav>
        </div>
      </div>
    </header>

    <div
      v-if="mobileMenuOpen"
      class="fixed inset-0 z-40 bg-black/25 backdrop-blur-sm md:hidden"
      aria-hidden="true"
      @click="closeMobileMenu"
    />

    <main>
      <!-- Hero -->
      <section class="px-4 sm:px-5">
        <div class="relative mx-auto flex min-h-[calc(80dvh+1rem)] max-w-7xl flex-col overflow-hidden rounded-[32px] bg-brand-950 text-white 2xl:max-w-[1560px] 3xl:max-w-[1680px] 3xl:rounded-[40px]">
          <div class="bg-waves absolute inset-0 scale-110 opacity-35 mix-blend-screen" aria-hidden="true" />
          <div
            class="absolute inset-0 bg-gradient-to-br from-brand-950/95 via-brand-950/80 to-brand-800/60"
            aria-hidden="true"
          />
          <div
            class="absolute -right-24 top-10 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl"
            aria-hidden="true"
          />

          <div class="relative grid flex-1 shrink-0 content-center gap-12 p-6 sm:p-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:p-14 2xl:gap-16 2xl:p-16 3xl:p-20">
            <div>
              <h1
                class="mt-6 text-balance text-[clamp(2.5rem,4.4vw,4.5rem)] font-semibold leading-[1.14] tracking-[-0.035em]"
              >
                เห็นทุกตัวเลขธุรกิจ
                <br class="hidden sm:block" />
                ตัดสินใจได้มั่นใจขึ้น
              </h1>

              <p class="mt-5 max-w-xl text-[14.5px] leading-relaxed text-white/70 sm:text-[15px] 2xl:max-w-2xl 3xl:max-w-[720px]">
                ROOKAR เปลี่ยนไฟล์ยอดขายและต้นทุนที่กระจัดกระจาย ให้เป็นพื้นที่ทำงานตัดสินใจทางธุรกิจด้วย
                Specialist AI ที่เข้าใจบริบท ตรวจสอบที่มาได้ และแปลงข้อมูลเป็น Next Action ทันที
              </p>

              <div class="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center 3xl:mt-10">
                <Link
                  to="/signup"
                  class="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-[14px] font-semibold text-brand-950 transition-colors hover:bg-brand-100 2xl:h-14 2xl:px-8"
                >
                  เริ่มต้นใช้งานฟรี
                  <ArrowRight class="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/login"
                  class="inline-flex h-12 items-center justify-center rounded-full bg-white/10 px-6 text-[14px] font-medium text-white transition-colors hover:bg-white/15 2xl:h-14 2xl:px-8"
                >
                  เข้าใช้งานบัญชีทดลอง
                </Link>
              </div>

              <ul class="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-white/60 3xl:mt-9">
                <li class="flex items-center gap-1.5">
                  <CheckCircle2 class="h-3.5 w-3.5 shrink-0 text-white/40" aria-hidden="true" />
                  ใช้งานได้ทันทีใน 3 นาที
                </li>
                <li class="flex items-center gap-1.5">
                  <CheckCircle2 class="h-3.5 w-3.5 shrink-0 text-white/40" aria-hidden="true" />
                  รองรับ CSV / Excel
                </li>
                <li class="flex items-center gap-1.5">
                  <CheckCircle2 class="h-3.5 w-3.5 shrink-0 text-white/40" aria-hidden="true" />
                  สอดคล้องมาตรฐาน PDPA
                </li>
              </ul>

              <div class="mt-10 hidden flex-col gap-4 lg:flex 3xl:mt-12">
                <span class="h-px w-full bg-white/10" aria-hidden="true" />
                <div class="flex items-center justify-between gap-6">
                  <p class="max-w-xs text-[11.5px] leading-relaxed text-white/45">
                    “เลิกเดาจากความรู้สึก เริ่มดูจากตัวเลขที่เกิดขึ้นจริง”
                  </p>
                  <p class="text-[10.5px] font-medium uppercase tracking-[0.18em] text-white/40">
                    Business, clearly.
                  </p>
                </div>
              </div>
            </div>

            <!-- Live workspace preview -->
            <div class="rounded-[28px] bg-white p-4 text-ink sm:p-5 2xl:p-6 3xl:rounded-[32px] 3xl:p-7">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex min-w-0 items-center gap-2">
                  <BrandLogo :mark-size="24" compact />
                  <span class="truncate text-[12.5px] font-semibold text-ink">
                    Workspace
                    <span class="font-medium text-muted">— บลูมมิ่ง คอฟฟี่</span>
                  </span>
                </div>
                <span class="rounded-full bg-black px-2.5 py-0.5 text-[11px] font-semibold text-white">
                  Live Preview
                </span>
              </div>

              <div class="mt-4 grid grid-cols-2 gap-2.5 3xl:mt-5 3xl:gap-3.5">
                <div v-for="kpi in previewKpis" :key="kpi.label" class="rounded-2xl bg-surface p-3.5 3xl:rounded-[20px] 3xl:p-5">
                  <p class="text-[11px] leading-tight text-muted">{{ kpi.label }}</p>
                  <p class="tabular mt-1.5 text-[clamp(19px,1.35vw,26px)] font-bold leading-tight tracking-[-0.02em] text-ink">
                    {{ kpi.value }}
                  </p>
                  <span class="mt-1 inline-flex items-center gap-0.5 text-[11px] font-semibold text-ink">
                    <ArrowUpRight class="h-3 w-3" aria-hidden="true" />
                    {{ kpi.change }}
                  </span>
                </div>
              </div>

              <div class="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-black p-3.5 text-white 3xl:mt-4 3xl:p-4">
                <div class="flex min-w-0 items-center gap-2.5">
                  <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 3xl:h-9 3xl:w-9">
                    <Sparkles class="h-4 w-4 text-white" aria-hidden="true" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-[12px] font-semibold leading-snug text-white">
                      AI ตรวจพบ: ต้นทุนบรรจุภัณฑ์กำลังกัดกำไร 6.2%
                    </p>
                    <p class="text-[11px] leading-snug text-white/50">
                      เจรจาลดราคาแพ็กเกจจิ้ง 5% กำไรสุทธิจะเพิ่ม +฿118,734
                    </p>
                  </div>
                </div>
                <Link
                  to="/signup"
                  class="hidden shrink-0 text-[12px] font-semibold text-white underline underline-offset-4 transition-colors hover:text-white/70 sm:inline-flex"
                >
                  ลองใช้จริง
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 4 Core Pillars -->
      <section id="features" class="relative">
        <div class="mx-auto max-w-7xl px-4 sm:px-5 2xl:max-w-[1560px] 3xl:max-w-[1680px]">
          <div class="mx-auto hidden max-w-2xl pb-11 pt-16 text-center sm:pt-20 lg:block 2xl:max-w-3xl 3xl:pb-14 3xl:pt-24">
            <h2 class="text-balance text-[clamp(1.9rem,2.8vw,2.75rem)] font-semibold tracking-[-0.03em] text-ink">
              พื้นที่ทำงาน AI สำหรับการตัดสินใจธุรกิจ
            </h2>
            <p class="mt-3 text-sm leading-relaxed text-muted">
              ไม่ใช่แค่แชตบอตทั่วไป แต่คือโครงสร้าง AI Workspace ที่ออกแบบมาเพื่อแก้ไข Pain Point ของ SME ไทยโดยเฉพาะ
            </p>
          </div>
        </div>

        <div ref="carouselTrack" class="relative h-[360vh] w-full">
            <div
              ref="stickyCard"
              class="pillar-sticky sticky top-0 flex h-dvh w-full flex-col items-center justify-center gap-5 px-4 sm:px-5 lg:gap-0"
              role="region"
              aria-roledescription="carousel"
              aria-label="4 เสาหลักของ ROOKAR"
            >
              <div class="w-full max-w-2xl text-center lg:hidden">
                <h2 class="text-balance text-[clamp(1.35rem,5vw,1.75rem)] font-semibold tracking-[-0.03em] text-ink">
                  พื้นที่ทำงาน AI สำหรับการตัดสินใจธุรกิจ
                </h2>
                <p class="mx-auto mt-2 max-w-md text-[12.5px] leading-relaxed text-muted">
                  ไม่ใช่แค่แชตบอตทั่วไป แต่คือโครงสร้าง AI Workspace ที่ออกแบบมาเพื่อแก้ไข Pain Point ของ SME ไทยโดยเฉพาะ
                </p>
              </div>
              <div class="pillar-stage mx-auto max-w-7xl 2xl:max-w-[1560px] 3xl:max-w-[1680px]">
                <article
                  v-for="(pillar, index) in pillars"
                  :key="pillar.title"
                  class="pillar-slide pillar-card group p-6 sm:p-10 lg:p-14 2xl:p-16 3xl:p-20"
                  :class="{ 'is-active': index === activeIndex }"
                  :style="slideStyle(index)"
                role="group"
                aria-roledescription="slide"
                :aria-label="`${index + 1} จาก ${pillars.length}: ${pillar.title}`"
                :aria-hidden="index !== activeIndex"
                :inert="index !== activeIndex"
                @pointermove="setSpotlight"
                @pointerleave="clearSpotlight"
              >
                <div class="pillar-orb" aria-hidden="true" />

                <div class="pillar-content relative z-10 grid w-full gap-4 sm:gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14 2xl:gap-20">
                  <div>
                    <h3
                      class="text-[clamp(1.75rem,4.4vw,5rem)] font-semibold tracking-[-0.04em] text-white"
                    >
                      {{ pillar.title }}
                    </h3>
                    <p class="mt-3 max-w-xl text-[14px] leading-relaxed text-white/60 sm:mt-4 sm:text-[15px]">
                      {{ pillar.body }}
                    </p>
                    <div class="mt-4 flex flex-wrap gap-1.5 sm:mt-8 sm:gap-2">
                      <span
                        v-for="tag in pillar.tags"
                        :key="tag"
                        class="rounded-full bg-white/[0.06] px-3 py-1.5 text-[10.5px] font-medium text-white/45 transition-colors duration-300 group-hover:bg-white/[0.1] group-hover:text-white/70 sm:px-4 sm:py-2 sm:text-[11.5px]"
                      >
                        {{ tag }}
                      </span>
                    </div>
                  </div>

                  <div class="pillar-visual relative w-full">
                    <div class="relative z-10 w-full">
                      <template v-if="pillar.visual === 'memory'">
                        <div class="grid grid-cols-2 gap-2 sm:gap-2.5">
                          <KpiCard
                            v-for="kpi in landingKpis"
                            :key="kpi.label"
                            :label="kpi.label"
                            :value="kpi.value"
                            :change="kpi.change"
                            :tone="kpi.tone"
                            :spark="kpi.spark"
                            :spark-color="kpi.sparkColor"
                            :info="kpi.info"
                          />
                        </div>
                      </template>

                      <template v-else-if="pillar.visual === 'agents'">
                        <div class="card-fade-static p-3.5">
                          <div class="relative z-10">
                            <div class="flex items-center justify-between gap-2">
                              <span class="inline-flex items-center gap-1.5 rounded-full bg-black px-2.5 py-1 text-[9.5px] font-semibold text-white">
                                <span class="flex h-3.5 w-3.5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20">
                                  <img src="/ai-avatar.png" alt="AI" class="h-full w-full object-cover" />
                                </span>
                                AI วิเคราะห์
                              </span>
                              <span class="text-[9.5px] font-medium text-muted">อ้างอิง 1,284 แถว</span>
                            </div>
                            <h4 class="mt-2.5 text-[14px] font-bold leading-snug tracking-tight text-ink">
                              ต้นทุนบรรจุภัณฑ์กำลังกัดกำไร 6.2%
                            </h4>
                            <p class="mt-1.5 text-[11px] leading-relaxed text-muted">
                              เจรจาลดราคาแพ็กเกจจิ้ง 5% จะช่วยเพิ่มกำไรสุทธิ +฿118,734 จากข้อมูล 6 เดือนล่าสุด
                            </p>
                            <div class="mt-2.5 inline-flex h-8 items-center gap-1.5 rounded-full bg-ink px-3 text-[10.5px] font-semibold text-white">
                              ดูแนวทางปรับราคา
                              <ArrowRight class="h-3 w-3" aria-hidden="true" />
                            </div>
                            <div class="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-white/80 p-2.5">
                              <div>
                                <p class="text-[9px] font-semibold text-muted">รายได้</p>
                                <p class="mt-0.5 text-[11px] font-bold text-ink">+12.4%</p>
                              </div>
                              <div>
                                <p class="text-[9px] font-semibold text-muted">กำไร</p>
                                <p class="mt-0.5 text-[11px] font-bold text-ink">+8.1%</p>
                              </div>
                              <div>
                                <p class="text-[9px] font-semibold text-muted">ต้นทุน</p>
                                <p class="mt-0.5 text-[11px] font-bold text-rose-700">+3.2%</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="mt-2.5 grid grid-cols-2 gap-2">
                          <div
                            v-for="agent in ['Finance', 'Market', 'Strategy', 'Planning']"
                            :key="agent"
                            class="rounded-xl bg-surface px-2.5 py-2 text-[10px] font-medium text-ink"
                          >
                            <span class="block text-[8px] uppercase tracking-[0.12em] text-muted">Specialist</span>
                            {{ agent }}
                          </div>
                        </div>
                      </template>

                      <template v-else-if="pillar.visual === 'sources'">
                        <div class="card-fade-static p-3.5">
                          <div class="relative z-10">
                            <div class="flex items-center justify-between gap-2">
                              <h4 class="text-[13px] font-bold text-ink">เทียบกับเศรษฐกิจไทย</h4>
                              <span class="text-[9px] font-medium text-muted">IMF · World Bank · NSO</span>
                            </div>
                            <div class="mt-2.5 grid grid-cols-3 gap-2">
                              <div class="rounded-xl bg-white/80 p-2.5">
                                <p class="text-[9px] text-muted">GDP ประเทศไทย</p>
                                <p class="tabular mt-0.5 text-[16px] font-bold text-ink">2.8%</p>
                                <p class="mt-0.5 text-[9px] text-muted">ปี 2569</p>
                              </div>
                              <div class="rounded-xl bg-white/80 p-2.5">
                                <p class="text-[9px] text-muted">เงินเฟ้อ (CPI)</p>
                                <p class="tabular mt-0.5 text-[16px] font-bold text-ink">0.5%</p>
                                <p class="mt-0.5 text-[9px] text-muted">ปี 2569</p>
                              </div>
                              <div class="rounded-xl bg-white/80 p-2.5">
                                <p class="text-[9px] text-muted">อัตราว่างงาน</p>
                                <p class="tabular mt-0.5 text-[16px] font-bold text-ink">0.9%</p>
                                <p class="mt-0.5 text-[9px] text-muted">Q1/2569</p>
                              </div>
                            </div>
                            <div class="mt-2.5 flex items-center gap-1.5 text-[9.5px] text-muted">
                              <CheckCircle2 class="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                              ตรวจสอบจากแหล่งทางการแล้ว
                            </div>
                            <div class="mt-2 flex flex-wrap gap-1.5">
                              <span
                                v-for="source in ['IMF', 'World Bank', 'NSO']"
                                :key="source"
                                class="rounded-full bg-white/80 px-2.5 py-1 text-[9.5px] font-medium text-ink-soft"
                              >
                                {{ source }}
                              </span>
                            </div>
                          </div>
                        </div>
                      </template>

                      <template v-else>
                        <div class="card-fade-static p-3">
                          <div class="relative z-10">
                            <div class="flex items-center justify-between gap-2">
                              <h4 class="text-[13px] font-bold text-ink">รายได้และกำไร</h4>
                              <span class="text-[9px] font-medium text-muted">6 เดือนล่าสุด</span>
                            </div>
                            <div class="mt-1">
                              <RevenueChart :series="previewSeries" />
                            </div>
                            <div class="mt-2 flex flex-wrap gap-1.5">
                              <span
                                v-for="output in ['ตาราง', 'What-If', 'Action Plan']"
                                :key="output"
                                class="rounded-full bg-surface px-2.5 py-1 text-[9.5px] font-medium text-ink-soft"
                              >
                                {{ output }}
                              </span>
                            </div>
                          </div>
                        </div>
                      </template>
                    </div>
                  </div>
                </div>
                </article>
              </div>

            </div>
          </div>
      </section>

      <!-- How it works -->
      <section id="how-it-works" class="px-4 sm:px-5">
        <div class="mx-auto max-w-7xl rounded-[32px] bg-surface px-5 py-14 sm:px-10 sm:py-16 lg:px-14 2xl:max-w-[1560px] 2xl:px-16 2xl:py-20 3xl:max-w-[1680px] 3xl:rounded-[40px] 3xl:px-20 3xl:py-24">
          <div class="mx-auto max-w-2xl text-center 2xl:max-w-3xl">
            <h2 class="text-balance text-[clamp(1.9rem,2.8vw,2.75rem)] font-semibold tracking-[-0.03em] text-ink">
              เริ่มใช้งานใน 3 ขั้นตอน
            </h2>
          </div>

          <div class="mt-11 grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:gap-5 3xl:mt-14">
            <article
              v-for="(step, index) in steps"
              :key="step.title"
              class="rounded-[24px] bg-white p-7 text-center 2xl:p-9 3xl:p-10"
            >
              <span
                class="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black text-[13px] font-bold text-white 2xl:h-12 2xl:w-12"
              >
                {{ index + 1 }}
              </span>
              <h3 class="text-[17px] font-semibold text-ink">{{ step.title }}</h3>
              <p class="mt-2 text-[13.5px] leading-relaxed text-muted">{{ step.body }}</p>
            </article>
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section id="faq" class="px-4 py-16 sm:px-5 sm:py-20 3xl:py-24">
        <div class="mx-auto max-w-3xl 2xl:max-w-4xl 3xl:max-w-[960px]">
          <div class="text-center">
            <h2 class="text-[clamp(1.9rem,2.8vw,2.75rem)] font-semibold tracking-[-0.03em] text-ink">
              คำถามที่พบบ่อย (FAQ)
            </h2>
            <p class="mt-2 text-sm text-muted">ทุกข้อสงสัยเกี่ยวกับการใช้งานและช่วง Closed Trial</p>
          </div>

          <div class="mt-10 space-y-3">
            <div
              v-for="(faq, idx) in faqs"
              :key="idx"
              class="card-fade-static cursor-pointer p-5 sm:p-6 2xl:p-7 3xl:p-8"
              @click="toggleFaq(idx)"
            >
              <div class="flex items-center justify-between gap-4">
                <h3 class="text-[15px] font-semibold text-ink">{{ faq.q }}</h3>
                <ChevronDown
                  class="h-4 w-4 shrink-0 text-faint transition-transform duration-200"
                  :class="activeFaq === idx ? 'rotate-180' : ''"
                  aria-hidden="true"
                />
              </div>
              <div v-if="activeFaq === idx" class="mt-3">
                <span class="block h-px w-full bg-black/5" aria-hidden="true" />
                <p class="pt-3 text-[13.5px] leading-relaxed text-muted">
                  {{ faq.a }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Bottom CTA -->
      <section class="px-4 pb-4 sm:px-5">
        <div class="relative mx-auto flex min-h-[calc(80dvh+1rem)] max-w-7xl flex-col justify-center overflow-hidden rounded-[32px] bg-brand-950 px-6 py-14 text-center text-white sm:px-10 sm:py-16 2xl:max-w-[1560px] 2xl:px-16 2xl:py-20 3xl:max-w-[1680px] 3xl:rounded-[40px] 3xl:px-20 3xl:py-24">
          <div class="bg-waves absolute inset-0 scale-110 opacity-30 mix-blend-screen" aria-hidden="true" />
          <div
            class="absolute inset-0 bg-gradient-to-br from-brand-950/95 via-brand-950/85 to-brand-800/60"
            aria-hidden="true"
          />
          <div class="relative mx-auto w-full max-w-2xl shrink-0 2xl:max-w-3xl">
            <div class="flex justify-center">
              <BrandLogo variant="light" :mark-size="34" />
            </div>
            <h2 class="mt-7 text-balance text-[clamp(1.9rem,3vw,3rem)] font-semibold tracking-[-0.03em]">
              พร้อมเห็นตัวเลขธุรกิจของคุณชัดเจนขึ้นแล้วหรือยัง?
            </h2>
            <p class="mx-auto mt-4 max-w-xl text-[14px] leading-relaxed text-white/65 2xl:max-w-2xl">
              สมัครเข้าร่วม Closed Trial วันนี้ เพื่อรับสิทธิ์ใช้งาน ROOKAR ฟรีตลอดช่วงทดสอบ
            </p>
            <div class="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link
                to="/signup"
                class="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-[14px] font-semibold text-brand-950 transition-colors hover:bg-brand-100 2xl:h-14 2xl:px-9"
              >
                เริ่มต้นใช้งานฟรีทันที
                <ArrowRight class="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <p class="mt-8 text-[10.5px] font-medium uppercase tracking-[0.18em] text-white/35">
              Business, clearly.
            </p>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="px-4 py-10 sm:px-5 3xl:py-12">
      <div
        class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 text-[13px] text-muted sm:flex-row 2xl:max-w-[1560px] 3xl:max-w-[1680px]"
      >
        <div class="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
          <BrandLogo :mark-size="24" />
          <span class="text-faint">© 2569 ROOKAR · เวอร์ชันทดลอง</span>
        </div>
        <div class="flex items-center gap-6">
          <Link to="/login" class="transition hover:text-ink">เข้าสู่ระบบ</Link>
          <a href="mailto:hello@rookar.co" class="transition hover:text-ink">ติดต่อทีมงาน</a>
        </div>
      </div>
    </footer>
  </div>
</template>
