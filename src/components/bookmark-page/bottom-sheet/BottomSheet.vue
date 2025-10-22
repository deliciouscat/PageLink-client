<script setup lang="ts">
/**
 * BottomSheet 컴포넌트
 *
 * 역할:
 * - Document(웹페이지)의 댓글을 표시
 * - 댓글 작성 기능
 * - 댓글 확장/축소 관리
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { PhPencilSimpleLine, PhPaperPlaneTilt } from '@phosphor-icons/vue'
import CommentBox from './CommentBox.vue'
import { useCommentsStore } from '@/stores/DataComponents'

// Props 정의
interface Props {
  currentUrl: string
}

const props = defineProps<Props>()

// Store
const commentsStore = useCommentsStore()

// 로컬 상태
const expandedCommentId = ref<string | null>(null)
const isWriting = ref(false)
const commentInput = ref('')
const windowHeight = ref(window.innerHeight)

// Computed: 현재 URL의 댓글 목록
const comments = computed(() => {
  return commentsStore.getComments(props.currentUrl)
})

// Computed: 댓글 박스 높이 계산 (pseudo code 기준)
// dynamic_height = 24 + 64 * len(doc_comment) + (확장된 댓글이 있으면 100 추가)
// comment_box_height = Min([Max([200, dynamic_height])px, `75% of max height`])
const commentBoxHeight = computed(() => {
  let dynamicHeight = 100 + 50 * comments.value.length
  // 확장된 댓글이 있으면 100 추가
  if (expandedCommentId.value !== null) {
    dynamicHeight += 150
  }

  const minHeight = 275
  const maxHeightPercent = 75 // 화면의 75%
  const maxHeight = (windowHeight.value * maxHeightPercent) / 100

  return Math.min(Math.max(minHeight, dynamicHeight), maxHeight)
})

// 브라우저 크기 변경 감지
function handleResize() {
  windowHeight.value = window.innerHeight
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// Methods: 댓글 확장/축소 핸들러
function handleCommentExpand(commentId: string) {
  if (expandedCommentId.value === commentId) {
    expandedCommentId.value = null // 같은 것 클릭 시 축소
  } else {
    expandedCommentId.value = commentId // 다른 것 클릭 시 확장
  }
}

// Methods: 바깥 클릭 핸들러
function handleOutsideClick() {
  expandedCommentId.value = null // 모든 확장 해제
}

// Methods: 댓글 작성 모드 활성화
function handleWriteMode() {
  isWriting.value = true
}

// Methods: 댓글 전송
function handleSendComment() {
  if (commentInput.value.trim() === '') return

  commentsStore.addComment(props.currentUrl, commentInput.value)
  commentInput.value = ''
  isWriting.value = false
}

// Methods: 작성 취소
function handleCancelWrite() {
  isWriting.value = false
  commentInput.value = ''
}
</script>

<template>
  <div class="bottom-sheet" @click="handleOutsideClick">
    <!-- 상단 그라데이션 영역 -->
    <div class="gradient-header" @click="handleOutsideClick"></div>

    <!-- 헤더 영역 -->
    <div class="header" @click.stop>
      <div class="nametag-container">
        <span class="user-nickname">{{ commentsStore.currentUser.nickname }}</span>
        <span class="separator"> • </span>
        <span class="user-epithet">{{ commentsStore.currentUser.epithet }}</span>
      </div>

      <button v-if="!isWriting" class="write-button" @click="handleWriteMode" aria-label="댓글 작성">
        <PhPencilSimpleLine :size="20" weight="bold" />
      </button>
    </div>

    <!-- 구분선 -->
    <div class="separator-line">
      <div class="line"></div>
    </div>

    <!-- 댓글 목록 또는 작성 박스 -->
    <div v-if="isWriting" class="comment-write-container" @click.stop>
      <textarea v-model="commentInput" class="comment-textarea" placeholder="코멘트를 입력하세요. Markdown과 KaTeX를 지원합니다."
        rows="6" @click.stop></textarea>

      <div class="write-actions">
        <button class="cancel-button" @click="handleCancelWrite">
          취소
        </button>
        <button class="send-button" @click="handleSendComment" :disabled="commentInput.trim() === ''"
          aria-label="댓글 전송">
          <PhPaperPlaneTilt :size="20" weight="bold" />
        </button>
      </div>
    </div>

    <div v-else class="comment-list-container" :style="{ height: `${commentBoxHeight}px` }" @click.stop>
      <div v-if="comments.length === 0" class="empty-state">
        <p>아직 댓글이 없습니다.</p>
        <p class="empty-hint">첫 번째 댓글을 작성해보세요!</p>
      </div>

      <div v-else class="comment-list">
        <CommentBox v-for="comment in comments" :key="comment.id" :nametag="comment.nametag" :content="comment.content"
          :comment-id="comment.id" :is-expanded="expandedCommentId === comment.id" @expand="handleCommentExpand" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ==================== Bottom Sheet Container ==================== */
