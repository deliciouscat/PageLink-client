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

import { ref, onMounted } from 'vue'
import { useClerk } from '@clerk/vue'
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

onMounted(async () => {
  // OAuth 콜백 처리 - URL에 Clerk OAuth 파라미터가 있는지 확인
  const searchParams = new URLSearchParams(window.location.search)

  // Clerk OAuth 콜백 처리
  if (searchParams.has('__clerk_status') || searchParams.has('__clerk_created_session')) {
    console.log('Handling OAuth callback...')
    try {
      // Clerk가 자동으로 세션을 생성할 때까지 대기
      if (clerk.value) {
        // handleRedirectCallback은 자동으로 호출되므로, 세션이 생성될 때까지만 대기
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log('OAuth callback handled, session should be active')

        // URL 파라미터 정리
        window.history.replaceState({}, document.title, window.location.pathname)

        // Account 페이지로 이동
        currentMode.value = 'account'
      }
    } catch (error) {
      console.error('OAuth callback error:', error)
    }
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
