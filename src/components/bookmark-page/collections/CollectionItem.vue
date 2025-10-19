<template>
  <!--
    CollectionItem 컴포넌트
    - 단일 Collection(북마크 폴더)을 표시하고 관리하는 컴포넌트
    - 폴더 개념으로 여러 개의 링크(Document)를 포함
    - 확장/축소, 검색, 아이템 추가/삭제 기능 제공
    - Brutalism 디자인 컨셉 적용 (날카로운 모서리, 굵은 테두리)
  -->
  <div class="collection-item" :class="{
    'expanded': isExpanded,        // 확장 상태
    'selected': isSelected,        // 선택 상태 (Store의 selectedCollectionId와 일치)
    'searching': fileSystemStore.isSearching  // 검색 모드
  }">
    <!-- Collection Header: 클릭으로 확장/축소 -->
    <div class="collection-header">
      <!--
        링크 추가 버튼
        - 확장 시에만 표시 (v-if="isExpanded")
        - 기본: 북마크 아이콘, 마우스 오버: 플러스 아이콘
        - 클릭 시 새 링크 추가 다이얼로그 표시
        - @click.stop: 이벤트 버블링 방지 (부모의 handleCollectionClick 호출 방지)
      -->
      <button v-if="isExpanded" class="add-item-button" @click.stop="handleAddItem" title="링크 추가">
        <!-- 북마크 아이콘 (기본 상태) -->
        <svg class="icon-bookmark" xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16">
          <path d="M200-120v-640q0-33 23.5-56.5T280-840h400q33 0 56.5 23.5T760-760v640L480-240 200-120Z" />
        </svg>
        <!-- 플러스 아이콘 (hover 상태) -->
        <svg class="icon-plus" xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20">
          <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
        </svg>
      </button>

      <!-- Collection 제목 영역 (클릭으로 확장/축소 토글) -->
      <div class="collection-title-area" @click="handleCollectionClick">
        <!-- Collection 제목 + 아이템 개수 -->
        <div class="collection-title">
          <!-- 검색 시 하이라이트 적용된 제목 (v-html) -->
          <span v-html="highlightedTitle"></span>
          <!-- 아이템 개수 뱃지 (pill 형태, 라운딩 유지) -->
          <span class="item-count">{{ collection.children.length }}</span>
        </div>

        <!--
          Favicon 그룹 플레이스홀더
          - 최대 3개의 링크 파비콘 미리보기
          - 현재는 🔗 이모지, 향후 실제 파비콘 이미지로 교체 예정
          - Math.min(3, collection.children.length): 최대 3개까지만 표시
        -->
        <div class="favicon-group">
          <div v-for="i in Math.min(3, collection.children.length)" :key="i" class="favicon-placeholder">
            🔗
          </div>
        </div>
      </div>
    </div>

    <!--
      아이템 리스트 (확장 시에만 표시)
      - transition name="expand": 확장/축소 애니메이션
      - displayItems: 검색 모드 여부에 따라 다른 리스트 반환 (Strategy Pattern)
    -->
    <transition name="expand">
      <div v-if="isExpanded" class="items-list">
        <!-- 개별 링크(Document) 아이템 -->
        <div v-for="item in displayItems" :key="item.id" class="item"
          :class="{ selected: item.id === fileSystemStore.selectedItemId }" @click="handleItemClick(item)">
          <!-- 아이템 아이콘 (파일 이모지) -->
          <div class="item-icon">📄</div>

          <!-- 아이템 내용 (제목 + 태그) -->
          <div class="item-content">
            <!-- 링크 제목 (검색 시 하이라이트 적용) -->
            <span class="item-passage" v-html="highlightText(item.passage)"></span>
            <!-- 태그 표시 (Document 타입인 경우에만) -->
            <span v-if="item instanceof Document && item.tags && item.tags.length > 0" class="item-tags">
              {{ item.tags.join(', ') }}
            </span>
          </div>

          <!--
            삭제 버튼
            - @click.stop: 이벤트 버블링 방지 (아이템 선택 방지)
            - × 문자 사용 (브루탈리즘 디자인)
          -->
          <button class="item-remove-button" @click.stop="handleRemoveItem(item)" title="삭제">
            ×
          </button>
        </div>

        <!-- 아이템이 없을 때 표시 -->
        <div v-if="displayItems.length === 0" class="empty-items">
          <p>아이템이 없습니다.</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
