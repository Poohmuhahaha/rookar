<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Link } from '@tanstack/vue-router'
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  ChevronDown,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
} from '@lucide/vue'
import BrandLogo from '@/components/brand/BrandLogo.vue'
import { getSession } from '@/lib/mockApi'

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
    a: 'ไม่มีค่าใช้จ่ายใดๆ ทั้งสิ้นครับ ผู้ประกอบการที่ได้รับคัดเลือกเข้าร่วม Closed Trial จะได้ใช้งานฟีเจอร์ระดับ Pro ครบทุกมิติฟรีโดยไม่มีข้อผูกมัด',
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
const activeIndex = ref(0)
const previousIndex = ref<number | null>(null)
const scrollProgress = ref(0)

let scrollRaf = 0
let underTimer: ReturnType<typeof setTimeout> | undefined

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
  const progress = Math.min(1, Math.max(0, raw))
  scrollProgress.value = progress

  const nextIndex = Math.min(pillars.length - 1, Math.floor(progress * pillars.length))
  if (nextIndex !== activeIndex.value) {
    previousIndex.value = activeIndex.value
    activeIndex.value = nextIndex
    if (underTimer) clearTimeout(underTimer)
    underTimer = setTimeout(() => {
      previousIndex.value = null
    }, 1250)
  }
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
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleScroll)
  if (scrollRaf) window.cancelAnimationFrame(scrollRaf)
  if (underTimer) clearTimeout(underTimer)
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
</script>

