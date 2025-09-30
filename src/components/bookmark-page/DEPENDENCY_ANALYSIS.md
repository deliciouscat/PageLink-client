# 북마크 페이지 종속성 분석

## 🏗️ 아키텍처 개요

### 핵심 원칙

1. **Single Source of Truth**: `DataComponents Store` (Pinia)
2. **단방향 데이터 흐름**: Store → View (reactive), View → Store (actions)
3. **느슨한 결합**: 컴포넌트 간 직접 참조 없음, Store를 통한 통신

## 📦 컴포넌트 종속성 맵

### DataComponents Store (중앙 상태 관리)

**역할**: 모든 Collection과 Document 데이터 관리

**의존성**:

- `vue`: ref, computed
- `pinia`: defineStore

**제공하는 기능**:

- State: `collections`, `searchTerm`, `isSearching`, `selectedCollectionId`
- Actions: `createCollection`, `addDocument`, `search`, `clearSearch`
- Computed: `visibleCollections`, `selectedCollection`

**종속되는 컴포넌트**:

- ToolBar.vue (검색/추가)
- Collections.vue (목록 표시)
- CollectionItem.vue (개별 Collection)

---

### ToolBar.vue

**역할**: 검색 및 Collection 추가 UI

**의존성**:

- `@/stores/DataComponents`: Store 접근
- `vue`: ref, computed, watch

**데이터 흐름**:

```
사용자 입력 → ToolBar
           ↓
       Store.search() / Store.createCollection()
           ↓
       Store 상태 변경
           ↓
       Collections.vue 자동 반응 (reactive)
```

**이벤트**: 없음 (Store를 통해 직접 처리)

---

### Collections.vue

**역할**: CollectionItem들을 나열하는 컨테이너

**의존성**:

- `@/stores/DataComponents`: Store 접근
- `./CollectionItem.vue`: 자식 컴포넌트

**데이터 바인딩**:

```vue
<CollectionItem
  v-for="collection in fileSystemStore.visibleCollections"
  :key="collection.id"
  :collection="collection"
/>
```

**반응성**:

- `fileSystemStore.visibleCollections` 변경 시 자동 재렌더링
- 검색 필터링 자동 반영

---

### CollectionItem.vue

**역할**: 단일 Collection 표시 및 상호작용

**의존성**:

- `@/stores/DataComponents`: Store 접근
- Props: `collection: Collection`

**상태 관리** (로컬):

- `isExpanded`: 확장/축소 상태
- `displayStrategy`: 표시 모드 전략

**Store 연동**:

- `store.$subscribe()`: Store 변화 감지 (Observer Pattern)
- `store.selectCollection()`: 선택 상태 업데이트
- `store.addDocument()`: 새 Document 추가

**데이터 흐름**:

```
CollectionItem (로컬 상태: 확장/축소)
     ↓
Store.selectCollection(id) ← 다른 Collection 선택 시
     ↓
Store.selectedCollectionId 변경
     ↓
모든 CollectionItem의 $subscribe 콜백 실행
     ↓
자신의 ID와 다르면 자동 축소
```

---

## 🔄 데이터 흐름 시나리오

### 1. 검색 시나리오

```
1. 사용자가 ToolBar에 "Vue" 입력
   ↓
2. ToolBar.handleSearchInput()
   ↓
3. fileSystemStore.search("Vue")
   ↓
4. Store가 모든 Collection.updateVisible("Vue") 호출
   ↓
5. visibleCollections computed 자동 재계산
   ↓
6. Collections.vue 자동 재렌더링
   ↓
7. CollectionItem들의 $subscribe 콜백 실행
   ↓
8. DisplayStrategy가 SearchDisplayStrategy로 변경
   ↓
9. 검색 결과 하이라이트 표시
```

### 2. Collection 추가 시나리오

```
1. 사용자가 ToolBar에 "새 컬렉션" 입력 + Enter
   ↓
2. ToolBar.handleAddSubmit()
   ↓
3. fileSystemStore.createCollection("새 컬렉션")
   ↓
4. Store.collections 배열에 추가
   ↓
5. Collections.vue의 v-for 자동 반응
   ↓
6. 새 CollectionItem 렌더링
```

