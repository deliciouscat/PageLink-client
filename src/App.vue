<script setup lang="ts">
/**
 * App 루트 컴포넌트
 *
 * 역할:
 * - 전체 애플리케이션의 루트 컴포넌트
 * - AppHeader와 메인 컨텐츠 영역(Bookmark/Explore Page) 통합
 * - 디스플레이 모드 전환 관리 (Bookmark ↔ Explore)
 *
 * 컴포넌트 계층:
 * App
 * ├── AppHeader (ToolBar 포함)
 * └── Main Content
 *     ├── BookmarkPage (Collections)
 *     └── ExplorePage
 *
 * 데이터 흐름:
 * - AppHeader에서 displayModeChange 이벤트 수신
 * - currentMode 상태로 표시할 페이지 결정
 * - toolbarOperation 이벤트는 로깅만 (Store에서 직접 처리)
 */

import { ref, onMounted, watch } from 'vue'
import { useClerk, useUser } from '@clerk/vue' // 🆕 useUser 추가
import ConvexProvider from '@/components/convex-provider/ConvexProvider.vue' // 🆕
import AppHeader from '@/components/app-header/AppHeader.vue'
import BookmarkPage from '@/components/bookmark-page/BookmarkPage.vue'
import ExplorePage from '@/components/explore-page/ExplorePage.vue'
import Account from '@/components/auth-settings-page/Account.vue'
import { useFileSystemStore, useCommentsStore } from '@/stores/DataComponents'

// ==================== State ====================
/**
 * 현재 디스플레이 모드
 * - 'bookmark': 북마크 관리 페이지
 * - 'explore': 탐색 페이지
 * - 'account': 계정 관리 페이지 (로그인/마이페이지)
 */
const currentMode = ref<'bookmark' | 'explore' | 'account'>('bookmark')

// ==================== Store Initialization ====================
/**
 * 샘플 데이터 초기화
 * - 앱 시작 시 샘플 북마크 및 댓글 데이터 생성
 */
const fileSystemStore = useFileSystemStore()
const commentsStore = useCommentsStore()

// Clerk instance
const clerk = useClerk()
const { user, isLoaded: userIsLoaded } = useUser() // 🆕

// ==================== 로그인 상태 감지 ====================
/**
 * 로그인 성공 시 자동으로 Bookmark 페이지로 이동
 * - user가 null에서 객체로 변경될 때 (로그인 성공)
 * - 현재 모드가 'account'일 때만 전환 (로그인 화면에서 로그인한 경우)
 */
let previousUser: typeof user.value = null
watch(
  [user, userIsLoaded],
  ([newUser, isLoaded]) => {
    console.log('[App.vue Watch] User state changed')
    console.log('[App.vue Watch] isLoaded:', isLoaded)
    console.log('[App.vue Watch] newUser:', newUser ? `User(${newUser.id})` : 'null')
    console.log('[App.vue Watch] previousUser:', previousUser ? `User(${previousUser.id})` : 'null')
    console.log('[App.vue Watch] currentMode:', currentMode.value)

    // Clerk가 로드되고, 로그인 성공한 경우 (null → user 객체)
    if (isLoaded && newUser && !previousUser && currentMode.value === 'account') {
      console.log('[App.vue Watch] ✅ Login successful, redirecting to bookmark page')
      currentMode.value = 'bookmark'
    }
    // 이전 사용자 상태 업데이트
    previousUser = newUser
  },
  { immediate: false }
)

// 로그인 전 초기 상태: Account 페이지 표시
watch(
  [userIsLoaded],
  ([isLoaded]) => {
    console.log('[App.vue Watch2] UserIsLoaded changed:', isLoaded)
    console.log('[App.vue Watch2] User exists:', !!user.value)
    console.log('[App.vue Watch2] Current mode:', currentMode.value)

    if (isLoaded && !user.value && currentMode.value === 'bookmark') {
      console.log('[App.vue Watch2] Not logged in, switching to account page')
      // 로그인 안된 상태에서 bookmark 모드면 account로 변경
      currentMode.value = 'account'
    }
  },
  { immediate: true }
)

