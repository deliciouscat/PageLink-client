<script setup lang="ts">
/**
 * Collections 컴포넌트
 *
 * 역할:
 * - CollectionItem 컴포넌트들을 나열하는 컨테이너
 * - Store의 visibleCollections를 반복하여 렌더링
 * - 검색 결과 및 빈 상태 처리
 *
 * 디자인 패턴:
 * - Container/Presenter Pattern
 * - Collections(Container): 데이터 로직, CollectionItem(Presenter): 표시 로직
 *
 * 데이터 흐름:
 * - Store에서 visibleCollections 가져오기 (reactive)
 * - v-for로 각 Collection을 CollectionItem에 전달
 * - 검색/추가는 ToolBar와 Store를 통해 자동 반영
 */

import { computed, onMounted } from 'vue'
import { useFileSystemStore } from '@/stores/DataComponents'
import CollectionItem from './CollectionItem.vue'

// ==================== Store ====================
/**
 * Pinia Store 인스턴스
 * - 모든 Collection 데이터 관리
 * - visibleCollections: 검색 필터링 적용된 Collection 목록
 */
const fileSystemStore = useFileSystemStore()

// ==================== Computed ====================
/**
 * 표시할 Collection 목록
 * - Store의 visibleCollections computed 속성
 * - 검색 모드에서는 visible=true인 Collection만 포함
 * - 일반 모드에서는 모든 Collection 포함
 */
const visibleCollections = computed(() => {
  return fileSystemStore.visibleCollections
})

// ==================== Lifecycle Hooks ====================
/**
 * 컴포넌트 마운트 시 실행
 * - 샘플 데이터가 없으면 자동 생성
 * - 개발 환경에서만 동작 (프로덕션에서는 Chrome API로 실제 데이터 로드)
 */
onMounted(() => {
  if (fileSystemStore.collections.length === 0) {
    fileSystemStore.generateSampleData()
  }
})
</script>

<template>
  <!--
    Collections 컨테이너
    - 세로 방향 레이아웃 (flex-direction: column)
    - 8px 간격으로 CollectionItem들 배치
  -->
  <div class="collections-container">
    <!--
      CollectionItem 반복 렌더링
      - v-for: visibleCollections의 각 collection에 대해
      - :key: collection.id로 고유 식별 (Vue 성능 최적화)
      - :collection: CollectionItem에 props로 전달
    -->
    <CollectionItem v-for="collection in visibleCollections" :key="collection.id" :collection="collection" />

    <!--
      Empty State (빈 상태 표시)
      - Collection이 하나도 없거나 검색 결과가 없을 때 표시
      - 검색 모드와 일반 모드에 따라 다른 메시지
    -->
    <div v-if="visibleCollections.length === 0" class="empty-state">
      <!-- 검색 모드: 검색 결과 없음 -->
      <p v-if="fileSystemStore.isSearching">검색 결과가 없습니다.</p>
      <!-- 일반 모드: Collection 추가 안내 -->
      <p v-else>컬렉션이 없습니다. 상단의 + 버튼으로 추가해보세요!</p>
    </div>
  </div>
</template>

<style scoped>
/* ==================== Container ==================== */
/**
 * Collections 컨테이너 스타일
 * - Flex 세로 레이아웃으로 CollectionItem들 배치
 * - 최소 높이 400px로 빈 공간 방지
 */
.collections-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  /* CollectionItem 간 간격 */
  padding: 16px;
  background-color: var(--background);
  min-height: 400px;
}

/* ==================== Empty State ==================== */
/**
 * 빈 상태 표시 스타일
 * - 중앙 정렬
 * - 회색 텍스트로 부드러운 안내
 */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--grey-lv3);
  font-size: 14px;
  text-align: center;
}

.empty-state p {
  margin: 0;
}
</style>
