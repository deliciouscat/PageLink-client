<template>
  <div class="app-header">
    <!-- Top Section: Logo, Account, Settings, Mode Toggle -->
    <div class="header-top">
      <div class="logo-section">
        <img src="@/components/assets/logo.svg" alt="Logo" class="logo" />
      </div>

      <div class="control-section">
        <!-- Account Button -->
        <button class="icon-button" @click="accountMenuDisplay" title="계정">
          <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
            <path
              d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Z" />
          </svg>
        </button>

        <!-- Settings Button -->
        <button class="icon-button" @click="settingsMenuDisplay" title="설정">
          <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
            <path
              d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-15.5t1-15.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 15.5t-1 15.5l103 78-110 190-119-50q-11 8-23 15t-24 12L590-80H370Z" />
          </svg>
        </button>

        <!-- Mode Toggle Button -->
        <button class="mode-toggle-button" @click="swapMode">
          {{ $t(displayMode.swapTo) }}
        </button>
      </div>
    </div>

    <!-- ToolBar Section -->
    <ToolBar @toolbar-operation="handleToolbarOperation" />

    <!-- Horizontal Line -->
    <div class="horizontal-line"></div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import ToolBar from './ToolBar.vue'

// i18n
const { t: $t } = useI18n()

// Props & Emits
const emit = defineEmits<{
  displayModeChange: [value: {
    currentMode: string,
    swapTo: string,
    locale: string,
    overlay: string | null
  }]
  toolbarOperation: [value: { toolbar_operation: 'search' | 'add', toolbar_input: string }]
}>()

// DisplayMode class implementation
interface DisplayModeInterface {
  currentMode: string
  swapTo: string
  locale: string
  overlay: string | null
}

const displayMode = reactive<DisplayModeInterface>({
  currentMode: 'bookmark',
  swapTo: 'explore',
  locale: 'ko', // TODO: config에서 가져와야 함
  overlay: null
})

// DisplayMode swap function
function swapMode() {
  const temp = displayMode.currentMode
  displayMode.currentMode = displayMode.swapTo
  displayMode.swapTo = temp

  // Emit display mode change
  emit('displayModeChange', { ...displayMode })
}

// Account menu display function
function accountMenuDisplay() {
  console.log("준비중인 기능입니다.") // account_menu
  displayMode.overlay = "account"
}

// Settings menu display function
function settingsMenuDisplay() {
  console.log("준비중인 기능입니다.") // settings_menu
  displayMode.overlay = "settings"
}

// Handle toolbar operation from ToolBar component
function handleToolbarOperation(payload: { toolbar_operation: 'search' | 'add', toolbar_input: string }) {
  emit('toolbarOperation', payload)
}

// Export display mode for parent components
defineExpose({
  displayMode
})
</script>

<style scoped>
.app-header {
  background-color: var(--background);
  border-bottom: 1px solid var(--grey-lv2);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
}

.logo-section {
  display: flex;
  align-items: center;
}

.logo {
  height: 32px;
  width: auto;
}

.control-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background-color: transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.icon-button:hover {
  background-color: var(--grey-lv1);
}

.icon-button svg {
  fill: var(--main);
}

.mode-toggle-button {
  padding: 8px 16px;
  border: 2px solid var(--grey-lv2);
  border-radius: 4px;
  background-color: transparent;
  color: var(--font-black);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.horizontal-line {
  height: 4px;
  background-color: var(--main);
  width: 100%;
}
</style>