onMounted(async () => {
  console.log('[App.vue] Component mounted')
  console.log('[App.vue] Current URL:', window.location.href)
  console.log('[App.vue] Current mode:', currentMode.value)
  console.log('[App.vue] User loaded:', userIsLoaded.value)
  console.log('[App.vue] User exists:', !!user.value)

  // OAuth 콜백 처리 - URL에 Clerk OAuth 파라미터가 있는지 확인
  const searchParams = new URLSearchParams(window.location.search)
  const hashParams = window.location.hash

  console.log('[App.vue] Search params:', Array.from(searchParams.entries()))
  console.log('[App.vue] Hash:', hashParams)

  // Clerk OAuth 콜백 처리
  // Facebook은 #_=_ 를 추가하므로 hash도 확인
  if (searchParams.has('__clerk_status') || searchParams.has('__clerk_created_session') || hashParams.includes('_=_')) {
    console.log('[App.vue] OAuth callback detected!')
    console.log('[App.vue] Clerk status:', searchParams.get('__clerk_status'))
    console.log('[App.vue] Session created:', searchParams.get('__clerk_created_session'))

    try {
      // Clerk와 userIsLoaded가 준비될 때까지 대기
      let clerkWaitAttempts = 0
      while ((!clerk.value || !userIsLoaded.value) && clerkWaitAttempts < 20) {
        console.log(`[App.vue] Waiting for Clerk to load... (attempt ${clerkWaitAttempts + 1}/20)`)
        await new Promise(resolve => setTimeout(resolve, 200))
        clerkWaitAttempts++
      }

      if (clerk.value && userIsLoaded.value) {
        console.log('[App.vue] Clerk loaded, waiting for user session...')

        // 사용자 세션이 완전히 로드될 때까지 최대 5초 대기
        let attempts = 0
        const maxAttempts = 10

        while (!user.value && attempts < maxAttempts) {
          console.log(`[App.vue] Waiting for user session... (attempt ${attempts + 1}/${maxAttempts})`)
          await new Promise(resolve => setTimeout(resolve, 500))
          attempts++
        }

        if (user.value) {
          console.log('[App.vue] ✅ OAuth callback handled successfully!')
          console.log('[App.vue] User ID:', user.value.id)
          console.log('[App.vue] User email:', user.value.emailAddresses?.[0]?.emailAddress)

          // URL 파라미터와 hash 정리
          window.history.replaceState({}, document.title, window.location.pathname)
          console.log('[App.vue] URL cleaned:', window.location.href)

          // watch가 자동으로 bookmark 페이지로 전환함
          console.log('[App.vue] Waiting for watch to trigger page transition...')
        } else {
          console.error('[App.vue] ❌ Failed to load user session after OAuth callback')
          console.error('[App.vue] userIsLoaded:', userIsLoaded.value)
          console.error('[App.vue] user:', user.value)

          // URL 파라미터와 hash 정리
          window.history.replaceState({}, document.title, window.location.pathname)
          currentMode.value = 'account'
        }
      } else {
        console.error('[App.vue] ❌ Clerk failed to load')
        console.error('[App.vue] clerk:', clerk.value)
        console.error('[App.vue] userIsLoaded:', userIsLoaded.value)
        currentMode.value = 'account'
      }
    } catch (error) {
      console.error('[App.vue] ❌ OAuth callback error:', error)
      currentMode.value = 'account'
    }
  } else {
    console.log('[App.vue] No OAuth callback detected')
  }

  // 샘플 북마크 데이터 생성
  if (fileSystemStore.collections.length === 0) {
    fileSystemStore.generateSampleData()
  }

  // 샘플 댓글 데이터 생성
  if (commentsStore.documentComments.size === 0) {
    commentsStore.generateSampleComments()
  }
})

// ==================== Event Handlers ====================
/**
 * AppHeader에서 디스플레이 모드 변경 이벤트 처리
 * - AppHeader의 모드 전환 버튼 클릭 시 호출
 * - currentMode 업데이트로 메인 컨텐츠 자동 전환
 *
 * @param {Object} payload - 디스플레이 모드 정보
 * @param {string} payload.currentMode - 현재 모드 ('bookmark' | 'explore' | 'account')
 * @param {string} payload.swapTo - 전환 대상 모드
 * @param {string} payload.locale - 언어 설정
 * @param {string | null} payload.overlay - 오버레이 상태 (사용 안 함)
 */
