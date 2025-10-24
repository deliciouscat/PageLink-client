# Clerk 인증 설정 가이드

이 문서는 PageLink 프로젝트에 Clerk 인증을 설정하는 방법을 설명합니다.

## 1. Clerk 계정 생성 및 프로젝트 설정

1. [Clerk Dashboard](https://dashboard.clerk.com)에 접속하여 계정을 생성합니다.
2. 새 애플리케이션을 생성합니다.
3. Dashboard에서 **Publishable Key**를 복사합니다.

## 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가합니다:

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
```

**주의:** `.env` 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다.

## 3. 구현된 기능

### 컴포넌트 구조

```
App.vue
├── AppHeader.vue
│   └── Account 버튼 (accountMenuDisplay)
└── Main Content (currentMode에 따라)
    ├── BookmarkPage (mode: 'bookmark')
    ├── ExplorePage (mode: 'explore')
    └── Account.vue (mode: 'account')
        ├── SignedIn → MyPage.vue
        └── SignedOut → LoginPage.vue
            └── SignupTermsModal.vue (Modal)
```

### 주요 컴포넌트

#### 1. **Account.vue**

- 로그인 상태에 따라 `MyPage` 또는 `LoginPage` 표시
- Clerk의 `<SignedIn>`, `<SignedOut>` 컴포넌트 사용
- AppHeader 하단 메인 페이지 영역에 표시 (BookmarkPage, ExplorePage와 동일한 위치)

#### 2. **LoginPage.vue**

- 이메일/비밀번호 로그인 폼
- Clerk의 `useSignIn` composable 사용
- 회원가입 버튼 클릭 시 약관 모달 표시

#### 3. **MyPage.vue**

- 로그인한 유저의 정보 표시
- Clerk의 `useUser`, `useAuth` composable 사용
- 프로필 이미지, 이름, 이메일 표시
- 로그아웃 버튼

#### 4. **SignupTermsModal.vue**

- 회원가입 시 서비스 이용약관 표시
- 마크다운 파일(`terms_of_service.md`)을 렌더링
- 동의/거부 버튼

### 데이터 흐름

```
사용자가 Account 버튼 클릭
    ↓
AppHeader.accountMenuDisplay()
    ↓
displayMode.currentMode = 'account'
displayMode.swapTo = 'bookmark'
    ↓
emit('displayModeChange', { currentMode: 'account' })
    ↓
App.handleDisplayModeChange()
    ↓
currentMode.value = 'account'
    ↓
<Account v-if="currentMode === 'account'" />
    ↓
useAuth()로 로그인 상태 확인
    ↓
┌─────────────────────────────┬─────────────────────────────┐
│ SignedOut (로그아웃)         │ SignedIn (로그인)            │
├─────────────────────────────┼─────────────────────────────┤
│ <LoginPage />               │ <MyPage />                  │
│ - 이메일/비밀번호 입력       │ - 유저 정보 표시             │
│ - 회원가입 버튼              │ - 로그아웃 버튼              │
└─────────────────────────────┴─────────────────────────────┘
```

## 4. 사용된 Clerk Composables

### `useAuth()`

```typescript
const { isSignedIn, isLoaded, userId, signOut } = useAuth()
```

- `isSignedIn`: 로그인 여부
- `isLoaded`: Clerk 초기화 완료 여부
- `userId`: 현재 유저 ID
- `signOut`: 로그아웃 함수

### `useUser()`

```typescript
const { user, isLoaded } = useUser()
```

- `user`: 유저 객체 (firstName, lastName, emailAddresses, imageUrl 등)
- `isLoaded`: 유저 정보 로드 완료 여부

### `useSignIn()`

```typescript
const { signIn, isLoaded, setActive } = useSignIn()
```

- `signIn`: 로그인 객체 (create 메서드로 로그인 시도)
- `setActive`: 세션 활성화 함수

### `useSignUp()`

```typescript
const { signUp, isLoaded, setActive } = useSignUp()
```

- `signUp`: 회원가입 객체
- `setActive`: 세션 활성화 함수

## 5. 커스터마이징

### 스타일 커스터마이징

Clerk 컴포넌트의 스타일은 `appearance` prop으로 커스터마이징할 수 있습니다:

```typescript
<UserButton
  :appearance="{
    elements: {
      rootBox: { width: '100%' },
      userButtonBox: { flexDirection: 'row-reverse' }
    },
    variables: {
      colorPrimary: 'var(--main)',
      colorBackground: 'var(--background)'
    }
  }"
/>
```

### 리다이렉트 설정

`main.ts`에서 로그인/회원가입 후 리다이렉트 URL을 설정할 수 있습니다:

```typescript
app.use(clerkPlugin, {
  publishableKey: PUBLISHABLE_KEY,
  signInForceRedirectUrl: '/dashboard',
  signUpForceRedirectUrl: '/onboarding',
})
```

## 6. 개발 모드 실행

```bash
npm run dev
```

Clerk Publishable Key가 설정되지 않은 경우 콘솔에 경고 메시지가 표시되지만, 앱은 정상적으로 실행됩니다.

## 7. 추가 구현 필요 사항

- [ ] 비밀번호 재설정 플로우
- [ ] 회원가입 약관 동의 후 실제 회원가입 폼
- [ ] 소셜 로그인 (Google, Facebook 등)
- [ ] 2FA (Two-Factor Authentication)
- [ ] Settings 오버레이 구현

## 8. 참고 자료

- [Clerk Vue Documentation](https://clerk.com/docs/quickstarts/vue)
- [Clerk Customization Guide](https://clerk.com/blog/how-we-roll-customization)
- [Clerk Components Reference](https://clerk.com/docs/components/overview)
