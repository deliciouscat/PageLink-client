<script setup lang="ts">
/**
 * BookmarkPage 컴포넌트
 *
 * 역할:
 * - Bookmark 모드의 메인 페이지
 * - Collections와 BottomSheet를 통합하는 컨테이너
 *
 * 구성:
 * - Collections: Collection 목록 표시
 * - BottomSheet: 현재 페이지의 댓글 표시/작성
 */

import { ref, onMounted } from 'vue'
import Collections from './collections/Collections.vue'
import BottomSheet from './bottom-sheet/BottomSheet.vue'

// 현재 URL 상태 (크롬 익스텐션에서는 chrome.tabs API 사용)
const currentUrl = ref('http://localhost:5173/')

// 현재 탭의 URL 가져오기
onMounted(() => {
  // 크롬 익스텐션 환경인지 확인
  if (typeof chrome !== 'undefined' && chrome?.tabs) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
      if (tabs[0]?.url) {
        currentUrl.value = tabs[0].url
      }
    })
  } else {
    // 개발 환경에서는 현재 window.location.href 사용
    currentUrl.value = window.location.href
  }
})
</script>

<template>
  <!--
    Bookmark Page 컨테이너
    - 북마크 관리의 메인 영역
  -->
  <div class="bookmark-page">
    <!-- Collections 컴포넌트: Collection 목록 표시 (스크롤 가능) -->
    <div class="collections-container">
      <Collections />
    </div>

    <!-- BottomSheet 컴포넌트: 현재 페이지의 댓글 표시/작성 (하단 고정) -->
    <div class="bottom-sheet-container">
      <BottomSheet :current-url="currentUrl" />
    </div>
  </div>
</template>

<style scoped>
/* ==================== Bookmark Page Container ==================== */
/**
 * Bookmark Page 스타일
 * - 전체 너비 사용
 * - Collections는 스크롤 가능, BottomSheet는 하단 고정
 */
.bookmark-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: var(--background);
  overflow: hidden;
}

/* ==================== Collections Container ==================== */
/**
 * Collections 영역
 * - 남은 공간 모두 사용
 * - 스크롤 가능
 */
.collections-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px;
  min-height: 0;
  /* flex 자식이 overflow 되도록 */
}

/* 스크롤바 스타일 */
.collections-container::-webkit-scrollbar {
  width: 6px;
}

.collections-container::-webkit-scrollbar-track {
  background: transparent;
}

.collections-container::-webkit-scrollbar-thumb {
  background: var(--grey-lv3);
  border-radius: 0;
}

.collections-container::-webkit-scrollbar-thumb:hover {
  background: var(--grey-lv4);
}

/* ==================== BottomSheet Container ==================== */
/**
 * BottomSheet 영역
 * - 하단에 고정
 * - 높이는 BottomSheet 컴포넌트 내부에서 동적으로 결정
 */
.bottom-sheet-container {
  flex-shrink: 0;
  width: 100%;
}
</style>
