<template>
  <div class="modal-backdrop" @click="handleReject">
    <div class="modal-content" @click.stop>
      <!-- 제목 -->
      <h2 class="modal-title">{{ $t('terms_of_service') }}</h2>

      <!-- 약관 내용 -->
      <div class="terms-box" v-html="renderedTerms"></div>

      <!-- 버튼 영역 -->
      <div class="button-container">
        <button class="button-reject" @click="handleReject">
          {{ $t('reject') }}
        </button>
        <button class="button-accept" @click="handleAccept">
          {{ $t('accept') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { marked } from 'marked'
import { useI18n } from 'vue-i18n'

// i18n
const { t: $t } = useI18n()

// Emits
const emit = defineEmits<{
  accept: []
  reject: []
}>()

// 약관 내용
const renderedTerms = ref<string>('')

// 약관 로드
onMounted(async () => {
  try {
    // 약관 마크다운 파일 로드
    const response = await fetch('/src/components/assets/terms_of_service.md')
    const markdown = await response.text()

    // 마크다운을 HTML로 변환
    renderedTerms.value = marked(markdown) as string
  } catch (error) {
    console.error('Failed to load terms of service:', error)
    renderedTerms.value = '<p>약관을 불러오는데 실패했습니다.</p>'
  }
})

// 동의 처리
function handleAccept() {
  emit('accept')
}

// 거부 처리
function handleReject() {
  emit('reject')
}
</script>

<style scoped>
/* 모달 배경 */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* 모달 컨텐츠 */
.modal-content {
  background-color: var(--background);
  border: 1px solid var(--grey-lv3);
  border-radius: 2px;
  padding: 24px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 제목 */
.modal-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--font-black);
  margin: 0;
}

/* 약관 박스 */
.terms-box {
  background-color: var(--background);
  border: 1px solid var(--grey-lv3);
  border-radius: 2px;
  padding: 16px;
  overflow-y: auto;
  flex: 1;
  min-height: 300px;
  max-height: 400px;
  color: var(--font-black);
  line-height: 1.6;
}

/* 약관 내용 스타일 */
.terms-box :deep(h1),
.terms-box :deep(h2),
.terms-box :deep(h3) {
  margin-top: 16px;
  margin-bottom: 8px;
  color: var(--font-black);
}

.terms-box :deep(p) {
  margin-bottom: 12px;
}

.terms-box :deep(ul),
.terms-box :deep(ol) {
  margin-left: 20px;
  margin-bottom: 12px;
}

/* 버튼 컨테이너 */
.button-container {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;
}

/* 공통 버튼 스타일 */
.button-reject,
.button-accept {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

/* 거부 버튼 */
.button-reject {
  background-color: var(--grey-lv1);
  color: var(--main);
}

.button-reject:hover {
  background-color: var(--grey-lv2);
}

/* 동의 버튼 */
.button-accept {
  background-color: var(--grey-lv1);
  color: var(--main);
  border-color: var(--main);
}

.button-accept:hover {
  background-color: var(--main);
  color: var(--background);
}
</style>
