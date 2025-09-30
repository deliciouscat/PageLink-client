# Chrome Extension 전환 가이드

## 📋 개요

현재 구현된 Vue 3 웹 애플리케이션을 Chrome Extension으로 전환하기 위한 가이드입니다.

---

## 🏗️ 현재 아키텍처

### 컴포넌트 구조

```
App.vue (루트)
├── AppHeader.vue
│   ├── Logo, Account, Settings
│   ├── Mode Toggle Button
│   └── ToolBar.vue (검색/추가)
├── BookmarkPage.vue
│   └── Collections.vue
│       └── CollectionItem.vue (v-for)
│           └── Document items
└── ExplorePage.vue (placeholder)
```

### 데이터 관리

- **Pinia Store** (`DataComponents.ts`)
  - Single Source of Truth
  - Collections, Documents 관리
  - 검색, 선택, 가시성 상태 관리

### 디자인 패턴

1. **Observer Pattern**: Store 상태 변화 자동 감지
2. **Strategy Pattern**: 검색/일반 모드 전환
3. **State Pattern**: Collection 확장/축소
4. **Composite Pattern**: Collection-Document 계층 구조

---

## 🔄 Chrome Extension 전환 작업

### 1. Manifest 설정

**`manifest.json` 생성 (Manifest V3)**

```json
{
  "manifest_version": 3,
  "name": "PageLink - Bookmark Manager",
  "version": "1.0.0",
  "description": "북마크 관리 Chrome Extension with Brutalism Design",

  "action": {
    "default_popup": "index.html",
    "default_title": "PageLink",
    "default_icon": {
      "16": "public/favicon.ico",
      "48": "public/favicon.ico",
      "128": "public/favicon.ico"
    }
  },

  "permissions": ["bookmarks", "storage", "tabs"],

  "host_permissions": ["<all_urls>"]
}
```

### 2. Vite 빌드 설정 수정

**`vite.config.ts` 업데이트**

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'

export default defineConfig({
  plugins: [vue(), crx({ manifest })],
  build: {
    rollupOptions: {
      input: {
        popup: 'index.html',
      },
    },
  },
})
```

**필요한 패키지 설치**

```bash
npm install -D @crxjs/vite-plugin
```

### 3. Chrome API 연동

#### 3.1. Bookmarks API 통합

**`src/services/ChromeBookmarkService.ts` 생성**

```typescript
/**
 * Chrome Bookmarks API 서비스
 * - Chrome의 북마크 데이터를 Store와 동기화
 * - Composite Pattern으로 폴더-파일 구조 매핑
 */

import { useFileSystemStore } from '@/stores/DataComponents'

export class ChromeBookmarkService {
  private store = useFileSystemStore()

  /**
   * Chrome 북마크 트리 가져오기
   * - chrome.bookmarks.getTree() 호출
   * - Store의 Collection/Document로 변환
   */
  async loadBookmarks(): Promise<void> {
    const tree = await chrome.bookmarks.getTree()
    this.parseBookmarkTree(tree[0])
  }

  /**
   * 북마크 트리 파싱
   * - BookmarkTreeNode → Collection/Document 변환
   * - 재귀적으로 하위 폴더 처리
   */
  private parseBookmarkTree(node: chrome.bookmarks.BookmarkTreeNode): void {
    if (node.children) {
      // 폴더인 경우 → Collection
      const collection = this.store.createCollection(node.title)

      node.children.forEach((child) => {
        if (child.url) {
          // 북마크인 경우 → Document
          this.store.addDocument(collection.id, child.url, [])
        } else if (child.children) {
          // 하위 폴더는 재귀 처리 (향후 확장)
          this.parseBookmarkTree(child)
        }
      })
    }
  }

  /**
   * 북마크 추가 (Chrome API)
   * - Store와 Chrome 북마크 동시 업데이트
   */
  async addBookmark(collectionTitle: string, url: string): Promise<void> {
    // 1. Chrome API로 북마크 추가
    const folder = await this.findOrCreateFolder(collectionTitle)
    await chrome.bookmarks.create({
      parentId: folder.id,
      title: url,
      url: url,
    })

    // 2. Store 업데이트 (이미 ToolBar에서 처리됨)
  }

