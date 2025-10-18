<script setup lang="ts">
/**
 * CommentBox 컴포넌트
 *
 * 역할:
 * - 개별 댓글을 표시
 * - 확장/축소 상태를 props로 받아 처리
 * - Markdown 및 KaTeX 렌더링 지원
 */

import { computed } from 'vue'
import { marked } from 'marked'
import katex from 'katex'

// Props 정의
interface Props {
  nametag: string
  content: string
  commentId: string
  isExpanded: boolean
}

const props = defineProps<Props>()

// Emits 정의
const emit = defineEmits<{
  expand: [id: string]
}>()

// Markdown + KaTeX 렌더링
const renderedContent = computed(() => {
  if (!props.isExpanded) {
    return props.content
  }

  // Markdown 렌더링
  let html = marked(props.content) as string

  // KaTeX 인라인 수식 렌더링: \(...\)
  html = html.replace(/\\\((.*?)\\\)/g, (match, formula) => {
    try {
      return katex.renderToString(formula, { displayMode: false, throwOnError: false })
    } catch (e) {
      return match
    }
  })

  // KaTeX 블록 수식 렌더링: \[...\]
  html = html.replace(/\\\[(.*?)\\\]/gs, (match, formula) => {
    try {
      return katex.renderToString(formula, { displayMode: true, throwOnError: false })
    } catch (e) {
      return match
    }
  })

  return html
})

// 클릭 핸들러
function handleClick(event: Event) {
  event.stopPropagation() // 이벤트 버블링 방지
  emit('expand', props.commentId)
}
</script>

<template>
  <div class="comment-box" :class="{ expanded: isExpanded }" @click="handleClick">
    <!-- Nametag -->
    <div class="nametag" v-html="nametag"></div>

    <!-- Spacing -->
    <div class="spacing"></div>

    <!-- Content -->
    <div v-if="isExpanded" class="content expanded-content" v-html="renderedContent"></div>
    <div v-else class="content collapsed-content">
      {{ content }}
    </div>
  </div>
</template>

<style scoped>
/* ==================== Comment Box Container ==================== */
/**
 * 댓글 박스 기본 스타일
 * - 확장/축소 상태에 따라 스타일 변경
 */
.comment-box {
  display: flex;
  flex-direction: column;
  width: 100%;
  border: 1px solid var(--grey-lv2);
  border-radius: 0;
  padding: 16px;
  background-color: var(--background);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

/* 축소 상태 */
.comment-box:not(.expanded) {
  height: 96px;
  background: linear-gradient(to bottom,
      var(--background) 0%,
      var(--background) 70%,
      var(--background) 100%);
}

.comment-box:not(.expanded):hover {
  background-color: var(--grey-lv1);
}

/* 확장 상태 */
.comment-box.expanded {
  height: auto;
  background-color: var(--background);
  cursor: default;
}

/* ==================== Nametag ==================== */
/**
 * 작성자 정보 표시
 */
.nametag {
  font-size: 14px;
  font-weight: 600;
  color: var(--font-black);
  margin-bottom: 8px;
}

/* ==================== Spacing ==================== */
.spacing {
  height: 8px;
}

/* ==================== Content ==================== */
/**
 * 댓글 내용
 */
.content {
  font-size: 14px;
  line-height: 1.6;
  color: var(--font-black);
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* 축소 상태 콘텐츠 */
.collapsed-content {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  position: relative;
}

.comment-box:not(.expanded)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 32px;
  background: linear-gradient(to bottom,
      transparent 0%,
      var(--background) 100%);
  pointer-events: none;
}

.comment-box:not(.expanded):hover::after {
  background: linear-gradient(to bottom,
      transparent 0%,
      var(--grey-lv1) 100%);
}

/* 확장 상태 콘텐츠 */
.expanded-content {
  max-height: none;
}

/* Markdown 렌더링 스타일 */
.expanded-content :deep(h1),
.expanded-content :deep(h2),
.expanded-content :deep(h3) {
  margin-top: 16px;
  margin-bottom: 8px;
  font-weight: 600;
}

.expanded-content :deep(h1) {
  font-size: 20px;
}

.expanded-content :deep(h2) {
  font-size: 18px;
}

.expanded-content :deep(h3) {
  font-size: 16px;
}

.expanded-content :deep(p) {
  margin-bottom: 12px;
}

.expanded-content :deep(ul),
.expanded-content :deep(ol) {
  margin-left: 20px;
  margin-bottom: 12px;
}

.expanded-content :deep(li) {
  margin-bottom: 4px;
}

.expanded-content :deep(code) {
  background-color: var(--grey-lv1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 13px;
}

.expanded-content :deep(pre) {
  background-color: var(--grey-lv1);
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 12px;
}

.expanded-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
}

.expanded-content :deep(blockquote) {
  border-left: 4px solid var(--grey-lv3);
  padding-left: 16px;
  margin-left: 0;
  margin-bottom: 12px;
  color: var(--grey-lv4);
}

.expanded-content :deep(a) {
  color: var(--primary);
  text-decoration: underline;
}

.expanded-content :deep(strong) {
  font-weight: 600;
}

.expanded-content :deep(em) {
  font-style: italic;
}

/* KaTeX 스타일 */
.expanded-content :deep(.katex) {
  font-size: 1.1em;
}

.expanded-content :deep(.katex-display) {
  margin: 16px 0;
  overflow-x: auto;
  overflow-y: hidden;
}
</style>