/**
 * CollectionItem 컴포넌트
 *
 * 역할:
 * - 단일 Collection(북마크 폴더)의 UI 렌더링 및 상호작용 처리
 * - 폴더-파일 구조에서 폴더(디렉토리)에 해당
 *
 * 디자인 패턴:
 * - Observer Pattern: Store 상태 변화 자동 감지 ($subscribe)
 * - Strategy Pattern: 검색/일반 모드에 따른 다른 표시 전략
 * - State Pattern: 확장/축소 상태 관리
 *
 * 데이터 흐름:
 * - Props로 Collection 객체 받음
 * - Store를 통해 상태 읽기/쓰기
 * - 로컬 상태(isExpanded)는 UI 전용
 */

import { ref, computed, watch } from 'vue'
import { useFileSystemStore, type Collection, type LeafNode, Document } from '@/stores/DataComponents'

// ==================== Props ====================
/**
 * Props 정의
 * @property {Collection} collection - 이 컴포넌트가 표시할 Collection 객체
 */
const props = defineProps<{
  collection: Collection
}>()

// ==================== Store ====================
/**
 * Pinia Store 인스턴스
 * - 모든 Collection과 Document 데이터 관리
 * - 검색, 선택, 가시성 상태 관리
 */
const fileSystemStore = useFileSystemStore()

// ==================== Local State ====================
/**
 * 확장/축소 상태 (로컬 UI 상태)
 * - true: Collection이 확장되어 내부 링크들 표시
 * - false: Collection이 축소되어 제목만 표시
 * - Store의 selectedCollectionId와 연동되지만 별도 관리
 */
const isExpanded = ref(false)

// ==================== Computed ====================
/**
 * 이 Collection이 현재 선택된 상태인지 확인
 * - Store의 selectedCollectionId와 비교
 * - 선택 시 테두리 강조 표시
 */
const isSelected = computed(() => {
  return fileSystemStore.selectedCollectionId === props.collection.id
})

/**
 * 표시할 아이템 리스트 (Strategy Pattern)
 * - 검색 모드: visible한 아이템만 필터링 (getVisibleChildren)
 * - 일반 모드: 모든 아이템 표시 (children)
 */
const displayItems = computed(() => {
  if (fileSystemStore.isSearching) {
    // 검색 모드: visible한 아이템만 표시
    return props.collection.getVisibleChildren()
  }
  // 일반 모드: 모든 아이템 표시
  return props.collection.children
})

/**
 * 검색어 하이라이트가 적용된 Collection 제목
 * - highlightText 함수로 <mark> 태그 삽입
 * - v-html로 렌더링
 */
const highlightedTitle = computed(() => {
  return highlightText(props.collection.passage)
})

// ==================== Event Handlers ====================
/**
 * Collection 클릭 핸들러 (확장/축소 토글)
 * - 이미 확장되고 선택된 상태: 축소 + 선택 해제
 * - 그 외: 확장 + 선택
 * - Store의 selectCollection 호출로 다른 컴포넌트와 동기화
 */
function handleCollectionClick() {
  if (isExpanded.value && isSelected.value) {
    // 이미 선택되고 확장된 상태면 축소
    isExpanded.value = false
    fileSystemStore.selectCollection(null)
  } else {
    // 확장 및 선택
    isExpanded.value = true
    fileSystemStore.selectCollection(props.collection.id)
  }
}

/**
 * 아이템(링크) 클릭 핸들러
 * - Store에 선택 상태 저장
 * - Document의 url이 있으면 새 탭에서 열기
 *
 * @param {LeafNode} item - 클릭된 아이템 (Document 또는 다른 LeafNode 타입)
 */
function handleItemClick(item: LeafNode) {
  fileSystemStore.selectItem(item.id)

  // Document 타입이고 url이 있으면 새 탭에서 열기
  if (item instanceof Document && item.url) {
    window.open(item.url, '_blank', 'noopener,noreferrer')
  } else {
    console.log('Item selected:', item.passage)
  }
}

