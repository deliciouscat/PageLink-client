import { createI18n } from 'vue-i18n'
import ko from './locales/ko.json'
import en from './locales/en.json'

const messages = {
  ko,
  en,
}

const i18n = createI18n({
  legacy: false,
  locale: 'ko', // default locale
  fallbackLocale: 'en',
  messages,
})

export default i18n
