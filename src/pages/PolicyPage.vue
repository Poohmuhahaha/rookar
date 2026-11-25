<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Link } from '@tanstack/vue-router'
import {
  CreditCard,
  Home,
  LogIn,
  Mail,
  Scale,
  Search,
  ShieldCheck,
  UserPlus,
} from '@lucide/vue'
import BrandLogo from '@/components/brand/BrandLogo.vue'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher.vue'
import { t, type MessageKey } from '@/lib/i18n'

const tocGroups = computed(() => [
  {
    id: 'terms',
    label: t('policyPage.termsTitle'),
    children: [
      { id: 'terms-acceptance', label: t('policyPage.terms1Title') },
      { id: 'terms-accounts', label: t('policyPage.terms2Title') },
      { id: 'terms-use', label: t('policyPage.terms3Title') },
      { id: 'terms-ip', label: t('policyPage.terms4Title') },
      { id: 'terms-liability', label: t('policyPage.terms5Title') },
      { id: 'terms-changes', label: t('policyPage.terms6Title') },
    ],
  },
  {
    id: 'privacy',
    label: t('policyPage.privacyTitle'),
    children: [
      { id: 'privacy-collect', label: t('policyPage.privacy1Title') },
      { id: 'privacy-purpose', label: t('policyPage.privacy2Title') },
      { id: 'privacy-disclosure', label: t('policyPage.privacy3Title') },
      { id: 'privacy-security', label: t('policyPage.privacy4Title') },
      { id: 'privacy-rights', label: t('policyPage.privacy5Title') },
      { id: 'privacy-contact', label: t('policyPage.privacy6Title') },
    ],
  },
])

const flatToc = computed(() =>
  tocGroups.value.flatMap((group) => [
    { id: group.id, label: group.label },
    ...group.children,
  ]),
)

type SectionGroup = {
  id: string
  titleKey: MessageKey
  introKey: MessageKey
  items: { id: string; titleKey: MessageKey; bodyKey: MessageKey }[]
}

const sections: SectionGroup[] = [
  {
    id: 'terms',
    titleKey: 'policyPage.termsTitle',
    introKey: 'policyPage.termsIntro',
    items: [
      { id: 'terms-acceptance', titleKey: 'policyPage.terms1Title', bodyKey: 'policyPage.terms1Body' },
      { id: 'terms-accounts', titleKey: 'policyPage.terms2Title', bodyKey: 'policyPage.terms2Body' },
      { id: 'terms-use', titleKey: 'policyPage.terms3Title', bodyKey: 'policyPage.terms3Body' },
      { id: 'terms-ip', titleKey: 'policyPage.terms4Title', bodyKey: 'policyPage.terms4Body' },
      { id: 'terms-liability', titleKey: 'policyPage.terms5Title', bodyKey: 'policyPage.terms5Body' },
      { id: 'terms-changes', titleKey: 'policyPage.terms6Title', bodyKey: 'policyPage.terms6Body' },
    ],
  },
  {
    id: 'privacy',
    titleKey: 'policyPage.privacyTitle',
    introKey: 'policyPage.privacyIntro',
    items: [
      { id: 'privacy-collect', titleKey: 'policyPage.privacy1Title', bodyKey: 'policyPage.privacy1Body' },
      { id: 'privacy-purpose', titleKey: 'policyPage.privacy2Title', bodyKey: 'policyPage.privacy2Body' },
      { id: 'privacy-disclosure', titleKey: 'policyPage.privacy3Title', bodyKey: 'policyPage.privacy3Body' },
      { id: 'privacy-security', titleKey: 'policyPage.privacy4Title', bodyKey: 'policyPage.privacy4Body' },
      { id: 'privacy-rights', titleKey: 'policyPage.privacy5Title', bodyKey: 'policyPage.privacy5Body' },
      { id: 'privacy-contact', titleKey: 'policyPage.privacy6Title', bodyKey: 'policyPage.privacy6Body' },
    ],
  },
]

const query = ref('')
const activeId = ref('terms')
const searchInput = ref<HTMLInputElement | null>(null)

const activeGroup = computed(() => (activeId.value.startsWith('privacy') ? 'privacy' : 'terms'))

function isGroupActive(groupId: string) {
  return activeId.value === groupId || activeId.value.startsWith(`${groupId}-`)
}

const filteredGroups = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  if (!keyword) return tocGroups.value
  return tocGroups.value
    .map((group) => ({
      ...group,
      children: group.children.filter((item) => item.label.toLowerCase().includes(keyword)),
    }))
    .filter((group) => group.label.toLowerCase().includes(keyword) || group.children.length > 0)
})

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  activeId.value = id
}

function jumpToFirstMatch() {
  const keyword = query.value.trim().toLowerCase()
  if (!keyword) return
  const match = flatToc.value.find((item) => item.label.toLowerCase().includes(keyword))
  if (match) scrollToId(match.id)
}