/**
 * 링크 추가 버튼 클릭 핸들러
 * - 현재는 prompt로 URL 입력 받음
 * - TODO: 모달 또는 BottomSheet로 교체 예정
 * - Store의 addDocument 호출로 새 링크 추가
 */
function handleAddItem() {
  const url = prompt('추가할 링크 URL을 입력하세요:')
  if (url && url.trim()) {
    fileSystemStore.addDocument(props.collection.id, url.trim())
  }
}

/**
 * 아이템 삭제 버튼 클릭 핸들러
 * - 확인 다이얼로그 후 삭제
 * - Store의 removeItem 호출
 *
 * @param {LeafNode} item - 삭제할 아이템
 */
function handleRemoveItem(item: LeafNode) {
  if (confirm('이 아이템을 삭제하시겠습니까?')) {
    fileSystemStore.removeItem(props.collection.id, item.id)
  }
}

// ==================== Utility Functions ====================
/**
 * 검색어 하이라이트 함수
 * - 검색 모드가 아니면 원본 텍스트 반환
 * - 검색어와 일치하는 부분을 <mark> 태그로 감싸기
 * - 대소문자 구분 없음 (gi 플래그)
 *
 * @param {string} text - 하이라이트 적용할 텍스트
 * @returns {string} HTML 문자열 (<mark> 태그 포함)
 */
function highlightText(text: string): string {
  if (!fileSystemStore.isSearching || !fileSystemStore.searchTerm) {
    return text
  }

  const searchTerm = fileSystemStore.searchTerm
  const regex = new RegExp(`(${searchTerm})`, 'gi')
  return text.replace(regex, '<mark class="search-highlight">$1</mark>')
}

// ==================== Watchers ====================
/**
 * Watch: 다른 Collection이 선택되면 자동 축소
 * - Observer Pattern 구현
 * - Store의 selectedCollectionId 변화 감지
 * - 자신의 ID가 아니면 축소 (한 번에 하나만 확장)
 */
watch(() => fileSystemStore.selectedCollectionId, (newId) => {
  if (newId !== props.collection.id) {
    isExpanded.value = false
  }
})

/**
 * Pinia Store 구독 (Observer Pattern)
 * - Store의 모든 mutation 감지
 * - 검색 모드 변경 시 처리
 * - 검색 시작 시 visible한 Collection 자동 확장
 */
fileSystemStore.$subscribe((mutation, state) => {
  // 검색 모드 변경 시 처리
  if (mutation.type.includes('search')) {
    // 검색 시작 시 모든 visible Collection 확장
    if (state.isSearching && props.collection.visible) {
      isExpanded.value = true
    }
  }
})
</script>

<style scoped>
/* ==================== Collection Container ==================== */
/**
 * Collection 전체 컨테이너
 * - Brutalism 디자인: border-radius 0 (날카로운 모서리)
 * - 상태별 스타일 변화 (expanded, selected, searching)
 */
