import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// ===========================
// 1. 인터페이스 & 클래스 정의
// ===========================

// FileSystem 인터페이스 정의
interface FileSystem {
  id: string
  passage: string
  visible: boolean
  updateVisible(searchTerm?: string): boolean
}

// ID 생성 헬퍼 함수
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Leaf 타입을 명시하기 위한 추상 클래스
abstract class LeafNode implements FileSystem {
  id: string
  passage: string
  visible: boolean
  createdAt: Date

  constructor(passage: string) {
    this.id = generateId()
    this.passage = passage
    this.visible = true
    this.createdAt = new Date()
  }

  updateVisible(searchTerm?: string): boolean {
    if (!searchTerm || searchTerm.trim() === '') {
      this.visible = true
    } else {
      this.visible = this.passage.toLowerCase().includes(searchTerm.toLowerCase())
    }
    return this.visible
  }
}

// Document 클래스
export class Document extends LeafNode {
  tags: string[]

  constructor(passage: string, tags: string[] = []) {
    super(passage)
    this.tags = tags
  }
}

// Collection 클래스 (Leaf만 허용)
export class Collection implements FileSystem {
  id: string
  passage: string
  visible: boolean
  children: LeafNode[]
  createdAt: Date

  constructor(passage: string) {
    this.id = generateId()
    this.passage = passage
    this.visible = true
    this.children = []
    this.createdAt = new Date()
  }

  addItem(item: LeafNode): void {
    this.children.push(item)
  }

  removeItem(item: LeafNode): void {
    const index = this.children.indexOf(item)
    if (index > -1) {
      this.children.splice(index, 1)
    }
  }

  removeItemById(id: string): boolean {
    const index = this.children.findIndex((child) => child.id === id)
    if (index > -1) {
      this.children.splice(index, 1)
      return true
    }
    return false
  }

  updateVisible(searchTerm?: string): boolean {
    if (!searchTerm || searchTerm.trim() === '') {
      this.visible = true
      this.children.forEach((child) => child.updateVisible())
      return this.visible
    }

    const selfMatches = this.passage.toLowerCase().includes(searchTerm.toLowerCase())
    const hasVisibleChildren = this.children.some((child) => child.updateVisible(searchTerm))

    this.visible = selfMatches || hasVisibleChildren
    return this.visible
  }

  getVisibleChildren(): LeafNode[] {
    return this.children.filter((child) => child.visible)
  }

  // 특정 타입의 아이템만 가져오기
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getItemsByType<T extends LeafNode>(type: new (...args: any[]) => T): T[] {
    return this.children.filter((child) => child instanceof type) as T[]
  }

  // 모든 아이템 개수 (타입별)
  getItemCounts(): { documents: number; total: number } {
    return {
      documents: this.getItemsByType(Document).length,
      total: this.children.length,
    }
  }
}

// ===========================
// 2. Pinia Store 정의
// ===========================

