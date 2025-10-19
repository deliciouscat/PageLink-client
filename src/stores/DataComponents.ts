import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import sampleDataJson from '@/data/sampleData.json'
import sampleCommentsJson from '@/data/sampleComments.json'

// ===========================
// 1. 인터페이스 & 클래스 정의
// ===========================

// 샘플 데이터 타입 정의
interface SampleDocument {
  passage: string
  tags: string[]
  url: string
}

interface SampleCollection {
  name: string
  documents: SampleDocument[]
}

interface SampleCommentData {
  nametag: string
  content: string
  createdAt: string
}

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
  url: string

  constructor(passage: string, tags: string[] = [], url: string = '') {
    super(passage)
    this.tags = tags
    this.url = url
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
    url: string = '',
  ): Document | null {
    const collection = collections.value.find((col) => col.id === collectionId)
    if (collection) {
      const doc = new Document(passage, tags, url)
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
    // JSON 파일에서 샘플 데이터 로드
    sampleDataJson.collections.forEach((collectionData: SampleCollection) => {
      const collection = createCollection(collectionData.name)
      collectionData.documents.forEach((docData: SampleDocument) => {
        addDocument(collection.id, docData.passage, docData.tags, docData.url)
      })
    })
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
    // JSON 파일에서 샘플 댓글 데이터 로드
    Object.entries(sampleCommentsJson.comments).forEach(([url, comments]) => {
      const commentsList: Comment[] = comments.map((commentData: SampleCommentData) => ({
        id: generateId(),
        nametag: commentData.nametag,
        content: commentData.content,
        createdAt: new Date(commentData.createdAt),
      }))
      documentComments.value.set(url, commentsList)
    })
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
