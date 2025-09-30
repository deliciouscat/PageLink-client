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
 * - BottomSheet: 링크 상세 정보/편집 (향후 구현)
 */

import Collections from './collections/Collections.vue'
// import BottomSheet from './bottom-sheet/BottomSheet.vue'  // TODO: 구현 후 활성화
</script>

<template>
  <!--
    Bookmark Page 컨테이너
    - 북마크 관리의 메인 영역
  -->
  <div class="bookmark-page">
    <!-- Collections 컴포넌트: Collection 목록 표시 -->
    <Collections />

    <!-- BottomSheet 컴포넌트 (향후 구현) -->
    <!--
      TODO: BottomSheet 구현
      - 링크 상세 정보 표시
      - 편집/공유 기능
      - 하단에서 슬라이드 업 애니메이션
    -->
    <!-- <BottomSheet /> -->
  </div>
</template>

<style scoped>
/* ==================== Bookmark Page Container ==================== */
/**
 * Bookmark Page 스타일
 * - 전체 너비 사용
 * - 최소 높이 400px로 빈 공간 방지
 */
.bookmark-page {
  width: 100%;
  min-height: 400px;
  background-color: var(--background);
}
</style>