### 3. Collection 확장/축소 시나리오

```
1. 사용자가 CollectionItem 클릭
   ↓
2. CollectionItem.currentState.onPress(this)
   ↓
3. State Pattern: CollapsedState → ExpandedState
   ↓
4. fileSystemStore.selectCollection(collection.id)
   ↓
5. Store.selectedCollectionId 변경
   ↓
6. 다른 CollectionItem들의 $subscribe 콜백 실행
   ↓
7. 다른 Collection들 자동 축소
   ↓
8. 선택된 Collection만 확장 상태 유지
```

---

## ⚠️ 안티패턴 및 주의사항

### ❌ 피해야 할 패턴

1. **컴포넌트 간 직접 참조**

```javascript
// ❌ 잘못된 예
import ToolBar from '@/components/app-header/ToolBar.vue'
const toolbarState = ToolBar.state // 직접 참조 금지!

// ✅ 올바른 예
const fileSystemStore = useFileSystemStore()
const searchTerm = fileSystemStore.searchTerm
```

2. **Props Drilling**

```vue
<!-- ❌ 잘못된 예 -->
<Collections :searchTerm="searchTerm" :isSearching="isSearching" />

<!-- ✅ 올바른 예 -->
<Collections />
<!-- Store에서 직접 접근 -->
```

3. **이벤트 버스 남용**

```javascript
// ❌ 잘못된 예
emit('search', searchTerm) // 여러 단계 거쳐 전달

// ✅ 올바른 예
fileSystemStore.search(searchTerm) // Store 직접 호출
```

### ✅ 권장 패턴

1. **Store 중심 상태 관리**

```javascript
// 모든 컴포넌트에서
const fileSystemStore = useFileSystemStore()

// 읽기
const collections = fileSystemStore.visibleCollections

// 쓰기
fileSystemStore.createCollection(name)
```

2. **Observer Pattern (자동 동기화)**

```javascript
// CollectionItem.vue
onMounted(() => {
  fileSystemStore.$subscribe((mutation, state) => {
    // Store 변화에 자동 반응
    if (mutation.type.includes('search')) {
      updateDisplayStrategy()
    }
  })
})
```

3. **Strategy Pattern (유연한 렌더링)**

```javascript
// 검색 모드에 따라 자동 전략 변경
updateDisplayStrategy() {
  this.displayStrategy = this.store.isSearching
    ? new SearchDisplayStrategy()
    : new NormalDisplayStrategy()
}
```

---

## 🧪 테스트 체크리스트

### Unit Tests

- [ ] Store actions 테스트 (createCollection, search 등)
- [ ] Collection.updateVisible() 로직 테스트
- [ ] DisplayStrategy 전환 테스트

### Integration Tests

- [ ] ToolBar → Store → Collections 통합 흐름
- [ ] 검색 시 모든 Collection 필터링 확인
- [ ] Collection 선택 시 다른 Collection 자동 축소

### E2E Tests

- [ ] 사용자가 검색 → 결과 표시 → 클리어
- [ ] Collection 추가 → 확장 → Document 추가
- [ ] 여러 Collection 간 전환

---

## 🚀 확장 시 고려사항

1. **새 기능 추가 시**: Store에 action/state 추가
2. **새 표시 모드**: DisplayStrategy 인터페이스 구현
3. **새 상태**: CollectionState 인터페이스 구현
4. **성능 최적화**: computed 속성 활용, v-memo 사용

---

## 📌 핵심 원칙 요약

> **"컴포넌트는 Store를 구독하고, Store는 데이터를 관리한다."**

1. ✅ Store만 데이터를 소유
2. ✅ 컴포넌트는 Store를 읽기만 (reactive)
3. ✅ 변경은 Store actions를 통해서만
4. ✅ 컴포넌트 간 직접 통신 금지
5. ✅ 모든 상태 변화는 Store를 거침