function handleDisplayModeChange(payload: {
  currentMode: string
  swapTo: string
  locale: string
  overlay: string | null
}) {
  currentMode.value = payload.currentMode as 'bookmark' | 'explore' | 'account'
}

/**
 * ToolBar 작업 처리 (현재는 로깅만)
 * - ToolBar에서 검색/추가 작업 시 호출
 * - 실제 처리는 ToolBar 내부에서 Store를 통해 직접 수행
 * - 이 핸들러는 추가 로직이 필요할 때를 대비한 확장 포인트
 *
 * @param {Object} payload - ToolBar 작업 정보
 * @param {'search' | 'add'} payload.toolbar_operation - 작업 타입
 * @param {string} payload.toolbar_input - 입력값
 */
function handleToolbarOperation(payload: {
  toolbar_operation: 'search' | 'add'
  toolbar_input: string
}) {
  console.log('Toolbar operation:', payload)
  // ToolBar에서 이미 Store를 통해 처리하므로 여기서는 로깅만
  // 필요시 추가 로직 구현 (예: Analytics 전송)
}
</script>

<template>
  <!--
    애플리케이션 루트 컨테이너
    - 전체 화면 레이아웃
  -->
  <div id="app">
    <!-- 🆕 ConvexProvider로 래핑 (로그인된 사용자만) -->
    <ConvexProvider v-if="user">
      <!--
        App Header
        - 로고, 계정, 설정, 모드 전환 버튼
        - ToolBar (검색/추가 기능)
        - 이벤트:
          - @display-mode-change: 모드 전환 시
          - @toolbar-operation: 검색/추가 작업 시
      -->
      <AppHeader @display-mode-change="handleDisplayModeChange" @toolbar-operation="handleToolbarOperation" />

      <!--
        Main Content Area
        - currentMode에 따라 다른 페이지 표시
        - v-if 조건부 렌더링으로 컴포넌트 마운트/언마운트
      -->
      <main class="main-content">
        <!-- Bookmark Page: 북마크 관리 -->
        <BookmarkPage v-if="currentMode === 'bookmark'" />

        <!-- Explore Page: 탐색 페이지 -->
        <ExplorePage v-else-if="currentMode === 'explore'" />

        <!-- Account Page: 계정 관리 (로그인/마이페이지) -->
        <Account v-else-if="currentMode === 'account'" />

        <!-- Error State: 잘못된 모드 (발생하지 않아야 함) -->
        <div v-else class="error-state">
          <p>Error: Invalid display mode</p>
        </div>
      </main>
    </ConvexProvider>

    <!-- 로그인 전 UI -->
    <div v-else>
      <!--
        App Header
        - 로고, 계정, 설정, 모드 전환 버튼
        - ToolBar (검색/추가 기능)
        - 이벤트:
          - @display-mode-change: 모드 전환 시
          - @toolbar-operation: 검색/추가 작업 시
      -->
      <AppHeader @display-mode-change="handleDisplayModeChange" @toolbar-operation="handleToolbarOperation" />

      <!--
        Main Content Area
        - 로그인 전에는 Account 페이지만 표시 (LoginPage)
      -->
      <main class="main-content">
        <Account />
      </main>
    </div>
  </div>
</template>

<style>
/* ==================== Global Styles ==================== */
/**
 * 전역 스타일 (scoped 아님)
 * - 모든 컴포넌트에 적용
 * - CSS 변수는 color_template.css에서 정의
 */

/* Color 템플릿 import */
@import '@/styles/color_template.css';

/* KaTeX 스타일 import */
@import 'katex/dist/katex.min.css';

/* 모든 요소 리셋 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* App 루트 컨테이너 */
#app {
  /* 시스템 폰트 사용 (각 OS에 최적화) */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  /* macOS/iOS 폰트 렌더링 개선 */
  -moz-osx-font-smoothing: grayscale;
  /* Firefox 폰트 렌더링 개선 */
  background-color: var(--background);
  color: var(--font-black);
  width: 100%;
  height: 100vh;
  /* 전체 뷰포트 높이 */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Main Content Area */
.main-content {
  width: 100%;
  flex: 1;
  min-height: 0;
  /* flex 자식이 overflow 되도록 */
  overflow: hidden;
}

/* Error State (잘못된 디스플레이 모드) */
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: var(--notification);
  /* 빨간색 경고 */
  font-size: 16px;
  font-weight: 600;
}
</style>