<template>
  <div class="min-h-dvh bg-canvas text-ink selection:bg-brand-100 selection:text-brand-900">
    <!-- Navigation Bar -->
    <header class="sticky top-0 z-50 bg-transparent">
      <div class="px-4 sm:px-5">
        <div class="mx-auto flex max-w-7xl items-center justify-between py-4 2xl:max-w-[1560px] 3xl:max-w-[1680px] 3xl:py-5">
          <Link to="/" aria-label="ROOKAR" class="shrink-0">
            <BrandLogo :mark-size="34" />
          </Link>

          <nav class="hidden items-center gap-7 text-[14px] font-medium text-muted md:flex 3xl:gap-8">
            <a href="#features" class="transition hover:text-ink">ฟีเจอร์เด่น</a>
            <a href="#how-it-works" class="transition hover:text-ink">ขั้นตอนการทำงาน</a>
            <Link to="/pricing" class="transition hover:text-ink">ตารางราคา</Link>
            <a href="#faq" class="transition hover:text-ink">คำถามพบบ่อย</a>
            <Link to="/docs" class="transition hover:text-ink">Docs</Link>
          </nav>

          <div class="flex items-center gap-2 sm:gap-3">
            <template v-if="session">
              <Link
                to="/app"
                class="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-black px-4 text-[14px] font-semibold text-white transition-colors hover:bg-neutral-800 3xl:h-12 3xl:px-5"
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
              <Link
                to="/signup"
                class="inline-flex h-10 items-center justify-center rounded-full bg-black px-4 text-[14px] font-semibold text-white transition-colors hover:bg-neutral-800 3xl:h-12 3xl:px-5"
              >
                เริ่มทดลองฟรี
              </Link>
            </template>
          </div>
        </div>
      </div>
    </header>

    <main>
      <!-- Hero -->
      <section class="px-4 pb-4 sm:px-5">
        <div class="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-brand-950 text-white 2xl:max-w-[1560px] 3xl:max-w-[1680px] 3xl:rounded-[40px]">
          <div class="bg-waves absolute inset-0 scale-110 opacity-35 mix-blend-screen" aria-hidden="true" />
          <div
            class="absolute inset-0 bg-gradient-to-br from-brand-950/95 via-brand-950/80 to-brand-800/60"
            aria-hidden="true"
          />
          <div
            class="absolute -right-24 top-10 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl"
            aria-hidden="true"
          />

          <div class="relative grid gap-12 p-6 sm:p-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:p-14 2xl:gap-16 2xl:p-16 3xl:p-20">
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
                    ROOKAR Workspace
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
          <div class="mx-auto max-w-2xl pb-11 pt-16 text-center sm:pt-20 2xl:max-w-3xl 3xl:pb-14 3xl:pt-24">
            <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-faint">4 เสาหลักของ ROOKAR</p>
            <h2 class="mt-3 text-balance text-[clamp(1.9rem,2.8vw,2.75rem)] font-semibold tracking-[-0.03em] text-ink">
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
              class="sticky top-0 h-dvh w-full"
              role="region"
              aria-roledescription="carousel"
              aria-label="4 เสาหลักของ ROOKAR"
            >
              <div class="pillar-stage">
                <article
                  v-for="(pillar, index) in pillars"
                  :key="pillar.title"
                  class="pillar-slide pillar-card group px-7 pb-6 pt-20 sm:px-10 sm:pb-8 sm:pt-28 lg:px-24 lg:pb-14 lg:pt-32 2xl:px-40"
                  :class="{
                    'is-active': index === activeIndex,
                    'is-under': index === previousIndex,
                    'is-above': index !== activeIndex && index !== previousIndex && index < activeIndex,
                    'is-below': index !== activeIndex && index !== previousIndex && index > activeIndex,
                  }"
                role="group"
                aria-roledescription="slide"
                :aria-label="`${index + 1} จาก ${pillars.length}: ${pillar.title}`"
                :aria-hidden="index !== activeIndex"
                :inert="index !== activeIndex"
                @pointermove="setSpotlight"
                @pointerleave="clearSpotlight"
              >
                <div class="pillar-orb" aria-hidden="true" />

                <div class="relative z-10 grid w-full gap-4 sm:gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14 2xl:gap-20">
                  <div>
                    <div class="flex items-start gap-3">
                      <div
                        class="pillar-icon flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-white/10 text-white transition-all duration-500 group-hover:-rotate-6 group-hover:scale-110 group-hover:bg-white/15 2xl:h-16 2xl:w-16 2xl:rounded-[20px]"
                      >
                        <component :is="pillar.icon" class="h-6 w-6 2xl:h-7 2xl:w-7" aria-hidden="true" />
                      </div>
                      <span
                        class="mt-1 rounded-full bg-white/[0.06] px-3 py-1 text-[10.5px] font-medium uppercase tracking-[0.14em] text-white/45"
                      >
                        Pillar {{ String(index + 1).padStart(2, '0') }}
                      </span>
                    </div>

                    <p class="mt-6 text-[11px] font-medium uppercase tracking-[0.16em] text-accent-400/80 sm:mt-10 lg:mt-14">
                      {{ pillar.kicker }}
                    </p>
                    <h3
                      class="mt-4 text-[clamp(2.2rem,4.4vw,5rem)] font-semibold tracking-[-0.04em] text-white"
                    >
                      {{ pillar.title }}
                    </h3>
                    <p class="mt-4 max-w-xl text-[15px] leading-relaxed text-white/60">
                      {{ pillar.body }}
                    </p>
                    <div class="mt-5 flex flex-wrap gap-2 sm:mt-8">
                      <span
                        v-for="tag in pillar.tags"
                        :key="tag"
                        class="rounded-full bg-white/[0.06] px-4 py-2 text-[11.5px] font-medium text-white/45 transition-colors duration-300 group-hover:bg-white/[0.1] group-hover:text-white/70"
                      >
                        {{ tag }}
                      </span>
                    </div>
                  </div>

                  <div
                    class="relative flex min-h-[170px] items-center justify-center rounded-[24px] bg-white/[0.035] p-4 sm:min-h-[280px] sm:rounded-[28px] sm:p-8 lg:min-h-[420px] lg:p-10 2xl:min-h-[560px]"
                  >
                    <span
                      class="absolute right-4 top-2 text-[clamp(4rem,9vw,11rem)] font-semibold leading-none tracking-[-0.08em] text-white/[0.07] transition-all duration-500 group-hover:-translate-y-1 group-hover:text-white/[0.11] sm:right-7 sm:top-5"
                      aria-hidden="true"
                    >
                      {{ String(index + 1).padStart(2, '0') }}
                    </span>

                    <div class="relative z-10 w-full max-w-[560px]">
                      <div v-if="pillar.visual === 'memory'" class="w-full space-y-3">
                        <div
                          v-for="(item, itemIndex) in [
                            { label: 'Goals', width: '92%' },
                            { label: 'Memory', width: '72%' },
                            { label: 'History', width: '54%' },
                          ]"
                          :key="item.label"
                          class="flex items-center gap-4 transition-transform duration-500 group-hover:translate-x-1"
                          :style="{ transitionDelay: `${itemIndex * 70}ms` }"
                        >
                          <span class="h-2 w-2 shrink-0 rounded-full bg-accent-400/80" />
                          <div class="h-9 flex-1 overflow-hidden rounded-full bg-white/[0.05] sm:h-11">
                            <div
                              class="flex h-full items-center rounded-full bg-white/[0.07] px-4 text-[10.5px] uppercase tracking-[0.14em] text-white/45 transition-all duration-500 group-hover:bg-white/[0.1]"
                              :style="{ width: item.width }"
                            >
                              {{ item.label }}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div v-else-if="pillar.visual === 'agents'" class="grid w-full grid-cols-2 gap-3">
                        <div
                          v-for="(agent, agentIndex) in ['Finance', 'Market', 'Strategy', 'Planning']"
                          :key="agent"
                          class="rounded-2xl bg-white/[0.06] px-3.5 py-3 transition-all duration-500 group-hover:-translate-y-1 group-hover:bg-white/[0.11] sm:px-4 sm:py-4"
                          :style="{ transitionDelay: `${agentIndex * 60}ms` }"
                        >
                          <span class="block text-[9.5px] uppercase tracking-[0.16em] text-white/35">
                            Specialist
                          </span>
                          <span class="mt-1.5 block text-[14px] font-medium text-white/80">{{ agent }}</span>
                        </div>
                      </div>

                      <div
                        v-else-if="pillar.visual === 'sources'"
                        class="w-full rounded-2xl bg-white/[0.05] p-4 sm:p-6"
                      >
                        <div
                          class="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-white/45"
                        >
                          <CheckCircle2 class="h-5 w-5 text-emerald-400" aria-hidden="true" />
                          Verified sources
                        </div>
                        <div class="mt-4 flex flex-wrap gap-2">
                          <span
                            v-for="source in ['IMF', 'World Bank', 'NSO']"
                            :key="source"
                            class="rounded-full bg-white/[0.07] px-3 py-1.5 text-[11px] font-medium text-white/55"
                          >
                            {{ source }}
                          </span>
                        </div>
                        <div class="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                          <div
                            class="h-full w-[78%] rounded-full bg-gradient-to-r from-emerald-400/70 to-accent-400/70 transition-all duration-700 group-hover:w-[92%]"
                          />
                        </div>
                        <p class="mt-3 text-[11px] leading-relaxed text-white/35">
                          Cross-checked across official datasets
                        </p>
                      </div>

                      <div v-else class="w-full">
                        <div class="flex h-44 items-end gap-3">
                          <div
                            v-for="(bar, barIndex) in [64, 96, 78, 132, 112, 152]"
                            :key="barIndex"
                            class="flex-1 origin-bottom rounded-t-md bg-white/[0.09] transition-all duration-500 group-hover:scale-y-105 group-hover:bg-white/[0.16]"
                            :style="{ height: `${bar}px`, transitionDelay: `${barIndex * 40}ms` }"
                          />
                        </div>
                        <div class="mt-4 flex justify-between text-[9.5px] uppercase tracking-[0.16em] text-white/35">
                          <span>Revenue</span>
                          <span>Cost</span>
                          <span>Margin</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                </article>
              </div>

              <div
                class="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-1 bg-white/10"
                aria-hidden="true"
              >
                <div
                  class="h-full bg-accent-400/80"
                  :style="{ width: `${scrollProgress * 100}%` }"
                />
              </div>
            </div>
          </div>
      </section>

      <!-- How it works -->
      <section id="how-it-works" class="px-4 sm:px-5">
        <div class="mx-auto max-w-7xl rounded-[32px] bg-surface px-5 py-14 sm:px-10 sm:py-16 lg:px-14 2xl:max-w-[1560px] 2xl:px-16 2xl:py-20 3xl:max-w-[1680px] 3xl:rounded-[40px] 3xl:px-20 3xl:py-24">
          <div class="mx-auto max-w-2xl text-center 2xl:max-w-3xl">
            <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-faint">ง่ายและรวดเร็ว</p>
            <h2 class="mt-3 text-balance text-[clamp(1.9rem,2.8vw,2.75rem)] font-semibold tracking-[-0.03em] text-ink">
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
        <div class="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-brand-950 px-6 py-14 text-center text-white sm:px-10 sm:py-16 2xl:max-w-[1560px] 2xl:px-16 2xl:py-20 3xl:max-w-[1680px] 3xl:rounded-[40px] 3xl:px-20 3xl:py-24">
          <div class="bg-waves absolute inset-0 scale-110 opacity-30 mix-blend-screen" aria-hidden="true" />
          <div
            class="absolute inset-0 bg-gradient-to-br from-brand-950/95 via-brand-950/85 to-brand-800/60"
            aria-hidden="true"
          />
          <div class="relative mx-auto max-w-2xl 2xl:max-w-3xl">
            <div class="flex justify-center">
              <BrandLogo variant="light" :mark-size="34" />
            </div>
            <h2 class="mt-7 text-balance text-[clamp(1.9rem,3vw,3rem)] font-semibold tracking-[-0.03em]">
              พร้อมเห็นตัวเลขธุรกิจของคุณชัดเจนขึ้นแล้วหรือยัง?
            </h2>
            <p class="mx-auto mt-4 max-w-xl text-[14px] leading-relaxed text-white/65 2xl:max-w-2xl">
              สมัครเข้าร่วม Closed Trial วันนี้ เพื่อรับสิทธิ์ใช้งาน ROOKAR Pro ฟรีตลอดช่วงทดสอบ
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
          <Link to="/pricing" class="transition hover:text-ink">ตารางราคา</Link>
          <Link to="/login" class="transition hover:text-ink">เข้าสู่ระบบ</Link>
          <a href="mailto:hello@rookar.co" class="transition hover:text-ink">ติดต่อทีมงาน</a>
        </div>
      </div>
    </footer>
  </div>
</template>
