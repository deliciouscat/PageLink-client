<template>
  <div class="toolbar" ref="toolbarRef">
    <!-- Blank (default) -->
    <div class="toolbar-item blank" :style="{ flex: placementSizes[0] }" @click="handleBlankClick"></div>

    <!-- Search Button -->
    <button class="toolbar-item icon-button" @click="handleSearchClick" :class="{ active: state === 'search' }">
      <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
        <path
          d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" />
      </svg>
    </button>

    <!-- Blank/TextInput (search) -->
    <div class="toolbar-item" :style="{ flex: placementSizes[2] }">
      <input v-if="state === 'search' && placementSizes[2] === 1" ref="searchInputRef" type="text" v-model="searchInput"
        @input="handleSearchInput" @keyup.enter="handleSearchSubmit" placeholder="검색..." class="text-input" />
    </div>

    <!-- Add Button -->
    <button class="toolbar-item icon-button" @click="handleAddClick" :class="{ active: state === 'add' }">
      <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
        <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
      </svg>
    </button>

    <!-- Blank/TextInput (add) -->
    <div class="toolbar-item" :style="{ flex: placementSizes[4] }">
      <input v-if="state === 'add' && placementSizes[4] === 1" ref="addInputRef" type="text" v-model="addInput"
        @keyup.enter="handleAddSubmit" placeholder="새 컬렉션..." class="text-input" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useFileSystemStore } from '@/stores/DataComponents'

// Props & Emits
const emit = defineEmits<{
  toolbarOperation: [value: { toolbar_operation: 'search' | 'add', toolbar_input: string }]
}>()

// Store
const fileSystemStore = useFileSystemStore()

// State
const state = ref<'default' | 'search' | 'add'>('default')
const searchInput = ref('')
const addInput = ref('')

// Refs
const toolbarRef = ref<HTMLElement>()
const searchInputRef = ref<HTMLInputElement>()
const addInputRef = ref<HTMLInputElement>()

// Computed placement sizes based on state
const placementSizes = computed(() => {
  switch (state.value) {
    case 'search':
      return [0, 0, 1, 0, 0] // [Blank(0), search_button, TextInput(1), add_button, Blank(0)]
    case 'add':
      return [0, 0, 0, 0, 1] // [Blank(0), search_button, Blank(0), add_button, TextInput(1)]
    default:
      return [1, 0, 0, 0, 0] // [Blank(1), search_button, Blank(0), add_button, Blank(0)]
  }
})

// Animation delay
const animationDelay = 100 // 0.1 seconds

// Handle search button click
async function handleSearchClick() {
  if (state.value === 'search') {
    handleSearchSubmit()
    return
  }

  state.value = 'search'
  await nextTick()
  setTimeout(() => {
    searchInputRef.value?.focus()
  }, animationDelay)
}

// Handle add button click
async function handleAddClick() {
  if (state.value === 'add') {
    handleAddSubmit()
    return
  }

  state.value = 'add'
  await nextTick()
  setTimeout(() => {
    addInputRef.value?.focus()
  }, animationDelay)
}

// Handle blank click (return to default)
function handleBlankClick() {
  resetToDefault()
}

// Handle search input
function handleSearchInput() {
  fileSystemStore.search(searchInput.value)
}

// Handle search submit
function handleSearchSubmit() {
  if (searchInput.value.trim()) {
    emit('toolbarOperation', {
      toolbar_operation: 'search',
      toolbar_input: searchInput.value
    })
  }
}

// Handle add submit
function handleAddSubmit() {
  if (addInput.value.trim()) {
    fileSystemStore.createCollection(addInput.value)
    emit('toolbarOperation', {
      toolbar_operation: 'add',
      toolbar_input: addInput.value
    })
    addInput.value = ''
    resetToDefault()
  }
}

// Reset to default state
function resetToDefault() {
  state.value = 'default'
  searchInput.value = ''
  addInput.value = ''
  fileSystemStore.clearSearch()
}

// Handle clicks outside toolbar (in AppHeader area)
function handleOutsideClick(event: MouseEvent) {
  if (toolbarRef.value && !toolbarRef.value.contains(event.target as Node)) {
    const appHeader = toolbarRef.value.closest('.app-header')
    if (appHeader && appHeader.contains(event.target as Node)) {
      resetToDefault()
    }
  }
}

// Watch for state changes to clear inputs when returning to default
watch(state, (newState) => {
  if (newState === 'default') {
    searchInput.value = ''
    addInput.value = ''
    fileSystemStore.clearSearch()
  }
})

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background-color: #ffffff;
  border-radius: 0;
  /* Brutalism: no rounding */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toolbar-item {
  transition: flex 0.3s ease-in-out;
  overflow: hidden;
  min-width: 0;
}

.blank {
  cursor: pointer;
}

.icon-button {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border: none;
  background-color: transparent;
  cursor: pointer;
  border-radius: 0;
  /* Brutalism: no rounding */
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}


.icon-button svg {
  fill: #333;
}

.text-input {
  width: 100%;
  height: 40px;
  border: none;
  border-radius: 0;
  /* Brutalism: no rounding */
  padding: 0 16px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}
</style>
