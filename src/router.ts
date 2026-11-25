import { h } from 'vue'
import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Outlet,
  redirect,
} from '@tanstack/vue-router'
import { getSession } from '@/lib/mockApi'
import type { Session } from '@/types'
import NotFoundPage from '@/pages/NotFoundPage.vue'
import AppShell from '@/components/layout/AppShell.vue'
import SetupLayout from '@/components/layout/SetupLayout.vue'

const LoginPage = lazyRouteComponent(() => import('@/pages/LoginPage.vue'))
const SignUpPage = lazyRouteComponent(() => import('@/pages/SignUpPage.vue'))
const ForgotPasswordPage = lazyRouteComponent(() => import('@/pages/ForgotPasswordPage.vue'))
const ResetPasswordPage = lazyRouteComponent(() => import('@/pages/ResetPasswordPage.vue'))
const BusinessSetupPage = lazyRouteComponent(() => import('@/pages/BusinessSetupPage.vue'))
const DashboardPage = lazyRouteComponent(() => import('@/pages/DashboardPage.vue'))
const IndustryPage = lazyRouteComponent(() => import('@/pages/IndustryPage.vue'))
const SettingsPage = lazyRouteComponent(() => import('@/pages/SettingsPage.vue'))
const DataSourcesPage = lazyRouteComponent(() => import('@/pages/DataSourcesPage.vue'))
const ImportPage = lazyRouteComponent(() => import('@/pages/ImportPage.vue'))
const AssistantPage = lazyRouteComponent(() => import('@/pages/AssistantPage.vue'))
const DataDetailPage = lazyRouteComponent(() => import('@/pages/DataDetailPage.vue'))
const LandingPage = lazyRouteComponent(() => import('@/pages/LandingPage.vue'))
const PolicyPage = lazyRouteComponent(() => import('@/pages/PolicyPage.vue'))
const DocsPage = lazyRouteComponent(() => import('@/pages/DocsPage.vue'))

function appTarget(session: Session) {
  return session.onboardingComplete ? '/app/assistant' : '/setup'
}

function redirectAuthed() {
  const session = getSession()
  if (session) throw redirect({ to: appTarget(session) })
}

function requireSetupSession() {
  const session = getSession()
  if (!session) throw redirect({ to: '/login' })
}

function requireAppSession() {
  const session = getSession()
  if (!session) throw redirect({ to: '/login' })
  if (!session.onboardingComplete) throw redirect({ to: '/setup' })
}

const rootRoute = createRootRoute({
  component: () => h(Outlet),
  notFoundComponent: NotFoundPage,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
})

const policyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/policy',
  component: PolicyPage,
})

const docsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/docs',
  component: DocsPage,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  beforeLoad: redirectAuthed,
  component: LoginPage,
})

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signup',
  beforeLoad: redirectAuthed,
  component: SignUpPage,
})

const forgotRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot-password',
  beforeLoad: redirectAuthed,
  component: ForgotPasswordPage,
})

const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reset-password',
  validateSearch: (search: Record<string, unknown>): { token?: string } => ({
    token: typeof search.token === 'string' && search.token.trim() ? search.token.trim() : undefined,
  }),
  component: ResetPasswordPage,
})

const setupLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/setup',
  beforeLoad: requireSetupSession,
  component: SetupLayout,
})

const setupRoute = createRoute({
  getParentRoute: () => setupLayoutRoute,
  path: '/',
  component: BusinessSetupPage,
})

const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/app',
  beforeLoad: requireAppSession,
  component: AppShell,
})

const dashboardRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/',
  component: DashboardPage,
})

const industryRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/industry',
  component: IndustryPage,
})

const settingsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings',
  component: SettingsPage,
})

const dataSourcesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/data-sources',
  component: DataSourcesPage,
})

const dataDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/data-sources/$id',
  component: DataDetailPage,
})

const importRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/import',
  component: ImportPage,
})

const assistantRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/assistant',
  validateSearch: (
    search: Record<string, unknown>,
  ): { prompt?: string; chat?: string; context?: string; history?: string } => ({
    prompt:
      typeof search.prompt === 'string' && search.prompt.trim()
        ? search.prompt.trim().slice(0, 500)
        : undefined,
    chat:
      typeof search.chat === 'string' && search.chat.trim()
        ? search.chat.trim().slice(0, 100)
        : undefined,
    context: search.context === '1' ? '1' : undefined,
    history: search.history === '1' ? '1' : undefined,
  }),
  component: AssistantPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  policyRoute,
  docsRoute,
  loginRoute,
  signupRoute,
  forgotRoute,
  resetPasswordRoute,
  setupLayoutRoute.addChildren([setupRoute]),
  appLayoutRoute.addChildren([
    dashboardRoute,
    industryRoute,
    settingsRoute,
    dataSourcesRoute,
    dataDetailRoute,
    importRoute,
    assistantRoute,
  ]),
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
})

declare module '@tanstack/vue-router' {
  interface Register {
    router: typeof router
  }
}