function handleShortcut(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    searchInput.value?.focus()
  }
}

let observer: IntersectionObserver | null = null

onMounted(() => {
  const hash = window.location.hash.slice(1)
  if (hash) {
    requestAnimationFrame(() => scrollToId(hash))
  }

  const headings = Array.from(document.querySelectorAll<HTMLElement>('[data-toc]'))
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (visible[0]) activeId.value = visible[0].target.id
    },
    { rootMargin: '-120px 0px -65% 0px', threshold: 0 },
  )
  headings.forEach((heading) => observer?.observe(heading))

  window.addEventListener('keydown', handleShortcut)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  window.removeEventListener('keydown', handleShortcut)
})
</script>

<template>
  <div class="min-h-dvh bg-canvas">
    <header class="sticky top-0 z-40 border-b border-ink-100/70 bg-white/95 backdrop-blur">
      <div class="px-4 sm:px-5">
        <div class="mx-auto flex max-w-7xl items-center gap-3 py-4 2xl:max-w-[1560px] 3xl:max-w-[1680px] 3xl:py-5">
          <Link to="/" class="flex shrink-0 items-center gap-2.5">
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
            class="inline-flex h-7 shrink-0 items-center rounded-full px-2.5 text-[12.5px] font-medium text-muted transition hover:bg-surface hover:text-ink"
          >
            Docs
          </Link>
          <a
            href="#terms"
            :class="[
              'inline-flex h-7 shrink-0 items-center rounded-full px-2.5 text-[12.5px] font-medium transition',
              activeGroup === 'terms'
                ? 'bg-surface text-ink'
                : 'text-muted hover:bg-surface hover:text-ink',
            ]"
          >
            {{ t('policyPage.termsTitle') }}
          </a>
          <a
            href="#privacy"
            :class="[
              'inline-flex h-7 shrink-0 items-center rounded-full px-2.5 text-[12.5px] font-medium transition',
              activeGroup === 'privacy'
                ? 'bg-surface text-ink'
                : 'text-muted hover:bg-surface hover:text-ink',
            ]"
          >
            {{ t('policyPage.privacyTitle') }}
          </a>
          <Link
            to="/pricing"
            class="inline-flex h-7 shrink-0 items-center rounded-full px-2.5 text-[12.5px] font-medium text-muted transition hover:bg-surface hover:text-ink"
          >
            {{ t('policyPage.navPricing') }}
          </Link>
          <a
            href="mailto:support@rookar.co"
            class="inline-flex h-7 shrink-0 items-center rounded-full px-2.5 text-[12.5px] font-medium text-muted transition hover:bg-surface hover:text-ink"
          >
            {{ t('policyPage.navHelp') }}
          </a>
          <span class="ml-auto hidden shrink-0 text-[11px] text-faint lg:block">
            {{ t('policyPage.updatedAt') }}
          </span>
          </div>
        </div>
      </div>
    </header>

    <main class="px-4 sm:px-5">
      <div class="mx-auto max-w-7xl py-8 2xl:max-w-[1560px] 3xl:max-w-[1680px]">
        <div class="grid gap-10 lg:grid-cols-[210px_minmax(0,1fr)_230px] xl:grid-cols-[230px_minmax(0,1fr)_250px]">
        <aside class="hidden lg:block">
          <nav class="no-scrollbar sticky top-[128px] max-h-[calc(100dvh-8rem)] overflow-y-auto pr-2">
            <div class="space-y-0.5">
              <Link
                to="/"
                class="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] text-muted transition hover:bg-surface hover:text-ink"
              >
                <Home class="h-3.5 w-3.5 text-faint" aria-hidden="true" />
                {{ t('policyPage.navHome') }}
              </Link>
              <a
                href="#terms"
                :class="[
                  'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] transition',
                  activeGroup === 'terms'
                    ? 'bg-surface font-medium text-ink'
                    : 'text-muted hover:bg-surface hover:text-ink',
                ]"
              >
                <Scale class="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                {{ t('policyPage.termsTitle') }}
              </a>
              <a
                href="#privacy"
                :class="[
                  'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] transition',
                  activeGroup === 'privacy'
                    ? 'bg-surface font-medium text-ink'
                    : 'text-muted hover:bg-surface hover:text-ink',
                ]"
              >
                <ShieldCheck class="h-3.5 w-3.5 text-faint" aria-hidden="true" />
                {{ t('policyPage.privacyTitle') }}
              </a>
              <Link
                to="/pricing"
                class="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] text-muted transition hover:bg-surface hover:text-ink"
              >
                <CreditCard class="h-3.5 w-3.5 text-faint" aria-hidden="true" />
                {{ t('policyPage.navPricing') }}
              </Link>
              <Link
                to="/login"
                class="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] text-muted transition hover:bg-surface hover:text-ink"
              >
                <LogIn class="h-3.5 w-3.5 text-faint" aria-hidden="true" />
                {{ t('policyPage.login') }}
              </Link>
              <Link
                to="/signup"
                class="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] text-muted transition hover:bg-surface hover:text-ink"
              >
                <UserPlus class="h-3.5 w-3.5 text-faint" aria-hidden="true" />
                {{ t('policyPage.signup') }}
              </Link>
              <a
                href="mailto:support@rookar.co"
                class="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] text-muted transition hover:bg-surface hover:text-ink"
              >
                <Mail class="h-3.5 w-3.5 text-faint" aria-hidden="true" />
                {{ t('policyPage.contactTeam') }}
              </a>
            </div>
          </nav>
        </aside>

        <div class="min-w-0 max-w-[1000px]">
          <p class="flex flex-wrap items-center gap-1.5 text-[11.5px] text-faint">
            <Link to="/" class="transition hover:text-ink">{{ t('policyPage.navHome') }}</Link>
            <span aria-hidden="true">/</span>
            <span>{{ t('policyPage.breadcrumbLegal') }}</span>
            <span aria-hidden="true">/</span>
            <span class="text-muted">{{ t('policyPage.breadcrumbCurrent') }}</span>
          </p>

          <h1 class="mt-4 text-[30px] font-semibold leading-tight tracking-[-0.03em] text-ink sm:text-[34px]">
            {{ t('policyPage.title') }}
          </h1>
          <p class="mt-2 text-[13px] text-muted">{{ t('policyPage.updatedAt') }}</p>

          <nav class="mt-5 flex flex-wrap gap-2 lg:hidden" :aria-label="t('policyPage.tocLabel')">
            <a
              href="#terms"
              class="inline-flex h-8 items-center rounded-full bg-surface px-3.5 text-[12px] font-medium text-ink-soft transition hover:bg-neutral-200"
            >
              {{ t('policyPage.termsTitle') }}
            </a>
            <a
              href="#privacy"
              class="inline-flex h-8 items-center rounded-full bg-surface px-3.5 text-[12px] font-medium text-ink-soft transition hover:bg-neutral-200"
            >
              {{ t('policyPage.privacyTitle') }}
            </a>
          </nav>

          <template v-for="group in sections" :key="group.id">
            <hr v-if="group.id !== 'terms'" class="mt-12 border-ink-100" />
            <section
              :id="group.id"
              data-toc
              :class="group.id === 'terms' ? 'mt-10 scroll-mt-32' : 'mt-12 scroll-mt-32'"
            >
              <h2 class="text-[22px] font-semibold tracking-[-0.02em] text-ink">{{ t(group.titleKey) }}</h2>
              <p class="mt-3 text-[14px] leading-relaxed text-ink-soft">{{ t(group.introKey) }}</p>
              <div class="mt-8 space-y-8">
                <div v-for="item in group.items" :id="item.id" :key="item.id" data-toc class="scroll-mt-32">
                  <h3 class="text-[15px] font-semibold text-ink">{{ t(item.titleKey) }}</h3>
                  <p class="mt-1.5 text-[14px] leading-relaxed text-ink-soft">
                    {{ t(item.bodyKey) }}
                    <a
                      v-if="item.id === 'privacy-contact'"
                      href="mailto:privacy@rookar.co"
                      class="font-medium text-brand-700 underline-offset-4 transition hover:text-brand-900 hover:underline"
                    >
                      privacy@rookar.co
                    </a>
                  </p>
                </div>
              </div>
            </section>
          </template>
        </div>

        <aside class="hidden lg:block">
          <div class="no-scrollbar sticky top-[128px] max-h-[calc(100dvh-8rem)] overflow-y-auto pr-2">
            <p class="text-[11px] font-semibold text-ink">{{ t('policyPage.onThisPage') }}</p>
            <nav class="mt-3 space-y-4 border-l border-ink-100 pl-3" :aria-label="t('policyPage.tocLabel')">
              <div v-for="group in filteredGroups" :key="group.id">
                <a
                  href="#"
                  :class="[
                    'block text-[12px] transition',
                    isGroupActive(group.id) ? 'font-semibold text-ink' : 'font-medium text-muted hover:text-ink',
                  ]"
                  @click.prevent="scrollToId(group.id)"
                >
                  {{ group.label }}
                </a>
                <div v-if="group.children.length" class="mt-1.5 space-y-1">
                  <a
                    v-for="item in group.children"
                    :key="item.id"
                    href="#"
                    :class="[
                      'block text-[11.5px] leading-snug transition',
                      activeId === item.id ? 'font-medium text-ink' : 'text-muted hover:text-ink',
                    ]"
                    @click.prevent="scrollToId(item.id)"
                  >
                    {{ item.label }}
                  </a>
                </div>
              </div>
              <p v-if="!filteredGroups.length" class="text-[11.5px] leading-relaxed text-muted">
                {{ t('policyPage.noResults') }}
              </p>
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
