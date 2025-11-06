# Clerk + Convex 통합 계획

## 📋 개요

이 문서는 `vue-convex-clerk-auth` 예제 프로젝트의 인증 시스템을 현재 PageLink-client 프로젝트에 통합하는 계획을 설명합니다.

**목표**: Clerk와 Convex를 통합하여 실시간 데이터 동기화 및 백엔드 데이터베이스 기능을 추가합니다.

---

## 🔍 현재 상태 분석

### 현재 프로젝트 (PageLink-client)

#### 이미 구현된 것 ✅

- **Clerk 인증**: `@clerk/vue` (v1.14.7) 설치 및 기본 설정 완료
- **로그인 UI**: `LoginPage.vue`에 소셜 로그인 및 이메일/비밀번호 로그인 구현
- **인증 관리**: `Account.vue`에서 로그인/마이페이지 전환 로직
- **상태 관리**: Pinia stores (`DataComponents.ts`)로 로컬 데이터 관리
- **데이터 구조**: 북마크, 컬렉션, 댓글 시스템

#### 부족한 것 ❌

- **Convex 통합**: 백엔드 데이터베이스 없음 (샘플 데이터만 사용)
- **실시간 동기화**: 데이터가 로컬에만 저장됨
- **Clerk-Convex 연동**: JWT 토큰을 사용한 백엔드 인증 없음
- **사용자 데이터 영속성**: 새로고침 시 데이터 손실

### 예제 프로젝트 (vue-convex-clerk-auth)

#### 제공하는 기능 ✨

- **ConvexProvider**: Clerk와 Convex 간 인증 동기화
- **실시간 데이터베이스**: Convex를 통한 데이터 영속성
- **JWT 인증**: Clerk 토큰을 사용한 Convex 인증
- **사용자 관리**: `users.ts`에서 CRUD 작업
- **자동 동기화**: 사용자 상태 변경 시 자동 업데이트

---

## 🎯 통합 목표

### Phase 1: Convex 백엔드 설정 (필수)

1. Convex 계정 생성 및 프로젝트 초기화
2. 데이터베이스 스키마 설계 (북마크, 컬렉션, 댓글)
3. Convex 함수 작성 (CRUD 작업)
4. Clerk JWT 템플릿 설정

### Phase 2: 프론트엔드 통합 (핵심)

1. `convex` 및 `convex-vue` 패키지 설치
2. `ConvexProvider` 컴포넌트 추가
3. Pinia stores를 Convex 쿼리/뮤테이션으로 마이그레이션
4. 인증 플로우 업데이트

### Phase 3: 기능 개선 (선택)

1. 실시간 동기화 기능 활성화
2. 오프라인 지원 추가
3. 데이터 캐싱 최적화
4. 에러 처리 개선

---

## 📦 필요한 패키지

### 추가 설치

```json
{
  "dependencies": {
    "convex": "^1.26.2",
    "convex-vue": "^0.1.5"
  }
}
```

### 현재 패키지 (유지)

- `@clerk/vue`: ^1.14.7 ✅
- `pinia`: ^3.0.3 (일부 로컬 상태 관리에 계속 사용)
- `vue`: ^3.5.18 ✅

---

## 📁 파일 구조 변경

### 새로 추가될 파일

```
PageLink-client/
├── convex/                          # 🆕 Convex 백엔드
│   ├── _generated/                 # 자동 생성 (Convex CLI)
│   ├── auth.config.js              # Clerk 인증 설정
│   ├── schema.ts                   # 데이터베이스 스키마
│   ├── bookmarks.ts                # 북마크 CRUD 함수
│   ├── collections.ts              # 컬렉션 CRUD 함수
│   ├── comments.ts                 # 댓글 CRUD 함수
│   └── users.ts                    # 사용자 관리 함수
├── src/
│   ├── components/
│   │   └── convex-provider/        # 🆕 Convex 통합 컴포넌트
│   │       ├── ConvexProvider.vue  # Clerk-Convex 동기화
│   │       └── LoadingSpinner.vue  # 로딩 UI (옵션)
│   └── composables/                # 🆕 Vue 컴포저블
│       ├── useConvexAuth.ts        # 인증 헬퍼
│       ├── useBookmarks.ts         # 북마크 쿼리/뮤테이션
│       └── useComments.ts          # 댓글 쿼리/뮤테이션
```

### 수정될 파일

