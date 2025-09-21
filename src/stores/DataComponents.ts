import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// FileSystem 인터페이스 정의
interface FileSystem {
    passage: string
    visible: boolean
    updateVisible(searchTerm?: string): boolean
}

// Leaf 패턴: Document 클래스
export class Document implements FileSystem {
    passage: string
    visible: boolean

    constructor(passage: string) {
        this.passage = passage
        this.visible = true // 기본값은 true (검색 중이 아닐 때 모든 항목 표시)
    }

    /**
     * 검색어와 매칭되는지 확인하여 visible 상태 업데이트
     * @param searchTerm 검색어 (없으면 모든 항목 visible = true)
     * @returns visible 상태
     */
    updateVisible(searchTerm?: string): boolean {
        if (!searchTerm || searchTerm.trim() === '') {
            this.visible = true
        } else {
            // passage에 검색어가 포함되어 있는지 확인 (대소문자 구분 없음)
            this.visible = this.passage.toLowerCase().includes(searchTerm.toLowerCase())
        }
        return this.visible
    }
}

// Composite 패턴: Collection 클래스
export class Collection implements FileSystem {
    passage: string
    visible: boolean
    children: (Document | Collection)[]

    constructor(passage: string) {
        this.passage = passage
        this.visible = true // 기본값은 true
        this.children = []
    }

    /**
     * Document를 children에 추가
     * @param item 추가할 Document 또는 Collection
     */
    addDocument(item: Document | Collection): void {
        this.children.push(item)
    }

    /**
     * Collection에서 항목 제거
     * @param item 제거할 Document 또는 Collection
     */
    removeDocument(item: Document | Collection): void {
        const index = this.children.indexOf(item)
        if (index > -1) {
            this.children.splice(index, 1)
        }
    }

    /**
     * 검색 기능 사용 중에 호출되는 함수
     * children에 visible이 true인 것이 있거나, 자기 자신이 visible이 true인 경우 true
     * @param searchTerm 검색어
     * @returns visible 상태
     */
    updateVisible(searchTerm?: string): boolean {
        if (!searchTerm || searchTerm.trim() === '') {
            // 검색어가 없으면 모든 항목을 visible로 설정
            this.visible = true
            this.children.forEach(child => child.updateVisible())
            return this.visible
        }

        // 먼저 자기 자신의 passage 확인
        const selfMatches = this.passage.toLowerCase().includes(searchTerm.toLowerCase())
        
        // children들의 visible 상태 업데이트
        const hasVisibleChildren = this.children.some(child => child.updateVisible(searchTerm))
        
        // 자기 자신이 매칭되거나 visible한 children이 있으면 visible = true
        this.visible = selfMatches || hasVisibleChildren
        
        return this.visible
    }

    /**
     * 모든 visible한 children 반환 (재귀적)
     * @returns visible한 children 배열
     */
    getVisibleChildren(): (Document | Collection)[] {
        return this.children.filter(child => child.visible)
    }

    /**
     * 전체 트리에서 모든 Document 검색 (재귀적)
     * @returns 모든 Document 배열
     */
    getAllDocuments(): Document[] {
        const documents: Document[] = []
        
        this.children.forEach(child => {
            if (child instanceof Document) {
                documents.push(child)
            } else if (child instanceof Collection) {
                documents.push(...child.getAllDocuments())
            }
        })
        
        return documents
    }

    /**
     * visible한 모든 Document 검색 (재귀적)
     * @returns visible한 Document 배열
     */
    getVisibleDocuments(): Document[] {
        const documents: Document[] = []
        
        this.children.forEach(child => {
            if (child.visible) {
                if (child instanceof Document) {
                    documents.push(child)
                } else if (child instanceof Collection) {
                    documents.push(...child.getVisibleDocuments())
                }
            }
        })
        
        return documents
    }
}