  /**
   * 폴더 찾기 또는 생성
   */
  private async findOrCreateFolder(title: string): Promise<chrome.bookmarks.BookmarkTreeNode> {
    const tree = await chrome.bookmarks.getTree()
    // 북마크 바 찾기
    const bookmarksBar = tree[0].children?.find((n) => n.id === '1')

    // 폴더 찾기
    let folder = bookmarksBar?.children?.find((n) => n.title === title)

    if (!folder) {
      // 폴더 생성
      folder = await chrome.bookmarks.create({
        parentId: '1', // 북마크 바
        title: title,
      })
    }

    return folder
  }

  /**
   * 북마크 삭제 (Chrome API)
   */
  async removeBookmark(url: string): Promise<void> {
    const tree = await chrome.bookmarks.getTree()
    const bookmark = this.findBookmarkByUrl(tree[0], url)

    if (bookmark) {
      await chrome.bookmarks.remove(bookmark.id)
    }
  }

  /**
   * URL로 북마크 찾기 (재귀)
   */
  private findBookmarkByUrl(
    node: chrome.bookmarks.BookmarkTreeNode,
    url: string,
  ): chrome.bookmarks.BookmarkTreeNode | null {
    if (node.url === url) {
      return node
    }

    if (node.children) {
      for (const child of node.children) {
        const found = this.findBookmarkByUrl(child, url)
        if (found) return found
      }
    }

    return null
  }
}
```

#### 3.2. Store 수정 (Chrome API 통합)

**`src/stores/DataComponents.ts` 업데이트**

```typescript
// Actions - Chrome API 연동
function addDocumentWithChrome(collectionId: string, url: string): Document | null {
  const doc = addDocument(collectionId, url)

  if (doc && typeof chrome !== 'undefined' && chrome.bookmarks) {
    // Chrome Extension 환경에서만 실행
    chromeBookmarkService.addBookmark(
      getCollectionById(collectionId)?.passage || 'Uncategorized',
      url,
    )
  }

  return doc
}
```

#### 3.3. 탭 관리 (링크 열기)

**`CollectionItem.vue` 수정**

```typescript
// handleItemClick 수정
function handleItemClick(item: LeafNode) {
  fileSystemStore.selectItem(item.id)

  // Chrome Extension에서 새 탭으로 열기
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.create({ url: item.passage })
  } else {
    // 일반 웹에서는 새 창으로 열기
    window.open(item.passage, '_blank')
  }
}
```

### 4. 파비콘 가져오기

**`src/utils/favicon.ts` 생성**

```typescript
/**
 * 파비콘 URL 생성
 * - Google의 favicon 서비스 사용
 * - 또는 직접 파싱
 */
export function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  } catch {
    return '🔗' // fallback
  }
}
```

**`CollectionItem.vue` 파비콘 적용**

```vue
<div class="favicon-group">
  <img 
    v-for="(item, i) in collection.children.slice(0, 3)" 
    :key="i"
    :src="getFaviconUrl(item.passage)"
    class="favicon-image"
    @error="handleFaviconError"
  />
</div>
```

### 5. Storage API (데이터 영속성)

**`src/services/ChromeStorageService.ts` 생성**

```typescript
/**
 * Chrome Storage API 서비스
 * - Store 상태를 chrome.storage.local에 저장
 * - 확장 프로그램 재시작 시 복원
 */

export class ChromeStorageService {
  private static STORAGE_KEY = 'pagelink_data'

  /**
   * Store 상태 저장
   */
  static async saveState(collections: Collection[]): Promise<void> {
    await chrome.storage.local.set({
      [this.STORAGE_KEY]: JSON.stringify(collections),
    })
  }

  /**
   * Store 상태 로드
   */
  static async loadState(): Promise<Collection[]> {
    const result = await chrome.storage.local.get(this.STORAGE_KEY)
    const data = result[this.STORAGE_KEY]

    if (data) {
      return JSON.parse(data)
    }

    return []
  }