export const useFileSystemStore = defineStore('fileSystem', () => {
  // State
  const collections = ref<Collection[]>([])
  const searchTerm = ref('')
  const isSearching = ref(false)
  const selectedCollectionId = ref<string | null>(null)
  const selectedItemId = ref<string | null>(null)

  // Computed
  const visibleCollections = computed(() => {
    return collections.value.filter((col) => col.visible)
  })

  const selectedCollection = computed(() => {
    if (!selectedCollectionId.value) return null
    return collections.value.find((col) => col.id === selectedCollectionId.value)
  })

  const totalItemCount = computed(() => {
    return collections.value.reduce((total, col) => total + col.children.length, 0)
  })

  const visibleItemCount = computed(() => {
    return collections.value.reduce((total, col) => {
      return total + col.getVisibleChildren().length
    }, 0)
  })

  const allItemCounts = computed(() => {
    const counts = { documents: 0, total: 0 }
    collections.value.forEach((col) => {
      const colCounts = col.getItemCounts()
      counts.documents += colCounts.documents
      counts.total += colCounts.total
    })
    return counts
  })

  // Actions - Collection 관리
  function createCollection(name: string): Collection {
    const collection = new Collection(name)
    collections.value.push(collection)
    return collection
  }

  function removeCollection(collectionId: string): boolean {
    const index = collections.value.findIndex((col) => col.id === collectionId)
    if (index > -1) {
      collections.value.splice(index, 1)
      if (selectedCollectionId.value === collectionId) {
        selectedCollectionId.value = null
      }
      return true
    }
    return false
  }

  function selectCollection(collectionId: string | null): void {
    selectedCollectionId.value = collectionId
    selectedItemId.value = null // 컬렉션 변경 시 아이템 선택 초기화
  }

  // Actions - Item 관리
  function addDocument(
    collectionId: string,
    passage: string,
    tags: string[] = [],
  ): Document | null {
    const collection = collections.value.find((col) => col.id === collectionId)
    if (collection) {
      const doc = new Document(passage, tags)
      collection.addItem(doc)
      // 현재 검색 중이면 visible 상태 업데이트
      if (searchTerm.value) {
        doc.updateVisible(searchTerm.value)
      }
      return doc
    }
    return null
  }

  function addItem(collectionId: string, item: LeafNode): boolean {
    const collection = collections.value.find((col) => col.id === collectionId)
    if (collection) {
      collection.addItem(item)
      // 현재 검색 중이면 visible 상태 업데이트
      if (searchTerm.value) {
        item.updateVisible(searchTerm.value)
      }
      return true
    }
    return false
  }

  function removeItem(collectionId: string, itemId: string): boolean {
    const collection = collections.value.find((col) => col.id === collectionId)
    if (collection) {
      return collection.removeItemById(itemId)
    }
    return false
  }

  function selectItem(itemId: string | null): void {
    selectedItemId.value = itemId
  }

  // Actions - 검색 기능
  function search(term: string): void {
    searchTerm.value = term
    isSearching.value = term.length > 0

    // 모든 컬렉션과 아이템의 visible 상태 업데이트
    collections.value.forEach((collection) => {
      collection.updateVisible(term)
    })
  }

  function clearSearch(): void {
    searchTerm.value = ''
    isSearching.value = false

    // 모든 항목을 visible로 복원
    collections.value.forEach((collection) => {
      collection.updateVisible('')
    })
  }

  // Actions - 유틸리티
  function getCollectionById(id: string): Collection | undefined {
    return collections.value.find((col) => col.id === id)
  }

  function getItemById(itemId: string): LeafNode | undefined {
    for (const collection of collections.value) {
      const item = collection.children.find((child) => child.id === itemId)
      if (item) return item
    }
    return undefined
  }

  function moveItem(itemId: string, fromCollectionId: string, toCollectionId: string): boolean {
    const fromCollection = getCollectionById(fromCollectionId)
    const toCollection = getCollectionById(toCollectionId)

    if (!fromCollection || !toCollection) return false

    const item = fromCollection.children.find((child) => child.id === itemId)
    if (!item) return false

    fromCollection.removeItemById(itemId)
    toCollection.addItem(item)

    return true
  }

  // Actions - 초기화
  function reset(): void {
    collections.value = []
    searchTerm.value = ''
    isSearching.value = false
    selectedCollectionId.value = null
    selectedItemId.value = null
  }

  // Actions - 샘플 데이터 생성
  function generateSampleData(): void {
    // 컬렉션 생성
    const newsCollection = createCollection('뉴스')
    const techCollection = createCollection('기술 문서')
    const projectCollection = createCollection('프로젝트 문서')

    // 뉴스 컬렉션에 아이템 추가
    addDocument(newsCollection.id, 'Vue 3.4 버전이 릴리즈되었습니다. 성능이 크게 개선되었습니다.', [
      'vue',
      'frontend',
      'news',
    ])
    addDocument(newsCollection.id, 'TypeScript 5.0의 새로운 기능들을 소개합니다.', [
      'typescript',
      'programming',
    ])
    addDocument(newsCollection.id, 'React 19 베타 버전 출시 소식', ['react', 'frontend', 'news'])

    // 기술 문서 컬렉션
    addDocument(techCollection.id, 'Composite Pattern은 트리 구조를 표현하는 디자인 패턴입니다.', [
      'design-pattern',
      'programming',
    ])
    addDocument(techCollection.id, 'Pinia는 Vue 3를 위한 상태 관리 라이브러리입니다.', [
      'vue',
      'state-management',
    ])
    addDocument(techCollection.id, 'Clean Code 원칙과 실천 방법', ['best-practice', 'programming'])

    // 프로젝트 문서 컬렉션
    addDocument(projectCollection.id, 'API 설계 문서 v2.0', ['api', 'backend'])
    addDocument(projectCollection.id, '프론트엔드 컴포넌트 가이드라인', ['frontend', 'guide'])
    addDocument(projectCollection.id, '데이터베이스 스키마 설계서', ['database', 'backend'])
  }

  return {
    // State
    collections,
    searchTerm,
    isSearching,
    selectedCollectionId,
    selectedItemId,

    // Computed
    visibleCollections,
    selectedCollection,
    totalItemCount,
    visibleItemCount,
    allItemCounts,

    // Actions
    createCollection,
    removeCollection,
    selectCollection,
    addDocument,
    addItem,
    removeItem,
    selectItem,
    search,
    clearSearch,
    getCollectionById,
    getItemById,
    moveItem,
    reset,
    generateSampleData,
  }
})

// Type exports for component usage
export type { FileSystem }
export type { LeafNode }

// ===========================
// 3. 댓글 시스템
// ===========================

// Comment 인터페이스
export interface Comment {
  id: string
  nametag: string
  content: string
  createdAt: Date
}

// DocumentComments 인터페이스 (URL별 댓글 관리)
export interface DocumentComments {
  url: string
  comments: Comment[]
}

