<!--
# pseudo code

appHeaderArea = // 앱 헤더 영역

placement = [Blank(), Icon("material-symbols: search icon"), Icon("material-symbols: plus icon")]    // default
toolbar = dynamic HorizonalGrid(placement)

if last_click = "search icon" :
    placement = [Icon("material-symbols: search icon"), Blank(), Icon("material-symbols: plus icon")]
    sleep(0.2 seconds)
    placement.swap_blank_to(TextInputBox())

if last_click = "plus icon" :
    placement = [Icon("material-symbols: search icon"), Icon("material-symbols: plus icon"), Blank()]
    sleep(0.2 seconds)
    placement.swap_blank_to(TextInputBox())

if last_click not in ["search icon", "plus icon"] and last_click in appHeaderArea :
    placement = [Blank(), Icon("material-symbols: search icon"), Icon("material-symbols: plus icon")]    // back todefault

-->

<template>
    <div class="app-header-area" @click="handleHeaderClick" ref="headerRef">
        <div class="toolbar" ref="toolbarRef">
            <div v-for="(item, index) in placement" :key="`${item.type}-${index}`" class="toolbar-item"
                :class="item.type" @click="handleItemClick(item.type, $event)">
                <!-- Search Icon -->
                <div v-if="item.type === 'search'" class="icon search-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24">
                        <path fill="currentColor"
                            d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                    </svg>
                </div>

                <!-- Plus Icon -->
                <div v-else-if="item.type === 'plus'" class="icon plus-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                </div>

                <!-- Text Input -->
                <input v-else-if="item.type === 'input'" type="text" class="text-input" :placeholder="inputPlaceholder"
                    v-model="inputValue" ref="textInputRef" />

                <!-- Blank Space -->
                <div v-else-if="item.type === 'blank'" class="blank-space"></div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, nextTick, computed, onMounted } from 'vue'
import { gsap } from 'gsap'

// Reactive state
const lastClick = ref('')
const inputValue = ref('')
const headerRef = ref(null)
const toolbarRef = ref(null)
const textInputRef = ref(null)

// Default placement configuration
const defaultPlacement = [
    { type: 'blank', id: 'blank' },
    { type: 'search', id: 'search' },
    { type: 'plus', id: 'plus' }
]

const placement = reactive([...defaultPlacement])

// Computed properties
const inputPlaceholder = computed(() => {
    return lastClick.value === 'search' ? '검색어를 입력하세요...' : '새 파일 이름...'
})

// Animation timeline
let tl = null

// Handle item click (icons)
const handleItemClick = async (type, event) => {
    event.stopPropagation()

    if (type === 'search' || type === 'plus') {
        lastClick.value = type
        await animateToNewLayout(type)
    }
}

// Handle header area click (reset to default)
const handleHeaderClick = async (event) => {
    const clickedElement = event.target.closest('.toolbar-item')

    // If clicked outside toolbar items or on blank space, reset to default
    if (!clickedElement || clickedElement.classList.contains('blank')) {
        lastClick.value = ''
        await animateToDefault()
    }
}

// Animate to new layout based on clicked icon
const animateToNewLayout = async (clickedType) => {
    // Kill any existing animation
    if (tl) tl.kill()

    // Create new timeline
    tl = gsap.timeline()

    // Step 1: Slide to new positions
    if (clickedType === 'search') {
        // [Search, Blank, Plus]
        placement[0] = { type: 'search', id: 'search' }
        placement[1] = { type: 'blank', id: 'blank' }
        placement[2] = { type: 'plus', id: 'plus' }
    } else if (clickedType === 'plus') {
        // [Search, Plus, Blank]
        placement[0] = { type: 'search', id: 'search' }
        placement[1] = { type: 'plus', id: 'plus' }
        placement[2] = { type: 'blank', id: 'blank' }
    }

    await nextTick()

    // Animate the sliding
    tl.from('.toolbar-item', {
        x: (index, element) => {
            const rect = element.getBoundingClientRect()
            return Math.random() * 100 - 50 // Random slide effect
        },
        opacity: 0.7,
        duration: 0.3,
        stagger: 0.05,
        ease: "power2.out"
    })

    // Step 2: Wait 0.2 seconds then swap blank to input
    tl.to({}, { duration: 0.2 })
        .call(() => {
            swapBlankToInput()
        })
}

// Swap blank space to text input
const swapBlankToInput = async () => {
    // Find blank and replace with input
    const blankIndex = placement.findIndex(item => item.type === 'blank')
    if (blankIndex !== -1) {
        placement[blankIndex] = { type: 'input', id: 'input' }
    }

    await nextTick()

    // Animate input appearance and focus
    gsap.from('.text-input', {
        scale: 0.8,
        opacity: 0,
        duration: 0.3,
        ease: "back.out(1.7)",
        onComplete: () => {
            // Focus the input after animation
            if (textInputRef.value && textInputRef.value[0]) {
                textInputRef.value[0].focus()
            }
        }
    })
}

// Animate back to default layout
const animateToDefault = async () => {
    if (tl) tl.kill()

    tl = gsap.timeline()

    // Animate current items out
    tl.to('.toolbar-item', {
        scale: 0.8,
        opacity: 0.5,
        duration: 0.2,
        stagger: 0.03
    })
        .call(() => {
            // Reset to default placement
            placement[0] = { type: 'blank', id: 'blank' }
            placement[1] = { type: 'search', id: 'search' }
            placement[2] = { type: 'plus', id: 'plus' }
            inputValue.value = ''
        })
        .to('.toolbar-item', {
            scale: 1,
            opacity: 1,
            duration: 0.3,
            stagger: 0.05,
            ease: "back.out(1.7)"
        })

    await nextTick()
}

onMounted(() => {
    // Initialize GSAP
    gsap.set('.toolbar-item', { transformOrigin: 'center center' })
})
</script>

<style scoped>
.app-header-area {
    width: 100%;
    cursor: pointer;
}

.toolbar {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 16px;
    max-width: 400px;
    margin: 0 auto;
}

.toolbar-item {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 48px;
}

.icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    cursor: pointer;
    flex-shrink: 0;
}

.text-input {
    width: 100%;
    height: 24px;
    border: none;
    outline: none;
    font-size: 14px;
    flex-grow: 1;
}

.blank-space {
    width: 100%;
    height: 24px;
    opacity: 0;
    flex-grow: 1;
}
</style>