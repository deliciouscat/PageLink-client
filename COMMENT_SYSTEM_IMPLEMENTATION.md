# 댓글 시스템 구현 완료

## 개요

북마크 관리 크롬 익스텐션 프로젝트에 현재 보고 있는 페이지(Document)에 댓글을 달 수 있는 시스템을 구현했습니다.

## 구현된 기능

### 1. 댓글 데이터 관리 (DataComponents.ts)

- **Comment 인터페이스**: 댓글 데이터 구조 정의
  - `id`: 고유 식별자
  - `nametag`: 작성자 정보 (닉네임 • 칭호)
  - `content`: 댓글 내용 (Markdown 및 KaTeX 지원)
  - `createdAt`: 작성 시간

- **useCommentsStore**: Pinia 스토어로 댓글 관리
  - URL별로 댓글 저장 (Map<string, Comment[]>)
  - 현재 사용자 정보 관리
  - 댓글 추가/삭제 기능
  - 샘플 댓글 데이터 생성

### 2. CommentBox 컴포넌트

개별 댓글을 표시하는 컴포넌트

**주요 기능:**

- 축소/확장 상태 관리
- Markdown 렌더링 (marked 라이브러리)
- KaTeX 수식 렌더링
  - 인라인 수식: `\(...\)`
  - 블록 수식: `\[...\]`
- 축소 상태: 2줄 미리보기 + 그라데이션 효과
- 확장 상태: 전체 내용 + 렌더링된 Markdown/KaTeX

**Props:**

- `nametag`: 작성자 정보
- `content`: 댓글 내용
- `commentId`: 댓글 ID
- `isExpanded`: 확장 상태

**Events:**

- `expand`: 댓글 확장/축소 요청

### 3. BottomSheet 컴포넌트

댓글 목록과 작성 UI를 포함하는 메인 컨테이너

**주요 기능:**

- 현재 URL의 댓글 목록 표시
- 댓글 작성 모드 전환
- 댓글 확장/축소 관리 (한 번에 하나만 확장)
- 바깥 영역 클릭 시 모든 댓글 축소
- 동적 높이 계산 (댓글 개수에 따라 조정)

**Props:**

- `currentUrl`: 현재 페이지 URL

**로컬 상태:**

- `expandedCommentId`: 현재 확장된 댓글 ID
- `isWriting`: 댓글 작성 모드 여부
- `commentInput`: 댓글 입력 내용

### 4. BookmarkPage 통합

- BottomSheet 컴포넌트 추가
- 현재 탭의 URL 자동 감지
  - 크롬 익스텐션 환경: `chrome.tabs.query()` 사용
  - 개발 환경: `window.location.href` 사용

### 5. 샘플 데이터

다음 도메인에 샘플 댓글이 자동으로 생성됩니다:

#### http://localhost:5173/

- 개발자A (프론트엔드): Vue 3 코드 구조 칭찬
- 디자이너B (UX/UI): 색상 조합 피드백 + 개선 제안 (Markdown)
- 개발자C (백엔드): API 연동 가이드 (코드 블록 포함)

#### https://www.naver.com/

- 사용자D (일반): 네이버 메인 페이지 평가
- 마케터E (디지털 마케팅): SEO 전략 + 링크 (Markdown)

#### https://www.google.com/

- 연구원F (AI/ML): Gemini 모델 소개 + KaTeX 수식
- 개발자G (풀스택): Google Cloud Platform 활용 팁
- 학생H (컴퓨터공학): 구글 검색 팁 (리스트)

## 설치된 라이브러리

```bash
npm install marked katex
npm install --save-dev @types/chrome
```

- **marked**: Markdown 파싱 및 렌더링
- **katex**: 수학 수식 렌더링
- **@types/chrome**: Chrome Extension API 타입 정의

## 사용 방법

### 1. 샘플 데이터 초기화

앱 시작 시 자동으로 샘플 댓글이 생성됩니다 (App.vue의 onMounted).

```typescript
// App.vue에서 자동 실행
commentsStore.generateSampleComments()
```

### 2. 댓글 보기

1. BookmarkPage로 이동
2. 하단의 BottomSheet에서 현재 URL의 댓글 확인
3. 댓글 클릭하여 확장/축소

### 3. 댓글 작성

1. 연필 아이콘 클릭
2. 댓글 입력 (Markdown 및 KaTeX 지원)
3. 전송 버튼 클릭

### 4. Markdown 및 KaTeX 사용 예시

**Markdown:**

```markdown
# 제목

**굵게** _기울임_

- 리스트 항목
  [링크](https://example.com)
```

**KaTeX 인라인 수식:**

```
이차방정식의 해: \(x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}\)
```

**KaTeX 블록 수식:**

```
\[
E = mc^2
\]
```

## 파일 구조

```
src/
├── stores/
│   └── DataComponents.ts          # 댓글 스토어 추가
├── components/
│   └── bookmark-page/
│       ├── BookmarkPage.vue       # BottomSheet 통합
│       └── bottom-sheet/
│           ├── BottomSheet.vue    # 댓글 메인 컨테이너
│           └── CommentBox.vue     # 개별 댓글 컴포넌트
├── App.vue                        # 샘플 데이터 초기화
└── env.d.ts                       # Chrome types 추가
```

## 주요 특징

### 1. Local Storage 기반

- 현재는 메모리에만 저장 (새로고침 시 초기화)
- 향후 Chrome Storage API로 영구 저장 가능

### 2. URL별 댓글 관리

- Map<string, Comment[]> 구조로 URL별로 댓글 분리
- 현재 탭의 URL에 해당하는 댓글만 표시

### 3. 반응형 UI

- 댓글 개수에 따라 높이 자동 조정
- 최소 200px, 최대 화면의 75%
- 스크롤 가능한 댓글 목록

### 4. 사용자 경험

- 한 번에 하나의 댓글만 확장
- 바깥 클릭 시 모든 댓글 축소
- 부드러운 애니메이션 효과
- Hover 상태 피드백

## 향후 개선 사항

1. **영구 저장**: Chrome Storage API 연동
2. **서버 동기화**: 백엔드 API 연동
3. **댓글 수정/삭제**: UI 및 기능 추가
4. **댓글 정렬**: 최신순/오래된순 정렬
5. **댓글 검색**: 특정 키워드로 댓글 검색
6. **알림**: 새 댓글 알림 기능
7. **프로필**: 사용자 프로필 관리
8. **좋아요/답글**: 소셜 기능 추가

## 테스트 방법

1. 개발 서버 실행:

```bash
npm run dev
```

2. 브라우저에서 다음 URL 접속:
   - http://localhost:5173/ (3개 댓글)
   - https://www.naver.com/ (2개 댓글)
   - https://www.google.com/ (3개 댓글)

3. BottomSheet에서 댓글 확인 및 작성 테스트

## 기술 스택

- **Vue 3**: Composition API
- **TypeScript**: 타입 안정성
- **Pinia**: 상태 관리
- **Marked**: Markdown 렌더링
- **KaTeX**: 수식 렌더링
- **Phosphor Icons**: 아이콘
- **Chrome Extension API**: 탭 정보 접근

## 구현 완료 체크리스트

- [x] 댓글 데이터 구조 설계
- [x] Pinia 스토어 구현
- [x] CommentBox 컴포넌트 구현
- [x] BottomSheet 컴포넌트 구현
- [x] BookmarkPage 통합
- [x] Markdown 렌더링
- [x] KaTeX 수식 렌더링
- [x] 샘플 데이터 생성
- [x] Chrome Extension API 연동
- [x] 타입 안정성 확보
- [x] 스타일링 및 애니메이션