/**
 * BottomSheet 전체 컨테이너
 */
.bottom-sheet {
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: var(--background);
  border-radius: 0;
  box-shadow: 0 -12px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* ==================== Gradient Header ==================== */
/**
 * 상단 그라데이션 영역
 */
.gradient-header {
  height: 12px;
  background: linear-gradient(to top,
      var(--background) 0%,
      var(--grey-lv2) 100%);
  cursor: pointer;
}

/* ==================== Header ==================== */
/**
 * 헤더 영역 (사용자 정보 + 작성 버튼)
 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
}

.nametag-container {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.user-nickname {
  font-weight: 600;
  color: var(--font-black);
}

.separator {
  color: var(--grey-lv3);
  margin: 0 4px;
}

.user-epithet {
  color: var(--grey-lv3);
}

.write-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--grey-lv4);
  cursor: pointer;
  padding: 4px;
  border-radius: 0;
  transition: all 0.2s ease;
}

.write-button:hover {
  background-color: var(--grey-lv1);
  color: var(--font-black);
}

/* ==================== Separator Line ==================== */
/**
 * 구분선
 */
.separator-line {
  display: flex;
  align-items: center;
  padding: 0 20px;
  margin-bottom: 16px;
}

.line {
  width: 100%;
  height: 2px;
  background-color: var(--grey-lv2);
}

/* ==================== Comment Write Container ==================== */
/**
 * 댓글 작성 영역
 */
.comment-write-container {
  display: flex;
  flex-direction: column;
  padding: 0 20px 20px 20px;
  gap: 12px;
}

.comment-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--grey-lv2);
  border-radius: 0;
  font-size: 14px;
  line-height: 1.6;
  font-family: inherit;
  resize: vertical;
  background-color: var(--background);
  color: var(--font-black);
  transition: border-color 0.2s ease;
}

.comment-textarea:focus {
  outline: none;
  border-color: var(--grey-lv3);
}

.comment-textarea::placeholder {
  color: var(--grey-lv3);
}

.write-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.cancel-button {
  padding: 8px 16px;
  background-color: var(--grey-lv1);
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: var(--font-black);
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-button:hover {
  background-color: var(--grey-lv2);
}

.send-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  background-color: var(--main);
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.send-button:hover:not(:disabled) {
  opacity: 0.8;
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ==================== Comment List Container ==================== */
/**
 * 댓글 목록 영역
 */
.comment-list-container {
  overflow-y: auto;
  padding: 0 20px 20px 20px;
}

.comment-list-container::-webkit-scrollbar {
  width: 6px;
}

.comment-list-container::-webkit-scrollbar-track {
  background: transparent;
}

.comment-list-container::-webkit-scrollbar-thumb {
  background: var(--grey-lv3);
  border-radius: 0;
}

.comment-list-container::-webkit-scrollbar-thumb:hover {
  background: var(--grey-lv4);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: var(--grey-lv3);
  padding: 40px 20px;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.empty-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--grey-lv4);
}

/* Comment List */
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