```
src/
├── main.ts                          # Convex 플러그인 추가
├── App.vue                          # ConvexProvider 래핑
├── stores/
│   └── DataComponents.ts           # Convex 쿼리로 마이그레이션
└── components/
    ├── bookmark-page/
    │   ├── BookmarkPage.vue        # Convex 훅 사용
    │   └── Collections.vue         # Convex 데이터 연동
    └── auth-settings-page/
        └── LoginPage.vue           # Convex 사용자 동기화
```

---

## 🔧 구현 단계

### Step 1: Convex 프로젝트 설정

#### 1.1 Convex 계정 및 프로젝트 생성

```bash
# Convex CLI 설치
npm install -g convex

# Convex 프로젝트 초기화
cd /Users/deliciouscat/projects/PageLink-client
npx convex dev
```

#### 1.2 환경 변수 추가

`.env` 파일 업데이트:

```env
# 기존 Clerk 설정 (유지)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# 🆕 Convex 설정
VITE_CONVEX_URL=https://your-project.convex.cloud
CLERK_JWT_ISSUER_DOMAIN=https://clerk.your-domain.com
```

#### 1.3 Clerk JWT 템플릿 설정

1. [Clerk Dashboard](https://dashboard.clerk.com) 접속
2. **JWT Templates** → **New template**
3. **Convex** 사전 구축 템플릿 선택
4. **applicationID**: `convex` 입력
5. **Save** 및 **Apply changes**

---

### Step 2: Convex 스키마 설계

#### 2.1 `convex/schema.ts`

```typescript
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  // 사용자 테이블
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_clerk_id', ['clerkId']),

  // 컬렉션 테이블
  collections: defineTable({
    userId: v.id('users'),
    title: v.string(),
    icon: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_user', ['userId']),

  // 북마크 테이블
  bookmarks: defineTable({
    userId: v.id('users'),
    collectionId: v.id('collections'),
    url: v.string(),
    title: v.string(),
    favicon: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_collection', ['collectionId']),

  // 댓글 테이블
  comments: defineTable({
    userId: v.id('users'),
    bookmarkId: v.id('bookmarks'),
    content: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_bookmark', ['bookmarkId']),
})
```

#### 2.2 `convex/auth.config.js`

```javascript
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: 'convex',
    },
  ],
}
```

---

### Step 3: Convex 함수 구현

#### 3.1 `convex/users.ts`

예제 프로젝트의 `users.ts`를 그대로 복사하여 사용합니다.

#### 3.2 `convex/collections.ts`

```typescript
import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

// 컬렉션 목록 조회
export const getCollections = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first()

    if (!user) return []

    return await ctx.db
      .query('collections')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect()
  },
})

// 컬렉션 생성
export const createCollection = mutation({
  args: {
    title: v.string(),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first()

    if (!user) throw new Error('User not found')

    const now = Date.now()
    return await ctx.db.insert('collections', {
      userId: user._id,
      title: args.title,
      icon: args.icon,
      createdAt: now,
      updatedAt: now,
    })
  },
})

// 추가 CRUD 함수들...
```

#### 3.3 `convex/bookmarks.ts`, `convex/comments.ts`

유사한 패턴으로 북마크 및 댓글 CRUD 함수 구현

---

### Step 4: 프론트엔드 통합

#### 4.1 패키지 설치

```bash
npm install convex convex-vue
```

#### 4.2 `src/main.ts` 수정

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { clerkPlugin } from '@clerk/vue'
import { convexVue } from 'convex-vue' // 🆕
import App from './App.vue'
import i18n from './i18n'
import './styles/color_template.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL // 🆕

const app = createApp(App)

app.use(createPinia())
app.use(i18n)

// Clerk 플러그인
if (PUBLISHABLE_KEY) {
  app.use(clerkPlugin, {
    publishableKey: PUBLISHABLE_KEY,
  })
}

// 🆕 Convex 플러그인
if (CONVEX_URL) {
  app.use(convexVue, {
    url: CONVEX_URL,
  })
}

app.mount('#app')
```

#### 4.3 `ConvexProvider.vue` 생성

예제 프로젝트의 `ConvexProvider.vue`를 `src/components/convex-provider/`에 복사합니다.

#### 4.4 `App.vue` 수정

```vue
<template>
  <div id="app">
    <!-- 🆕 ConvexProvider로 래핑 -->
    <ConvexProvider v-if="user">
      <AppHeader
        @display-mode-change="handleDisplayModeChange"
        @toolbar-operation="handleToolbarOperation"
      />
      <main class="main-content">
        <BookmarkPage v-if="currentMode === 'bookmark'" />
        <ExplorePage v-else-if="currentMode === 'explore'" />
        <Account v-else-if="currentMode === 'account'" />
      </main>
    </ConvexProvider>

    <!-- 로그인 전 UI -->
    <div v-else>
      <AppHeader
        @display-mode-change="handleDisplayModeChange"
        @toolbar-operation="handleToolbarOperation"
      />
      <main class="main-content">
        <Account />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useClerk, useUser } from '@clerk/vue' // 🆕 useUser 추가
