import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import i18n from './i18n'
import './styles/color_template.css'
//import TestToolBar from './TestToolBar-test.vue'
//import TestAppHeader from './TestAppHeader-test.vue'

const app = createApp(App)
//const app = createApp(TestToolBar)
//const app = createApp(TestAppHeader)

app.use(createPinia())
app.use(i18n)

app.mount('#app')