  /**
   * Store 변화 감지 및 자동 저장
   */
  static watchStore(store: ReturnType<typeof useFileSystemStore>): void {
    store.$subscribe(() => {
      this.saveState(store.collections)
    })
  }
}
```

**`main.ts` 수정**

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { ChromeStorageService } from './services/ChromeStorageService'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Chrome Extension 환경에서 데이터 복원
if (typeof chrome !== 'undefined' && chrome.storage) {
  const store = useFileSystemStore()

  ChromeStorageService.loadState().then((collections) => {
    collections.forEach((col) => {
      const newCol = store.createCollection(col.passage)
      col.children.forEach((item) => {
        store.addDocument(newCol.id, item.passage, item.tags)
      })
    })
  })

  // 자동 저장 감시
  ChromeStorageService.watchStore(store)
}

app.mount('#app')
```

---

## 🎨 UI 조정

### Extension Popup 크기

**`index.html` 또는 `App.vue` 수정**

```vue
<style>
#app {
  width: 400px; /* Extension popup 권장 너비 */
  height: 600px; /* Extension popup 권장 높이 */
  overflow-y: auto;
}
</style>
```

### 반응형 조정

- 작은 화면에 맞게 폰트 크기, 패딩 조정
- Collections 간격 축소
- ToolBar 아이콘 크기 조정

---

## 📦 빌드 & 배포

### 1. 빌드

```bash
npm run build
```

생성물: `dist/` 폴더

### 2. Chrome에 로드

1. Chrome → `chrome://extensions/`
2. "개발자 모드" 활성화
3. "압축해제된 확장 프로그램을 로드합니다" 클릭
4. `dist/` 폴더 선택

### 3. 테스트

- Extension 아이콘 클릭 → Popup 표시 확인
- 북마크 추가/삭제 → Chrome 북마크와 동기화 확인
- 링크 클릭 → 새 탭 열기 확인

---

## ✅ 체크리스트

### 필수 작업

- [ ] `manifest.json` 생성
- [ ] Vite 설정 수정 (@crxjs/vite-plugin)
- [ ] Chrome Bookmarks API 연동
- [ ] Chrome Tabs API 연동 (링크 열기)
- [ ] Chrome Storage API 연동 (데이터 영속성)
- [ ] 파비콘 로딩 구현
- [ ] Popup 크기 조정 (400x600)

### 선택 작업

- [ ] Context Menu 추가 (우클릭 → 북마크 추가)
- [ ] 단축키 설정 (Commands API)
- [ ] Omnibox 통합 (주소창 검색)
- [ ] Background Service Worker (동기화)
- [ ] Options Page (설정 페이지)

---

## 🚨 주의사항

### 1. Chrome API 가용성 체크

모든 Chrome API 호출 전에 환경 체크:

```typescript
if (typeof chrome !== 'undefined' && chrome.bookmarks) {
  // Chrome Extension 환경
} else {
  // 일반 웹 환경 (개발 서버)
}
```

### 2. Content Security Policy

`manifest.json`에서 CSP 설정:

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### 3. 비동기 처리

Chrome API는 모두 비동기 (Promise 기반):

```typescript
// ❌ 잘못된 예
const bookmarks = chrome.bookmarks.getTree()

// ✅ 올바른 예
const bookmarks = await chrome.bookmarks.getTree()
```

### 4. 권한 요청

`manifest.json`의 `permissions`에 명시된 권한만 사용 가능

---

## 📚 참고 자료

- [Chrome Extension 공식 문서](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 마이그레이션](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Bookmarks API](https://developer.chrome.com/docs/extensions/reference/bookmarks/)
- [Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
- [@crxjs/vite-plugin](https://crxjs.dev/vite-plugin/)

---

## 💡 다음 단계 제안

1. **Phase 1**: Chrome API 기본 연동
   - Bookmarks, Tabs, Storage API

2. **Phase 2**: 고급 기능
   - Context Menu
   - Keyboard Shortcuts
   - Background Sync

3. **Phase 3**: UX 개선
   - 드래그 앤 드롭
   - 북마크 import/export
   - 테마 설정

4. **Phase 4**: 배포
   - Chrome Web Store 등록
   - 사용자 피드백 수집
   - 버그 수정 및 개선

---

**작성일**: 2025년 9월 30일  
**버전**: 1.0.0