import ConvexProvider from '@/components/convex-provider/ConvexProvider.vue' // 🆕
// ... 나머지 imports

const { user } = useUser() // 🆕
// ... 나머지 코드
</script>
```

---

### Step 5: Pinia Store 마이그레이션

#### 5.1 Composables 생성

`src/composables/useBookmarks.ts`:

```typescript
import { useConvexQuery, useConvexMutation } from 'convex-vue'
import { api } from '../../convex/_generated/api'

export function useBookmarks() {
  // 북마크 목록 조회 (실시간)
  const bookmarks = useConvexQuery(api.bookmarks.getBookmarks)

  // 북마크 생성
  const { mutate: createBookmark } = useConvexMutation(api.bookmarks.createBookmark)

  // 북마크 삭제
  const { mutate: deleteBookmark } = useConvexMutation(api.bookmarks.deleteBookmark)

  return {
    bookmarks,
    createBookmark,
    deleteBookmark,
  }
}
```

#### 5.2 컴포넌트에서 사용

`src/components/bookmark-page/Collections.vue`:

```vue
<script setup lang="ts">
import { useBookmarks } from '@/composables/useBookmarks'

// 🆕 Convex 쿼리 사용 (실시간)
const { bookmarks, createBookmark } = useBookmarks()

// 기존 Pinia store 제거
// const fileSystemStore = useFileSystemStore() ❌
</script>
```

---

## 🔄 마이그레이션 전략

### 점진적 마이그레이션 (권장)

#### Phase A: 사용자 인증만 통합

1. ConvexProvider 추가
2. 사용자 데이터만 Convex에 동기화
3. 북마크/댓글은 기존 Pinia store 유지

#### Phase B: 북마크 데이터 통합

1. 북마크 스키마 및 함수 구현
2. BookmarkPage에서 Convex 쿼리 사용
3. 기존 샘플 데이터를 Convex로 마이그레이션

#### Phase C: 댓글 데이터 통합

1. 댓글 스키마 및 함수 구현
2. CommentBox에서 Convex 쿼리 사용
3. 실시간 댓글 동기화 활성화

#### Phase D: 최적화

1. 오프라인 지원 추가
2. 낙관적 업데이트 구현
3. 캐싱 전략 개선

---

## ⚠️ 주의사항

### 1. 인증 플로우

- **현재**: `LoginPage.vue`에서 직접 Clerk 로그인 처리
- **변경 후**: 로그인 성공 시 ConvexProvider가 자동으로 사용자 데이터 동기화
- **호환성**: 기존 로그인 UI는 그대로 유지 가능 ✅

### 2. 데이터 마이그레이션

- **샘플 데이터**: `sampleData.json`, `sampleComments.json`을 Convex로 수동 이관
- **방법**: 일회성 마이그레이션 스크립트 작성 또는 초기 데이터 생성 함수 구현

### 3. 타입 안전성

- Convex 함수는 자동으로 타입 생성 (`convex/_generated/`)
- Vue 컴포넌트에서 타입 안전하게 사용 가능
- `api.bookmarks.getBookmarks` 형태로 자동 완성 지원

### 4. 실시간 동기화

- `useConvexQuery`는 자동으로 실시간 구독
- 다른 클라이언트의 변경사항이 즉시 반영됨
- 네트워크 상태에 따라 로딩 상태 처리 필요

---

## 📊 통합 후 아키텍처

```
┌──────────────────────────────────────────────────────────┐
│                     Vue 3 Frontend                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  App.vue                                                 │
│    │                                                     │
│    └── ConvexProvider (인증 동기화)                      │
│          │                                               │
│          ├── AppHeader                                   │
│          │     └── ToolBar                               │
│          │                                               │
│          └── Main Content                                │
│                ├── BookmarkPage                          │
│                │     └── Collections (useBookmarks)      │
│                │           └── CommentBox (useComments)  │
│                │                                         │
│                ├── ExplorePage                           │
│                └── Account (LoginPage/MyPage)            │
│                                                          │
└───────────────────┬──────────────────┬───────────────────┘
                    │                  │
          ┌─────────▼──────────┐  ┌────▼──────────────┐
          │   Clerk Auth       │  │  Convex Backend   │
          ├────────────────────┤  ├───────────────────┤
          │ • JWT 토큰 발급    │  │ • 실시간 DB       │
          │ • 사용자 관리      │◄─┤ • JWT 검증        │
          │ • OAuth 플로우     │  │ • CRUD 함수       │
          └────────────────────┘  └───────────────────┘
