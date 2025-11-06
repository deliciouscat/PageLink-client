import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { clerkPlugin } from '@clerk/vue'
import App from './App.vue'
import i18n from './i18n'
import './styles/color_template.css'
//import TestToolBar from './TestToolBar-test.vue'
//import TestAppHeader from './TestAppHeader-test.vue'

// Clerk Publishable Key 확인
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  console.warn('Clerk Publishable Key are not set')
}

const app = createApp(App)
//const app = createApp(TestToolBar)
//const app = createApp(TestAppHeader)

app.use(createPinia())
app.use(i18n)

// Clerk 플러그인 추가 (Key가 있을 때만)
if (PUBLISHABLE_KEY) {
  app.use(clerkPlugin, {
    publishableKey: PUBLISHABLE_KEY,
  })
}

app.mount('#app')
