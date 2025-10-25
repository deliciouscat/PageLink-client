import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@clerk/vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/Home.vue'),
      meta: { isPublic: true },
    },
    {
      path: '/onboarding',
      name: 'Onboarding',
      component: () => import('@/views/auth-settings-page/LoginPage.vue'),
      meta: { isPublic: true },
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/views/auth-settings-page/MyPage.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

// Global Navigation Guard
router.beforeEach(async (to, from, next) => {
  const { userId, sessionClaims, isLoaded } = useAuth()

  // Clerk가 로드될 때까지 대기
  if (!isLoaded.value) {
    await new Promise((resolve) => {
      const unwatch = watch(isLoaded, (loaded) => {
        if (loaded) {
          unwatch()
          resolve(true)
        }
      })
    })
  }

  const isPublicRoute = to.meta.isPublic
  const requiresAuth = to.meta.requiresAuth

  // 사용자가 로그인하지 않았고 라우트가 private인 경우
  if (!userId.value && requiresAuth) {
    // Clerk의 sign-in 페이지로 리다이렉트
    window.location.href = `/sign-in?redirect_url=${encodeURIComponent(to.fullPath)}`
    return
  }

  // 온보딩이 완료되지 않은 사용자를 /onboarding으로 리다이렉트
  if (
    userId.value &&
    !sessionClaims.value?.metadata?.onboardingComplete &&
    to.path !== '/onboarding'
  ) {
    next('/onboarding')
    return
  }

  // 온보딩을 완료한 사용자가 /onboarding에 접근하려는 경우
  if (
    userId.value &&
    sessionClaims.value?.metadata?.onboardingComplete &&
    to.path === '/onboarding'
  ) {
    next('/dashboard')
    return
  }

  // 그 외의 경우 정상 진행
  next()
})

export default router