```

---

## 🎯 예상 효과

### 기능적 개선

- ✅ **데이터 영속성**: 새로고침 후에도 데이터 유지
- ✅ **실시간 동기화**: 다른 기기/탭에서도 즉시 반영
- ✅ **백엔드 인증**: JWT 기반 안전한 API 호출
- ✅ **확장 가능성**: 추가 기능 구현 용이

### 기술적 개선

- ✅ **타입 안전성**: 자동 생성된 타입으로 개발 경험 개선
- ✅ **실시간 쿼리**: 수동 새로고침 불필요
- ✅ **백엔드 로직**: 클라이언트 로직을 서버로 이동 가능
- ✅ **스케일링**: Convex의 자동 스케일링

### 개발 경험

- ✅ **Hot Module Reload**: Convex 함수 변경 시 자동 반영
- ✅ **실시간 테스트**: 여러 탭에서 동시 테스트 가능
- ✅ **자동 타입**: TypeScript 타입 자동 생성
- ✅ **개발 속도**: 백엔드 인프라 구축 불필요

---

## 📝 체크리스트

### 준비 단계

- [ ] Convex 계정 생성 (https://convex.dev)
- [ ] Clerk JWT 템플릿 설정 (Convex 템플릿)
- [ ] 환경 변수 준비 (`VITE_CONVEX_URL`, `CLERK_JWT_ISSUER_DOMAIN`)

### 백엔드 구현

- [ ] `convex/schema.ts` 작성
- [ ] `convex/auth.config.js` 설정
- [ ] `convex/users.ts` 구현
- [ ] `convex/collections.ts` 구현
- [ ] `convex/bookmarks.ts` 구현
- [ ] `convex/comments.ts` 구현
- [ ] `npx convex dev` 실행 및 배포 확인

### 프론트엔드 통합

- [ ] `convex`, `convex-vue` 패키지 설치
- [ ] `main.ts`에 convexVue 플러그인 추가
- [ ] `ConvexProvider.vue` 컴포넌트 생성
- [ ] `App.vue`에 ConvexProvider 래핑
- [ ] `useBookmarks.ts` composable 작성
- [ ] `useComments.ts` composable 작성

### 데이터 마이그레이션

- [ ] 샘플 데이터를 Convex로 이관
- [ ] 기존 Pinia store 제거 또는 로컬 상태로 전환
- [ ] 각 컴포넌트에서 Convex 쿼리로 전환

### 테스트

- [ ] 로그인/로그아웃 플로우 테스트
- [ ] 북마크 생성/수정/삭제 테스트
- [ ] 댓글 생성/수정/삭제 테스트
- [ ] 실시간 동기화 테스트 (여러 탭)
- [ ] 에러 처리 테스트

---

## 🚀 다음 단계

1. **Convex 계정 생성 및 프로젝트 초기화**

   ```bash
   npx convex dev
   ```

2. **Clerk JWT 템플릿 설정**
   - Clerk Dashboard에서 Convex 템플릿 추가

3. **백엔드 스키마 작성**
   - `convex/schema.ts` 구현

4. **프론트엔드 통합**
   - 패키지 설치 및 ConvexProvider 추가

5. **점진적 마이그레이션**
   - Phase A → Phase B → Phase C → Phase D

---

## 📚 참고 자료

- **예제 프로젝트**: `/Users/deliciouscat/projects/vue-convex-clerk-auth/`
- **Convex 문서**: https://docs.convex.dev/
- **Clerk 문서**: https://clerk.com/docs
- **convex-vue 문서**: https://github.com/get-convex/convex-vue

---

**작성일**: 2025-11-06  
**버전**: 1.0  
**상태**: 계획 단계