// 댓글 Store
export const useCommentsStore = defineStore('comments', () => {
  // State: URL별 댓글 저장
  const documentComments = ref<Map<string, Comment[]>>(new Map())

  // 현재 사용자 정보 (임시)
  const currentUser = ref({
    nickname: '사용자',
    epithet: '개발자',
  })

  // Computed: 특정 URL의 댓글 가져오기
  function getComments(url: string): Comment[] {
    return documentComments.value.get(url) || []
  }

  // Computed: 현재 사용자의 nametag
  const currentUserNametag = computed(() => {
    return `${currentUser.value.nickname} • ${currentUser.value.epithet}`
  })

  // Actions: 댓글 추가
  function addComment(url: string, content: string): Comment {
    const comment: Comment = {
      id: generateId(),
      nametag: currentUserNametag.value,
      content,
      createdAt: new Date(),
    }

    const comments = documentComments.value.get(url) || []
    comments.push(comment)
    documentComments.value.set(url, comments)

    return comment
  }

  // Actions: 댓글 삭제
  function removeComment(url: string, commentId: string): boolean {
    const comments = documentComments.value.get(url)
    if (!comments) return false

    const index = comments.findIndex((c) => c.id === commentId)
    if (index > -1) {
      comments.splice(index, 1)
      return true
    }
    return false
  }

  // Actions: 샘플 댓글 데이터 생성
  function generateSampleComments(): void {
    // localhost:5173 댓글
    const localhostComments: Comment[] = [
      {
        id: generateId(),
        nametag: '개발자A • 프론트엔드',
        content:
          '이 페이지의 UI가 정말 깔끔하네요! Vue 3 Composition API를 사용하신 것 같은데 코드 구조가 인상적입니다.',
        createdAt: new Date('2025-10-15T10:30:00'),
      },
      {
        id: generateId(),
        nametag: '디자이너B • UX/UI',
        content:
          '색상 조합이 마음에 듭니다. 특히 `color_template.css`의 그레이 레벨 구분이 좋아요.\n\n**개선 제안:**\n- 버튼 호버 효과를 조금 더 명확하게\n- 모바일 반응형 고려',
        createdAt: new Date('2025-10-16T14:20:00'),
      },
      {
        id: generateId(),
        nametag: '개발자C • 백엔드',
        content:
          '# API 연동 관련\n\n댓글 시스템 구현 시 다음 엔드포인트를 사용하세요:\n\n```javascript\nPOST /api/comments\nGET /api/comments/:documentId\nDELETE /api/comments/:commentId\n```\n\n인증은 JWT 토큰 방식입니다.',
        createdAt: new Date('2025-10-17T09:15:00'),
      },
    ]

    // naver.com 댓글
    const naverComments: Comment[] = [
      {
        id: generateId(),
        nametag: '사용자D • 일반',
        content: '네이버 메인 페이지는 항상 정보가 풍부하네요. 뉴스 섹션이 특히 유용합니다.',
        createdAt: new Date('2025-10-16T08:00:00'),
      },
      {
        id: generateId(),
        nametag: '마케터E • 디지털 마케팅',
        content:
          '네이버의 검색 알고리즘이 최근 업데이트된 것 같아요. SEO 전략을 다시 검토해야겠습니다.\n\n참고: [네이버 검색 가이드](https://searchadvisor.naver.com/)',
        createdAt: new Date('2025-10-17T11:45:00'),
      },
    ]

    // google.com 댓글
    const googleComments: Comment[] = [
      {
        id: generateId(),
        nametag: '연구원F • AI/ML',
        content:
          '구글의 새로운 Gemini 모델이 정말 인상적입니다!\n\n## 주요 특징\n1. 멀티모달 처리\n2. 긴 컨텍스트 지원\n3. 빠른 응답 속도\n\n수식 예시: \\(E = mc^2\\)',
        createdAt: new Date('2025-10-15T16:30:00'),
      },
      {
        id: generateId(),
        nametag: '개발자G • 풀스택',
        content:
          'Google Cloud Platform의 무료 티어를 활용하면 소규모 프로젝트 배포가 편리합니다. Firebase도 함께 사용하면 좋아요.',
        createdAt: new Date('2025-10-16T13:20:00'),
      },
      {
        id: generateId(),
        nametag: '학생H • 컴퓨터공학',
        content:
          '구글 검색 팁을 공유합니다:\n\n- `site:` 연산자로 특정 사이트 내 검색\n- `filetype:pdf` 로 PDF 파일만 검색\n- 따옴표로 정확한 구문 검색\n\n매우 유용해요!',
        createdAt: new Date('2025-10-18T07:00:00'),
      },
    ]

    // Map에 저장
    documentComments.value.set('http://localhost:5173/', localhostComments)
    documentComments.value.set('https://www.naver.com/', naverComments)
    documentComments.value.set('https://www.google.com/', googleComments)
  }

  // Actions: 초기화
  function resetComments(): void {
    documentComments.value.clear()
  }

  return {
    // State
    documentComments,
    currentUser,

    // Computed
    currentUserNametag,

    // Actions
    getComments,
    addComment,
    removeComment,
    generateSampleComments,
    resetComments,
  }
})
