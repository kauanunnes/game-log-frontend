import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { profileTabs, settingsTabs, type Tab } from './tabs'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
  }
}

const Placeholder = () => import('@/views/PlaceholderView.vue')

const tabRoutes = (tabs: Tab[], section: string): RouteRecordRaw[] =>
  tabs.map(({ path, name, label }) => ({
    path,
    name,
    component: Placeholder,
    meta: { title: `${section} · ${label}` },
  }))

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
    children: tabRoutes(profileTabs, 'Perfil'),
  },
  {
    path: '/settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: { name: 'settings' } },
      ...tabRoutes(settingsTabs, 'Configurações'),
    ],
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: 'Entrar' },
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
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !useAuthStore().isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · Game Log` : 'Game Log'
})

export default router
