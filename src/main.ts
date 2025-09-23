import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
//import TestToolBar from './TestToolBar-test.vue'

const app = createApp(App)
//const app = createApp(TestToolBar)

app.use(createPinia())

app.mount('#app')
