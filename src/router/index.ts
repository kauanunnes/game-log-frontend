import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { profileTabs, settingsTabs, type Tab } from './tabs'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    requiresAdmin?: boolean
  }
}

type TabView = Pick<RouteRecordRaw, 'component' | 'props'>

const LibraryTab = () => import('@/views/profile/ProfileLibraryTab.vue')
const FollowsTab = () => import('@/views/profile/ProfileFollowsTab.vue')

/** O componente de cada aba do perfil; as abas de jogos mudam só o filtro. */
const profileViews: Record<string, TabView> = {
  profile: { component: () => import('@/views/profile/ProfileOverview.vue') },
  'profile-played': {
    component: LibraryTab,
    props: { statuses: ['PLAYED', 'DROPPED'], variants: true },
  },
  'profile-playing': { component: LibraryTab, props: { statuses: ['PLAYING'] } },
  'profile-backlog': { component: LibraryTab, props: { statuses: ['BACKLOG'] } },
  'profile-wishlist': { component: LibraryTab, props: { statuses: ['WISHLIST'] } },
  'profile-favorites': { component: LibraryTab, props: { favorites: true } },
  'profile-reviews': { component: () => import('@/views/profile/ProfileReviewsTab.vue') },
  'profile-lists': { component: () => import('@/views/profile/ProfileListsTab.vue') },
  'profile-stats': { component: () => import('@/views/profile/ProfileStatsTab.vue') },
}

const settingsViews: Record<string, TabView> = {
  settings: { component: () => import('@/views/settings/SettingsProfileTab.vue') },
  'settings-account': { component: () => import('@/views/settings/SettingsAccountTab.vue') },
  'settings-privacy': { component: () => import('@/views/settings/SettingsPrivacyTab.vue') },
  'settings-data': { component: () => import('@/views/settings/SettingsDataTab.vue') },
}

const tabRoutes = (tabs: Tab[], section: string, views: Record<string, TabView>) =>
  tabs.map(({ path, name, label }) => ({
    path,
    name,
    ...views[name],
    meta: { title: `${section} · ${label}` },
  })) as RouteRecordRaw[]

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: 'Início' },
  },
  {
    path: '/games',
    name: 'explore',
    component: () => import('@/views/ExploreView.vue'),
    meta: { title: 'Explorar' },
  },
  {
    path: '/games/:slug',
    name: 'game',
    component: () => import('@/views/GameView.vue'),
    props: true,
    meta: { title: 'Jogo' },
  },
  {
    path: '/u/:username',
    component: () => import('@/views/ProfileView.vue'),
    props: true,
    children: [
      ...tabRoutes(profileTabs, 'Perfil', profileViews),
      // Fora da faixa de abas: abrem pelos contadores do cabeçalho.
      {
        path: 'followers',
        name: 'profile-followers',
        component: FollowsTab,
        props: { list: 'followers' },
        meta: { title: 'Perfil · Seguidores' },
      },
      {
        path: 'following',
        name: 'profile-following',
        component: FollowsTab,
        props: { list: 'following' },
        meta: { title: 'Perfil · Seguindo' },
      },
    ],
  },
  {
    path: '/feed',
    name: 'feed',
    component: () => import('@/views/FeedView.vue'),
    meta: { title: 'Feed', requiresAuth: true },
  },
  {
    path: '/for-you',
    name: 'for-you',
    component: () => import('@/views/ForYouView.vue'),
    meta: { title: 'Para você', requiresAuth: true },
  },
  {
    path: '/u/:username/lists/:listId',
    name: 'list',
    component: () => import('@/views/ListView.vue'),
    props: (route) => ({ username: route.params.username, listId: Number(route.params.listId) }),
    meta: { title: 'Lista' },
  },
  {
    path: '/settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: { name: 'settings' } },
      ...tabRoutes(settingsTabs, 'Configurações', settingsViews),
    ],
  },
  {
    path: '/admin/reports',
    name: 'moderation',
    component: () => import('@/views/ModerationView.vue'),
    meta: { title: 'Moderação', requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: 'Entrar' },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('@/views/ForgotPasswordView.vue'),
    meta: { title: 'Esqueci a senha' },
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('@/views/ResetPasswordView.vue'),
    meta: { title: 'Nova senha' },
  },
  {
    path: '/verify-email',
    name: 'verify-email',
    component: () => import('@/views/VerifyEmailView.vue'),
    meta: { title: 'Confirmar e-mail' },
  },
  {
    path: '/signup',
    name: 'signup',
    component: () => import('@/views/SignupView.vue'),
    meta: { title: 'Criar conta' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: 'Erro' },
  },
]

if (import.meta.env.DEV) {
  routes.push({
    path: '/_design',
    name: 'design',
    component: () => import('@/views/DesignView.vue'),
    meta: { title: 'Estilos' },
  })
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresAdmin && auth.user?.role !== 'ADMIN') {
    return { name: 'home' }
  }
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · Game Log` : 'Game Log'
})

export default router