.collection-item {
  background-color: var(--background);
  border: 1px solid var(--grey-lv2);
  border-radius: 0;
  /* Brutalism: no rounding */
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 확장 상태: 배경색 변경 */
.collection-item.expanded {
  background-color: var(--grey-lv1);
}

/* 선택 상태: 테두리 강조 */
.collection-item.selected {
  border-color: var(--main);
  border-width: 2px;
}

/* 검색 모드: 투명도 유지 (visible하지 않은 경우 외부에서 처리) */
.collection-item.searching {
  opacity: 1;
}

/* ==================== Collection Header ==================== */
/**
 * Collection 헤더 (제목 영역)
 * - 클릭으로 확장/축소
 * - 링크 추가 버튼 포함
 */
.collection-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.collection-header:hover {
  background-color: var(--grey-lv1);
}

/* ==================== Add Item Button ==================== */
/**
 * 링크 추가 버튼
 * - 확장 시에만 표시 (slideIn 애니메이션)
 * - 북마크 아이콘 ↔ 플러스 아이콘 전환 (hover)
 * - 라운딩 유지 (border-radius: 4px)
 */
.add-item-button {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: none;
  background-color: var(--main);
  color: white;
  border-radius: 4px;
  /* 라운딩 유지 */
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  /* 아이콘 겹치기 위해 */
  transition: all 0.3s ease;
  animation: slideIn 0.3s ease;
}

.add-item-button:hover {
  opacity: 0.8;
}

/*
 * 아이콘 전환 효과
 * - 두 개의 SVG를 겹쳐서 배치
 * - opacity로 페이드 인/아웃
 */
.add-item-button svg {
  fill: white;
  position: absolute;
  transition: opacity 0.2s ease;
}

/* 기본 상태: 북마크 아이콘 표시 */
.add-item-button .icon-bookmark {
  opacity: 1;
}

.add-item-button .icon-plus {
  opacity: 0;
}

/* Hover 상태: 플러스 아이콘 표시 */
.add-item-button:hover .icon-bookmark {
  opacity: 0;
}

.add-item-button:hover .icon-plus {
  opacity: 1;
}

/* 버튼 등장 애니메이션 (좌측에서 슬라이드 인) */
@keyframes slideIn {
  from {
    width: 0;
    opacity: 0;
  }

  to {
    width: 24px;
    opacity: 1;
  }
}

/* ==================== Collection Title Area ==================== */
/**
 * Collection 제목 영역
 * - 제목 + 아이템 개수 + 파비콘 그룹
 */
.collection-title-area {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  /* flex 자식의 overflow 처리 */
}

.collection-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  font-size: 14px;
  color: var(--font-black);
  font-weight: 500;
}

/* 제목 텍스트 오버플로우 처리 */
.collection-title span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 아이템 개수 뱃지 (pill 형태, 라운딩 유지) */
.item-count {
  flex-shrink: 0;
  padding: 2px 8px;
  background-color: var(--grey-lv2);
  color: var(--grey-lv3);
  border-radius: 12px;
  /* Keep pill shape for count badge */
  font-size: 12px;
  font-weight: normal;
}

/* 파비콘 그룹 (최대 3개) */
.favicon-group {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.favicon-placeholder {
  width: 16px;
  height: 16px;
  font-size: 12px;
  opacity: 0.6;
}

/* ==================== Items List ==================== */
/**
 * 링크 아이템 리스트
 * - 확장 시에만 표시
 * - 각 아이템은 .item 클래스
 */
.items-list {
  padding: 0 12px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 개별 아이템 */
.item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: var(--background);
  border: 1px solid var(--grey-lv2);
  border-radius: 0;
  /* Brutalism: no rounding */
  cursor: pointer;
  transition: all 0.2s;
}

.item:hover {
  background-color: var(--grey-lv1);
  border-color: var(--main);
}

.item.selected {
  background-color: var(--grey-lv1);
  border-color: var(--main);
  border-width: 2px;
}

/* 아이템 아이콘 (파일 이모지) */
.item-icon {
  flex-shrink: 0;
  font-size: 16px;
}

/* 아이템 내용 (제목 + 태그) */
.item-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 아이템 제목 */
.item-passage {
  font-size: 13px;
  color: var(--font-black);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 아이템 태그 */
.item-tags {
  font-size: 11px;
  color: var(--grey-lv3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 삭제 버튼 */
.item-remove-button {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border: none;
  background-color: transparent;
  color: var(--grey-lv3);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  border-radius: 0;
  /* Brutalism: no rounding */
  transition: all 0.2s;
}

.item-remove-button:hover {
  background-color: var(--notification);
  color: white;
}

/* 빈 리스트 상태 */
.empty-items {
  padding: 20px;
  text-align: center;
  color: var(--grey-lv3);
  font-size: 13px;
}

.empty-items p {
  margin: 0;
}

/* ==================== Transitions ==================== */
/**
 * 확장/축소 애니메이션
 * - max-height와 opacity 전환
 * - 0.3s ease 애니메이션
 */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

/* ==================== Search Highlight ==================== */
/**
 * 검색어 하이라이트 스타일
 * - <mark> 태그에 적용
 * - :deep()으로 v-html 내부 요소 스타일링
 */
:deep(.search-highlight) {
  background-color: var(--main);
  color: var(--background);
  padding: 1px 2px;
  border-radius: 2px;
  font-weight: 600;
}
</style>
